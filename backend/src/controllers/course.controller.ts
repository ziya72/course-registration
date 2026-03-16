import { Request, Response } from "express";
import { PrismaClient, AttemptType, RegistrationMode, Grade } from "@prisma/client";
import { checkPrerequisites } from "../services/prerequisite.service";
import { validateCreditLimit, calculateCurrentCredits } from "../services/credit.service";
import { checkScheduleConflict } from "../services/schedule.service";
import { validateElectiveSelection } from "../services/elective.service";
import { 
  determineAttemptType, 
  recordCourseAttempt, 
  getAttemptInfo 
} from "../services/attempt-tracking.service";
import { 
  validateRegistrationMode, 
  validateModeTypeCompatibility 
} from "../services/mode-validation.service";
import { 
  validateMinorDegreeEligibility, 
  validateThirdYearFinalYearCourse 
} from "../services/cgpa-validation.service";
import { 
  validateImprovementEligibility 
} from "../services/improvement-validation.service";

const prisma = new PrismaClient();

// Grade to grade points mapping
const gradePoints: { [key in Grade]: number } = {
  [Grade.A_PLUS]: 10.0,
  [Grade.A]: 9.0,
  [Grade.B_PLUS]: 8.0,
  [Grade.B]: 7.0,
  [Grade.C]: 6.0,
  [Grade.D]: 5.0,
  [Grade.E]: 4.0,
  [Grade.F]: 0.0,
  [Grade.I]: 0.0,
};

/**
 * Calculate grade points from grade enum
 */
