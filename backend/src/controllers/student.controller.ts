import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class StudentController {
  /**
   * Get student dashboard data
   * GET /api/student/dashboard
   */
  static async getDashboard(req: Request, res: Response) {
    try {
      const enrollmentNo = req.user!.enrollmentNo;
      console.log("📊 Fetching dashboard for:", enrollmentNo);

      const student = await prisma.student.findUnique({
        where: { enrollment_no: enrollmentNo },
        include: { faculty: true },
      });

      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }

      // Calculate earned credits from passed courses (grade records with passing grades)
      const gradeRecords = await prisma.gradeRecord.findMany({
        where: { 
          enrollment_no: enrollmentNo,
          grade: { not: null }, // Has a grade
        },
        include: { course: true },
      });

      // Calculate earned credits (grades D and above, excluding F and I)
      const passGrades = ["A+", "A", "B+", "B", "C", "D"];
      const earnedCredits = gradeRecords
        .filter(record => record.grade && passGrades.includes(record.grade))
        .reduce((sum, record) => sum + record.course.credits, 0);

      console.log(`💯 Earned credits: ${earnedCredits}`);

      // Get registered courses for current semester
      const currentYear = new Date().getFullYear();
      // Odd semesters (1,3,5,7) = type 1, Even semesters (2,4,6,8) = type 2
      const currentSemesterType = student.current_semester % 2 === 1 ? 1 : 2;

      const registeredCourses = await prisma.courseRegistration.findMany({
        where: {
          enrollment_no: enrollmentNo,
          academic_year: currentYear,
          semester_type: currentSemesterType,
          deleted_at: null, // Only active registrations
        },
        include: {
          course: true,
        },
        orderBy: {
          registered_at: 'desc',
        },
      });

      console.log(`📚 Registered courses: ${registeredCourses.length}`);

      // Format registered courses with full details
      const currentRegistrations = registeredCourses.map(reg => ({
        registrationId: reg.registration_id,
        courseCode: reg.course.course_code,
        courseName: reg.course.course_name,
        credits: reg.course.credits,
        courseType: reg.course.course_type,
        registrationType: reg.registration_type,
        isApproved: reg.is_approved,
        status: reg.is_approved ? "Approved" : "Pending",
        registeredAt: reg.registered_at,
      }));

      // Calculate total credits for current registrations
      const registeredCredits = currentRegistrations.reduce((sum, course) => sum + course.credits, 0);

      // Get past courses (grade records from previous semesters)
      const pastCourses = gradeRecords.map(record => ({
        courseCode: record.course_code,
        courseName: record.course.course_name,
        credits: record.course.credits,
        grade: record.grade,
        gradePoints: Number(record.grade_points),
        semester: record.course.semester_no,
        academicYear: record.academic_year,
      }));

      // Get deadlines
      const registrationDeadline = await prisma.registrationRule.findFirst({
        where: { rule_name: "REGISTRATION_DEADLINE", is_active: true },
      });

      const modificationDeadline = await prisma.registrationRule.findFirst({
        where: { rule_name: "MODIFICATION_DEADLINE", is_active: true },
      });

      res.json({
        name: student.name,
        email: student.email,
        enrollmentNo: student.enrollment_no,
        facultyNo: student.faculty_no,
        branch: student.faculty?.branch_name || "Computer Engineering",
        branchCode: student.faculty?.branch_code || "COBEA",
        admissionYear: student.faculty?.admission_year || 2024,
        programType: student.faculty?.program_type || "B.Tech",
        hall: student.hall || null,
        cpi: Number(student.current_cpi) || 0.0,
        earnedCredits: earnedCredits,
        currentSemester: student.current_semester,
        isActive: student.is_active,
        // Current semester registrations
        registeredCourses: currentRegistrations,
        registeredCredits: registeredCredits,
        hasRegistered: currentRegistrations.length > 0,
        // Past courses (for backward compatibility)
        courses: currentRegistrations.length > 0 ? currentRegistrations : [],
        // Past semester courses with grades
        pastCourses: pastCourses,
        // Deadlines
        deadlines: {
          registration: registrationDeadline?.rule_value || null,
          modification: modificationDeadline?.rule_value || null,
          canRegister: registrationDeadline && registrationDeadline.rule_value
            ? new Date(registrationDeadline.rule_value) > new Date()
            : true,
          canModify: modificationDeadline && modificationDeadline.rule_value
            ? new Date(modificationDeadline.rule_value) > new Date()
            : true,
        },
      });

      console.log("✅ Dashboard fetched successfully");
    } catch (error) {
      console.error("❌ Dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  }

  /**
   * Get student course history with grades
   * GET /api/student/course-history
   */
  static async getCourseHistory(req: Request, res: Response) {
      try {
        const enrollmentNo = req.user!.enrollmentNo;
        console.log("📚 Fetching course history for:", enrollmentNo);

        // Fetch all grade records for the student
        const gradeRecords = await prisma.gradeRecord.findMany({
          where: { enrollment_no: enrollmentNo },
          include: {
            course: true,
          },
          orderBy: [
            { academic_year: "asc" },
            { semester_type: "asc" },
          ],
        });

        console.log(`Found ${gradeRecords.length} grade records`);

        // Group by semester
        const semesterMap = new Map<string, any>();

        gradeRecords.forEach((record) => {
          const semesterKey = `${record.academic_year}-${record.semester_type}`;

          if (!semesterMap.has(semesterKey)) {
            semesterMap.set(semesterKey, {
              academicYear: record.academic_year,
              semesterType: record.semester_type,
              courses: [],
            });
          }

          semesterMap.get(semesterKey).courses.push({
            courseCode: record.course_code,
            courseName: record.course.course_name,
            credits: record.course.credits,
            grade: record.grade,
            gradePoints: Number(record.grade_points),
            isBacklog: record.is_backlog,
            isImprovement: record.is_improvement,
            attemptType: record.is_backlog ? 'Backlog' : record.is_improvement ? 'Improvement' : 'Regular',
          });
        });

        // Convert map to array and calculate SGPA for each semester
        const semesters = Array.from(semesterMap.values()).map((sem) => {
          const totalCredits = sem.courses.reduce(
            (sum: number, c: any) => sum + c.credits,
            0
          );
          const totalGradePoints = sem.courses.reduce(
            (sum: number, c: any) => sum + c.gradePoints * c.credits,
            0
          );
          const sgpa =
            totalCredits > 0
              ? (totalGradePoints / totalCredits).toFixed(2)
              : "0.00";

          return {
            academicYear: sem.academicYear,
            semesterType: sem.semesterType,
            sgpa: parseFloat(sgpa),
            totalCredits,
            courses: sem.courses,
          };
        });

        // Track course attempts for better credit calculation and display
        const courseAttempts = new Map<string, any[]>();
        gradeRecords.forEach((record) => {
          if (!courseAttempts.has(record.course_code)) {
            courseAttempts.set(record.course_code, []);
          }
          courseAttempts.get(record.course_code)!.push({
            grade: record.grade,
            gradePoints: Number(record.grade_points),
            credits: record.course.credits,
            courseName: record.course.course_name,
            academicYear: record.academic_year,
            semesterType: record.semester_type,
            isBacklog: record.is_backlog,
            isImprovement: record.is_improvement,
          });
        });

        // Build detailed course attempts array for display
        const courseAttemptsArray = Array.from(courseAttempts.entries()).map(([courseCode, attempts]) => {
          const totalAttempts = attempts.length;
          const sortedAttempts = attempts.sort((a, b) => {
            if (a.academicYear !== b.academicYear) return a.academicYear - b.academicYear;
            return a.semesterType - b.semesterType;
          });

          const bestAttempt = attempts.reduce((best, curr) => 
            curr.gradePoints > best.gradePoints ? curr : best
          );

          return {
            courseCode,
            courseName: attempts[0].courseName,
            totalAttempts,
            attempts: sortedAttempts.map((attempt, index) => ({
              attemptNumber: index + 1,
              semester: `${attempt.academicYear} ${attempt.semesterType === 1 ? 'Odd' : 'Even'}`,
              grade: attempt.grade,
              gradePoints: attempt.gradePoints,
              attemptType: attempt.isBacklog ? 'Backlog' : attempt.isImprovement ? 'Improvement' : 'Regular',
            })),
            bestGrade: bestAttempt.grade,
            bestGradePoints: bestAttempt.gradePoints,
            credits: attempts[0].credits,
          };
        });

        // Calculate statistics using best attempt for each course
        const passGrades = ["A+", "A", "B+", "B", "C", "D"];
        let uniqueCoursesCredits = 0;
        let uniqueCoursesGradePoints = 0;

        courseAttempts.forEach((attempts, courseCode) => {
          // Sort attempts by grade points (descending) to get best attempt
          const sortedAttempts = attempts.sort((a, b) => b.gradePoints - a.gradePoints);
          const bestAttempt = sortedAttempts[0];

          // Only count if passed
          if (bestAttempt.grade && passGrades.includes(bestAttempt.grade)) {
            uniqueCoursesCredits += bestAttempt.credits;
            uniqueCoursesGradePoints += bestAttempt.gradePoints * bestAttempt.credits;
          }
        });

        const cpi =
          uniqueCoursesCredits > 0
            ? (uniqueCoursesGradePoints / uniqueCoursesCredits).toFixed(2)
            : "0.00";

        console.log("✅ Course history fetched successfully");

        res.json({
          semesters,
          courseAttempts: courseAttemptsArray,
          statistics: {
            totalAttempts: gradeRecords.length,
            uniqueCourses: courseAttempts.size,
            earnedCredits: uniqueCoursesCredits,
            cpi: parseFloat(cpi),
            totalSemesters: semesters.length,
          },
        });
      } catch (error) {
        console.error("❌ Course history error:", error);
        res.status(500).json({ error: "Failed to fetch course history" });
      }
    }


  /**
   * Get student registration history (including dropped courses)
   * GET /api/student/registration-history
   */
  static async getRegistrationHistory(req: Request, res: Response) {
    try {
      const enrollmentNo = req.user!.enrollmentNo;
      console.log("📜 Fetching registration history for:", enrollmentNo);

      // Fetch all registrations (including soft-deleted ones)
      const allRegistrations = await prisma.courseRegistration.findMany({
        where: {
          enrollment_no: enrollmentNo,
        },
        include: {
          course: true,
        },
        orderBy: [
          { academic_year: 'desc' },
          { semester_type: 'desc' },
          { registered_at: 'desc' },
        ],
      });

      console.log(`Found ${allRegistrations.length} total registrations`);

      // Format the response
      const history = allRegistrations.map(reg => ({
        registrationId: reg.registration_id,
        courseCode: reg.course.course_code,
        courseName: reg.course.course_name,
        credits: reg.course.credits,
        courseType: reg.course.course_type,
        registrationType: reg.registration_type,
        academicYear: reg.academic_year,
        semesterType: reg.semester_type,
        registeredAt: reg.registered_at,
        droppedAt: reg.deleted_at,
        status: reg.deleted_at ? "Dropped" : (reg.is_approved ? "Active" : "Pending"),
        isApproved: reg.is_approved,
      }));

      // Calculate statistics
      const activeCount = history.filter(h => h.status === "Active" || h.status === "Pending").length;
      const droppedCount = history.filter(h => h.status === "Dropped").length;
      const totalCreditsRegistered = history
        .filter(h => h.status !== "Dropped")
        .reduce((sum, h) => sum + h.credits, 0);

      console.log("✅ Registration history fetched successfully");

      res.json({
        history,
        statistics: {
          totalRegistrations: history.length,
          activeRegistrations: activeCount,
          droppedRegistrations: droppedCount,
          totalCreditsRegistered,
        },
      });
    } catch (error) {
      console.error("❌ Registration history error:", error);
      res.status(500).json({ error: "Failed to fetch registration history" });
    }
  }

}
