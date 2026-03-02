import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { checkPrerequisites } from "../services/prerequisite.service";
import { validateCreditLimit, calculateCurrentCredits } from "../services/credit.service";
import { checkScheduleConflict } from "../services/schedule.service";
import { validateElectiveSelection } from "../services/elective.service";

const prisma = new PrismaClient();

export class CourseController {
  /**
   * Get available courses for student with filters
   * GET /api/courses/available?filter=all|eligible|blocked|improvement|backlog
   */
  static async getAvailableCourses(req: Request, res: Response) {
      try {
        const enrollmentNo = req.user?.enrollmentNo;
        const filter = (req.query.filter as string) || 'all';

        if (!enrollmentNo) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }

        // Check registration deadline
        const registrationDeadline = await prisma.registrationRule.findFirst({
          where: { rule_name: "REGISTRATION_DEADLINE", is_active: true },
        });

        const isRegistrationOpen = registrationDeadline && registrationDeadline.rule_value
          ? new Date(registrationDeadline.rule_value) > new Date()
          : true;

        if (!isRegistrationOpen) {
          res.status(403).json({ 
            error: "Registration window closed",
            deadline: registrationDeadline?.rule_value,
          });
          return;
        }

        // Get student details
        const student = await prisma.student.findUnique({
          where: { enrollment_no: enrollmentNo },
          include: { faculty: true },
        });

        if (!student) {
          res.status(404).json({ error: "Student not found" });
          return;
        }

        // Get all grade records for the student
        const allGradeRecords = await prisma.gradeRecord.findMany({
          where: { enrollment_no: enrollmentNo },
          include: { course: true },
        });

        // Get current registrations
        const currentYear = new Date().getFullYear();
        const semesterType = student.current_semester % 2 === 1 ? 1 : 2;

        const registrations = await prisma.courseRegistration.findMany({
          where: {
            enrollment_no: enrollmentNo,
            academic_year: currentYear,
            semester_type: semesterType,
            deleted_at: null,
          },
        });

        const registeredCodes = registrations.map((r) => r.course_code);

        let courses: any[] = [];
        let electiveGroups: any[] = [];

        // Handle different filters
        if (filter === 'all' || filter === 'eligible') {
          // Show current semester courses (default view)
          const currentSemesterCourses = await prisma.course.findMany({
            where: {
              branch_code: student.faculty?.branch_code,
              semester_no: student.current_semester,
            },
            include: {
              prerequisites: {
                include: { prerequisite: true },
              },
            },
          });

          courses = currentSemesterCourses
            .filter(course => !registeredCodes.includes(course.course_code))
            .map(course => ({
              courseCode: course.course_code,
              courseName: course.course_name,
              credits: course.credits,
              semester: course.semester_no,
              isElective: course.is_elective,
              electiveGroup: course.elective_group,
              courseType: course.course_type,
              isAutoSelected: !course.is_elective, // Auto-select non-elective courses
              registrationType: "regular",
              prerequisites: course.prerequisites?.map((p: any) => ({
                courseCode: p.prerequisite_course_code,
                courseName: p.prerequisite.course_name,
                minGrade: p.min_grade,
              })) || [],
            }));

          // Get elective groups
          const groups = await prisma.electiveGroup.findMany({
            where: {
              branch_code: student.faculty?.branch_code,
              semester_no: student.current_semester,
            },
          });

          electiveGroups = groups.map(group => ({
            groupCode: group.group_code,
            groupName: group.group_name,
            minSelection: group.min_selection,
            maxSelection: group.max_selection,
            courses: courses.filter(c => c.electiveGroup === group.group_code),
          }));

        } else if (filter === 'backlog') {
          // Show backlog courses (failed courses)
          const failedGrades = allGradeRecords.filter(record => 
            record.grade === 'E' || record.grade === 'F'
          );

          // Group by course to count attempts
          const courseAttemptsMap = new Map<string, any[]>();
          allGradeRecords.forEach(record => {
            if (!courseAttemptsMap.has(record.course_code)) {
              courseAttemptsMap.set(record.course_code, []);
            }
            courseAttemptsMap.get(record.course_code)!.push(record);
          });

          courses = failedGrades
            .filter(record => {
              // Check if not already passed in a later attempt
              const attempts = courseAttemptsMap.get(record.course_code) || [];
              const hasPassed = attempts.some(a => 
                a.grade && ['D', 'C', 'B', 'B+', 'A', 'A+'].includes(a.grade)
              );
              return !hasPassed && !registeredCodes.includes(record.course_code);
            })
            .map(record => {
              const attempts = courseAttemptsMap.get(record.course_code) || [];
              const lastAttempt = attempts[attempts.length - 1];

              return {
                courseCode: record.course.course_code,
                courseName: record.course.course_name,
                credits: record.course.credits,
                semester: record.course.semester_no,
                isElective: record.course.is_elective,
                electiveGroup: record.course.elective_group,
                courseType: record.course.course_type,
                isAutoSelected: false,
                registrationType: "backlog",
                previousAttempts: attempts.length,
                lastGrade: lastAttempt.grade,
                lastGradePoints: Number(lastAttempt.grade_points),
              };
            });

          // Remove duplicates
          const uniqueCourses = Array.from(
            new Map(courses.map(c => [c.courseCode, c])).values()
          );
          courses = uniqueCourses;

        } else if (filter === 'improvement') {
          // Show improvement courses (passed with low grades)
          const lowGrades = allGradeRecords.filter(record => 
            record.grade === 'C' || record.grade === 'D'
          );

          const courseAttemptsMap = new Map<string, any[]>();
          allGradeRecords.forEach(record => {
            if (!courseAttemptsMap.has(record.course_code)) {
              courseAttemptsMap.set(record.course_code, []);
            }
            courseAttemptsMap.get(record.course_code)!.push(record);
          });

          courses = lowGrades
            .filter(record => {
              // Check if this is the best attempt
              const attempts = courseAttemptsMap.get(record.course_code) || [];
              const bestAttempt = attempts.reduce((best, curr) => 
                Number(curr.grade_points) > Number(best.grade_points) ? curr : best
              );
              return bestAttempt.grade_id === record.grade_id && 
                     !registeredCodes.includes(record.course_code);
            })
            .map(record => ({
              courseCode: record.course.course_code,
              courseName: record.course.course_name,
              credits: record.course.credits,
              semester: record.course.semester_no,
              isElective: record.course.is_elective,
              electiveGroup: record.course.elective_group,
              courseType: record.course.course_type,
              isAutoSelected: false,
              registrationType: "improvement",
              currentGrade: record.grade,
              currentGradePoints: Number(record.grade_points),
              previousAttempts: (courseAttemptsMap.get(record.course_code) || []).length,
            }));

          // Remove duplicates
          const uniqueCourses = Array.from(
            new Map(courses.map(c => [c.courseCode, c])).values()
          );
          courses = uniqueCourses;
        }

        res.json({
          courses,
          electiveGroups,
          filter,
          deadlines: {
            registration: registrationDeadline?.rule_value || null,
            modification: await prisma.registrationRule.findFirst({
              where: { rule_name: "MODIFICATION_DEADLINE", is_active: true },
            }).then(r => r?.rule_value || null),
          },
        });
      } catch (error) {
        console.error("Error fetching available courses:", error);
        res.status(500).json({ error: "Failed to fetch available courses" });
      }
    }


  /**
   * Register for multiple courses
   * POST /api/courses/register
   */
  static async registerCourse(req: Request, res: Response) {
    try {
      const enrollmentNo = req.user?.enrollmentNo;
      const { courses } = req.body; // Array of { courseCode, registrationType }

      if (!enrollmentNo) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (!courses || !Array.isArray(courses) || courses.length === 0) {
        res.status(400).json({ error: "Courses array is required" });
        return;
      }

      // Get student details
      const student = await prisma.student.findUnique({
        where: { enrollment_no: enrollmentNo },
        include: { faculty: true },
      });

      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }

      const currentYear = new Date().getFullYear();
      // Odd semesters (1,3,5,7) = type 1, Even semesters (2,4,6,8) = type 2
      const semesterType = student.current_semester % 2 === 1 ? 1 : 2;

      const registered: any[] = [];
      const errors: any[] = [];

      for (const courseData of courses) {
        const { courseCode, registrationType = 'regular' } = courseData;

        try {
          // Get course details
          const course = await prisma.course.findUnique({
            where: { course_code: courseCode },
          });

          if (!course) {
            errors.push({ courseCode, error: "Course not found" });
            continue;
          }

          // Check if already registered (exclude soft-deleted)
          const existingRegistration = await prisma.courseRegistration.findFirst({
            where: {
              enrollment_no: enrollmentNo,
              course_code: courseCode,
              academic_year: currentYear,
              semester_type: semesterType,
              deleted_at: null, // Only check active registrations
            },
          });

          if (existingRegistration) {
            errors.push({ courseCode, error: "Already registered" });
            continue;
          }

          // Validation 1: Check prerequisites
          const prereqCheck = await checkPrerequisites(enrollmentNo, courseCode);
          if (!prereqCheck.met) {
            errors.push({
              courseCode,
              error: "Prerequisites not met",
              missing: prereqCheck.missing,
            });
            continue;
          }

          // Validation 2: Check credit limit (calculate with all selected courses)
          const currentCredits = await calculateCurrentCredits(enrollmentNo);
          const selectedCredits = courses.reduce((sum, c) => {
            const courseInList = registered.find(r => r.courseCode === c.courseCode);
            return sum + (courseInList?.credits || 0);
          }, 0);
          
          if (currentCredits + selectedCredits + course.credits > 40) {
            errors.push({
              courseCode,
              error: "Credit limit exceeded",
              currentCredits,
              selectedCredits,
              courseCredits: course.credits,
              maxCredits: 40,
            });
            continue;
          }

          // All validations passed - create registration with auto-approval
          const registration = await prisma.courseRegistration.create({
            data: {
              enrollment_no: enrollmentNo,
              course_code: courseCode,
              academic_year: currentYear,
              semester_type: semesterType,
              registration_type: registrationType,
              is_approved: true, // Auto-approve
            },
          });

          registered.push({
            courseCode: course.course_code,
            courseName: course.course_name,
            credits: course.credits,
            registrationType,
            registeredAt: registration.registered_at,
          });

        } catch (error: any) {
          errors.push({
            courseCode,
            error: error.message || "Registration failed",
          });
        }
      }

      const totalCredits = registered.reduce((sum, c) => sum + c.credits, 0);

      res.status(201).json({
        message: `Successfully registered for ${registered.length} course(s)`,
        registered,
        totalCredits,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Error registering courses:", error);
      res.status(500).json({ error: "Failed to register for courses" });
    }
  }

  /**
   * Drop a course
   * DELETE /api/courses/drop/:courseCode
   */
  static async dropCourse(req: Request, res: Response) {
    try {
      const enrollmentNo = req.user?.enrollmentNo;
      const courseCode = req.params.courseCode as string;

      if (!enrollmentNo) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Check modification deadline
      const modificationDeadline = await prisma.registrationRule.findFirst({
        where: { rule_name: "MODIFICATION_DEADLINE", is_active: true },
      });

      const canModify = modificationDeadline && modificationDeadline.rule_value
        ? new Date(modificationDeadline.rule_value) > new Date()
        : true;

      if (!canModify) {
        res.status(403).json({ 
          error: "Modification deadline has passed",
          deadline: modificationDeadline?.rule_value,
        });
        return;
      }

      // Check if registered (and not already dropped)
      const registration = await prisma.courseRegistration.findFirst({
        where: {
          enrollment_no: enrollmentNo,
          course_code: courseCode,
          deleted_at: null, // Only active registrations
        },
        include: {
          course: true,
        },
      });

      if (!registration) {
        res.status(404).json({ error: "Not registered for this course" });
        return;
      }

      // Soft delete registration (set deleted_at timestamp)
      await prisma.courseRegistration.update({
        where: {
          registration_id: registration.registration_id,
        },
        data: {
          deleted_at: new Date(),
        },
      });

      res.json({
        message: `Successfully dropped ${registration.course.course_name}`,
        course: {
          course_code: registration.course.course_code,
          course_name: registration.course.course_name,
          credits: registration.course.credits,
        },
      });
    } catch (error) {
      console.error("Error dropping course:", error);
      res.status(500).json({ error: "Failed to drop course" });
    }
  }

  /**
   * Get enrolled courses
   * GET /api/courses/enrolled
   */
  static async getEnrolledCourses(req: Request, res: Response) {
    try {
      const enrollmentNo = req.user?.enrollmentNo;

      if (!enrollmentNo) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const registrations = await prisma.courseRegistration.findMany({
        where: { enrollment_no: enrollmentNo },
        include: {
          course: {
            include: {
              schedules: true,
            },
          },
        },
        orderBy: {
          registered_at: "desc",
        },
      });

      const totalCredits = await calculateCurrentCredits(enrollmentNo);

      const courses = registrations.map((reg) => ({
        course_code: reg.course.course_code,
        course_name: reg.course.course_name,
        credits: reg.course.credits,
        course_type: reg.course.course_type,
        is_elective: reg.course.is_elective,
        registration_type: reg.registration_type,
        is_approved: reg.is_approved,
        registered_at: reg.registered_at,
        schedule: reg.course.schedules.map((s) => ({
          day: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
      }));

      res.json({
        courses,
        total_courses: courses.length,
        total_credits: totalCredits,
      });
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      res.status(500).json({ error: "Failed to fetch enrolled courses" });
    }
  }
}