function calculateGradePoints(grade: Grade | null): number {
  if (!grade) return 0.0;
  return gradePoints[grade] ?? 0.0;
}

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

        // Check if registration is open (check active phase)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const semesterType = currentMonth >= 7 ? 1 : 2;

        const activePhase = await prisma.registrationPhase.findFirst({
          where: {
            academic_year: currentYear,
            semester_type: semesterType,
            is_enabled: true,
            start_date: { lte: now },
            end_date: { gte: now },
          },
        });

        if (!activePhase) {
          res.status(403).json({ 
            error: "Registration is currently closed. No active registration phase.",
            message: "Please contact administration or wait for the registration window to open.",
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

        // Get current registrations (reuse currentYear and semesterType from above)
        const studentSemesterType = student.current_semester % 2 === 1 ? 1 : 2;

        const registrations = await prisma.courseRegistration.findMany({
          where: {
            enrollment_no: enrollmentNo,
            academic_year: currentYear,
            semester_type: studentSemesterType,
            deleted_at: null,
          },
        });

        const registeredCodes = registrations.map((r) => r.course_code);

        let courses: any[] = [];
        let electiveGroups: any[] = [];

        // Handle different filters
        if (filter === 'all' || filter === 'eligible') {
          // Map full branch code to short branch code
          const branchCodeMap: { [key: string]: string } = {
            'COBEA': 'CE',
            'EEBEA': 'EE', 
            'MEBEA': 'ME',
            'CIBEA': 'CI',
            'CHBEA': 'CH',
            'ARBEA': 'AR'
          };
          
          const shortBranchCode = branchCodeMap[student.faculty?.branch_code || ''] || student.faculty?.branch_code;
          
          // Show current semester courses (default view)
          const currentSemesterCourses = await prisma.course.findMany({
            where: {
              branch_code: shortBranchCode,
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
              registrationMode: "A", // Default mode for regular courses
              allowedModes: ["A"], // First attempt only allows Mode A
              prerequisites: course.prerequisites?.map((p: any) => ({
                courseCode: p.prerequisite_course_code,
                courseName: p.prerequisite.course_name,
                minGrade: p.min_grade,
              })) || [],
            }));

          // Get elective groups
          const groups = await prisma.electiveGroup.findMany({
            where: {
              branch_code: shortBranchCode,
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
                registrationMode: "B", // Default mode for backlog (E grade)
                allowedModes: ["B", "C"], // Backlog courses allow B/C modes
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
              registrationMode: "B", // Default for improvement
              allowedModes: ["B", "C"], // Improvement only allows B/C
              currentGrade: record.grade,
              currentGradePoints: calculateGradePoints(record.grade),
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
            currentPhase: activePhase.phase_label,
            phaseEndDate: activePhase.end_date,
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
      const { courses } = req.body; // Array of { courseCode, registrationType, registrationMode }

      if (!enrollmentNo) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (!courses || !Array.isArray(courses) || courses.length === 0) {
        res.status(400).json({ error: "Courses array is required" });
        return;
      }

      // Check if registration is open (check active phase)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const semesterType = currentMonth >= 7 ? 1 : 2;

      const activePhase = await prisma.registrationPhase.findFirst({
        where: {
          academic_year: currentYear,
          semester_type: semesterType,
          is_enabled: true,
          start_date: { lte: now },
          end_date: { gte: now },
        },
      });

      if (!activePhase) {
        res.status(403).json({ 
          error: "Registration is currently closed",
          message: "No active registration phase. Please contact administration.",
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

      // Use student's current semester for registration
      const studentSemesterType = student.current_semester % 2 === 1 ? 1 : 2;

      const registered: any[] = [];
      const errors: any[] = [];

      console.log(`📝 Processing ${courses.length} course(s) for registration:`, 
        courses.map(c => `${c.courseCode} (${c.registrationType}/${c.registrationMode || 'A'})`).join(', ')
      );

      // Get current credits ONCE before the loop (not inside the loop)
      const initialCredits = await calculateCurrentCredits(enrollmentNo);
      console.log(`💳 Initial credits before batch: ${initialCredits}`);

      for (const courseData of courses) {
        const { 
          courseCode, 
          registrationType = 'regular',
          registrationMode = 'A' 
        } = courseData;

        console.log(`\n🔍 Processing: ${courseCode} (${registrationType}/${registrationMode})`);

        try {
          // VALIDATION ORDER (CORRECTED):
          
          // 1. ✅ Check registration phase (already done above)
          
          // 2. ✅ Check if already registered (exclude soft-deleted)
          const existingRegistration = await prisma.courseRegistration.findFirst({
            where: {
              enrollment_no: enrollmentNo,
              course_code: courseCode,
              academic_year: currentYear,
              semester_type: studentSemesterType,
              deleted_at: null, // Only check active registrations
            },
          });

          if (existingRegistration) {
            errors.push({ courseCode, error: "Already registered" });
            continue;
          }

          // Get course details
          const course = await prisma.course.findUnique({
            where: { course_code: courseCode },
          });

          if (!course) {
            console.log(`❌ Course not found: ${courseCode}`);
            errors.push({ courseCode, error: "Course not found" });
            continue;
          }

          console.log(`✅ Course found: ${course.course_name}`);

          // 3. ✅ Check prerequisites (skip for backlog/improvement)
          if (registrationType === 'regular') {
            const prereqCheck = await checkPrerequisites(enrollmentNo, courseCode);
            if (!prereqCheck.met) {
              errors.push({
                courseCode,
                error: "Prerequisites not met",
                reason: "prerequisites_not_met",
                missing: prereqCheck.missing,
              });
              continue;
            }
          }

          // 4. ✨ NEW: Validate registrationType + registrationMode compatibility
          const compatibilityCheck = validateModeTypeCompatibility(registrationType, registrationMode);
          if (!compatibilityCheck.valid) {
            errors.push({
              courseCode,
              error: compatibilityCheck.message,
              reason: "mode_type_mismatch",
            });
            continue;
          }

          // 5. ✨ NEW: Determine attempt type (system decides, not user)
          let attemptType: AttemptType;
          let attemptNumber: number;
          
          try {
            const attemptInfo = await determineAttemptType(enrollmentNo, courseCode, registrationType);
            attemptType = attemptInfo.attemptType;
            attemptNumber = attemptInfo.attemptNumber;
            
            console.log(`📊 Determined attempt: ${attemptType} #${attemptNumber}`);
          } catch (error: any) {
            errors.push({
              courseCode,
              error: error.message,
              reason: "attempt_determination_failed",
            });
            continue;
          }

          // 6. ✨ NEW: Validate improvement eligibility (if type = improvement)
          if (attemptType === AttemptType.IMPROVEMENT) {
            const improvementCheck = await validateImprovementEligibility(
              enrollmentNo, 
              courseCode, 
              registrationMode
            );
            
            if (!improvementCheck.valid) {
              errors.push({
                courseCode,
                error: improvementCheck.message,
                reason: improvementCheck.reason,
                details: improvementCheck.details,
              });
              continue;
            }
          }

          // 7. ✨ NEW: Validate registration mode eligibility
          const modeValidation = await validateRegistrationMode(
            enrollmentNo,
            courseCode,
            registrationMode,
            attemptType
          );

          if (!modeValidation.valid) {
            errors.push({
              courseCode,
              error: modeValidation.message,
              reason: modeValidation.reason,
              allowedModes: modeValidation.allowedModes,
            });
            continue;
          }

          // 8. ✨ NEW: Check CGPA requirements (if applicable)
          
          // Check for minor degree courses (if this is a minor course)
          // TODO: Add minor course identification logic when minor system is implemented
          
          // Check for third-year students registering final year courses
          if ([5, 6].includes(student.current_semester) && [7, 8].includes(course.semester_no)) {
            const cgpaCheck = await validateThirdYearFinalYearCourse(enrollmentNo, courseCode);
            if (!cgpaCheck.valid) {
              errors.push({
                courseCode,
                error: cgpaCheck.message,
                reason: cgpaCheck.reason,
                details: {
                  currentCGPA: cgpaCheck.currentCGPA,
                  requiredCGPA: cgpaCheck.requiredCGPA,
                  backlogCount: cgpaCheck.backlogCount,
                },
              });
              continue;
            }
          }

          // 9. ✅ Check credit limit
          // Use initialCredits (from before loop) + batchCredits (from this batch)
          const batchCredits = registered.reduce((sum, r) => sum + Number(r.credits), 0);
          
          if (initialCredits + batchCredits + Number(course.credits) > 40) {
            console.log(`❌ Credit limit exceeded for ${courseCode}:`, {
              initialCredits,
              batchCredits,
              courseCredits: Number(course.credits),
              total: initialCredits + batchCredits + Number(course.credits),
              maxCredits: 40,
            });
            
            errors.push({
              courseCode,
              error: "Credit limit exceeded",
              reason: "credit_limit_exceeded",
              details: {
                initialCredits,
                batchCredits,
                courseCredits: course.credits,
                maxCredits: 40,
              },
            });
            continue;
          }

          // 10. ✅ Create registration (all validations passed)
          const registration = await prisma.courseRegistration.create({
            data: {
              enrollment_no: enrollmentNo,
              course_code: courseCode,
              academic_year: currentYear,
              semester_type: studentSemesterType,
              registration_type: registrationType,
              registration_mode: registrationMode,
              is_approved: true, // Auto-approve
            },
          });

          // 11. ✨ NEW: Record course attempt (AFTER registration succeeds)
          await recordCourseAttempt(
            enrollmentNo,
            courseCode,
            attemptType,
            attemptNumber,
            registrationMode,
            currentYear,
            studentSemesterType,
            student.current_semester
          );

          registered.push({
            courseCode: course.course_code,
            courseName: course.course_name,
            credits: course.credits,
            registrationType,
            registrationMode,
            attemptType,
            attemptNumber,
            registeredAt: registration.registered_at,
          });

        } catch (error: any) {
          console.error(`❌ Error processing ${courseCode}:`, error);
          errors.push({
            courseCode,
            error: error.message || "Registration failed",
            reason: "processing_error",
          });
        }
      }

      // 12. ✨ NEW: Update student's last registration info (if any courses were registered)
      if (registered.length > 0) {
        await prisma.student.update({
          where: { enrollment_no: enrollmentNo },
          data: {
            last_registration_year: currentYear,
            last_registration_semester: studentSemesterType,
          },
        });
        console.log(`✅ Updated last registration info: ${currentYear}-${studentSemesterType}`);
      }

      const totalCredits = registered.reduce((sum, c) => sum + Number(c.credits), 0);

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
