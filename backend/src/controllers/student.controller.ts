import { Request, Response } from "express";
import { PrismaClient, Grade } from "@prisma/client";

const prisma = new PrismaClient();

// Grade enum to string mapping (for display)
const GRADE_ENUM_TO_STRING: { [key in Grade]: string } = {
  [Grade.A_PLUS]: "A+",
  [Grade.A]: "A",
  [Grade.B_PLUS]: "B+",
  [Grade.B]: "B",
  [Grade.C]: "C",
  [Grade.D]: "D",
  [Grade.E]: "E",
  [Grade.F]: "F",
  [Grade.I]: "I",
};

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

/**
 * Check if grade is a backlog (E, F, I)
 */
function isBacklogGrade(grade: Grade | null): boolean {
  if (!grade) return false;
  return (grade === Grade.E || grade === Grade.F || grade === Grade.I);
}

/**
 * Check if grade is passing (D and above)
 */
function isPassingGrade(grade: Grade | null): boolean {
  if (!grade) return false;
  return (grade === Grade.A_PLUS || grade === Grade.A || grade === Grade.B_PLUS || 
          grade === Grade.B || grade === Grade.C || grade === Grade.D);
}

/**
 * Convert grade enum to display string
 */
function gradeEnumToString(grade: Grade | null): string {
  if (!grade) return "N/A";
  return GRADE_ENUM_TO_STRING[grade];
}

/**
 * Parse semester info from sem field (e.g., "S24252" -> {academic_year: 2024, semester_type: 2})
 */
function parseSemesterInfo(sem: string): { academic_year: number; semester_type: number } {
  const semStr = sem.replace(/^S/, "");
  const yearStr = semStr.substring(0, 2);
  const semester_type = parseInt(semStr.charAt(semStr.length - 1));
  const year = parseInt(yearStr);
  const academic_year = year >= 0 && year <= 50 ? 2000 + year : 1900 + year;
  return { academic_year, semester_type };
}

export class StudentController {
  /**
   * Get student dashboard data
   * GET /api/student/dashboard
   * Updated to work with optimized GradeRecord schema
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

      // Calculate earned credits from passed courses using optimized schema
      const gradeRecords = await prisma.gradeRecord.findMany({
        where: { 
          enrollment_no: enrollmentNo,
          grade: { not: null }, // Has a grade
        },
        include: { course: true },
      });

      // Calculate earned credits and CPI using best attempt for each course
      const courseAttempts = new Map<string, any[]>();
      
      gradeRecords.forEach((record) => {
        if (!courseAttempts.has(record.course_code)) {
          courseAttempts.set(record.course_code, []);
        }
        
        const gradePoints = calculateGradePoints(record.grade || "F");
        const isBacklog = isBacklogGrade(record.grade || "F");
        const isPassing = isPassingGrade(record.grade || "F");
        
        courseAttempts.get(record.course_code)!.push({
          grade: record.grade,
          gradePoints,
          credits: record.course.credits,
          isBacklog,
          isPassing,
          sem: record.sem,
        });
      });

      // Calculate using best attempt for each course
      let earnedCredits = 0;
      let totalGradePoints = 0;
      let totalCredits = 0;

      courseAttempts.forEach((attempts, courseCode) => {
        // Get best attempt (highest grade points)
        const bestAttempt = attempts.reduce((best, curr) => 
          curr.gradePoints > best.gradePoints ? curr : best
        );

        // Only count if passed
        if (bestAttempt.isPassing) {
          earnedCredits += Number(bestAttempt.credits);
        }

        // For CPI calculation, include all attempted courses
        totalCredits += Number(bestAttempt.credits);
        totalGradePoints += bestAttempt.gradePoints * Number(bestAttempt.credits);
      });

      const calculatedCPI = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

      console.log(`💯 Earned credits: ${earnedCredits}, Calculated CPI: ${calculatedCPI.toFixed(3)}`);

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
      const registeredCredits = currentRegistrations.reduce((sum, course) => sum + Number(course.credits), 0);

      // Get past courses (grade records from previous semesters)
      const pastCourses = gradeRecords.map(record => {
        const gradePoints = calculateGradePoints(record.grade);
        return {
          courseCode: record.course_code,
          courseName: record.course.course_name,
          credits: record.course.credits,
          grade: gradeEnumToString(record.grade), // Convert enum to string for display
          gradePoints: gradePoints,
          semester: record.semester_no,
          sem: record.sem,
        };
      });

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
        cpi: Number(calculatedCPI.toFixed(3)), // Use calculated CPI
        earnedCredits: earnedCredits,
        currentSemester: student.current_semester,
        isActive: student.is_active,
        // Current semester registrations
        registeredCourses: currentRegistrations,
        registeredCredits: registeredCredits,
        hasRegistered: currentRegistrations.length > 0,
        // Current courses (for backward compatibility)
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
   * Updated to work with optimized GradeRecord schema
   */
  static async getCourseHistory(req: Request, res: Response) {
      try {
        const enrollmentNo = req.user!.enrollmentNo;
        console.log("📚 Fetching course history for:", enrollmentNo);

        // Fetch all grade records for the student using optimized schema
        const gradeRecords = await prisma.gradeRecord.findMany({
          where: { enrollment_no: enrollmentNo },
          include: {
            course: true,
          },
          orderBy: [
            { sem: "asc" }, // Order by semester string
          ],
        });

        console.log(`Found ${gradeRecords.length} grade records`);

        // Group by semester using sem field
        const semesterMap = new Map<string, any>();

        gradeRecords.forEach((record) => {
          const semesterKey = record.sem;

          if (!semesterMap.has(semesterKey)) {
            // Parse semester info from sem field
            const { academic_year, semester_type } = parseSemesterInfo(record.sem);
            
            semesterMap.set(semesterKey, {
              sem: record.sem,
              academicYear: academic_year,
              semesterType: semester_type,
              courses: [],
            });
          }

          const gradePoints = calculateGradePoints(record.grade || "F");
          const isBacklog = isBacklogGrade(record.grade || "F");

          semesterMap.get(semesterKey).courses.push({
            courseCode: record.course_code,
            courseName: record.course.course_name,
            credits: record.course.credits,
            grade: gradeEnumToString(record.grade), // Convert enum to string for display
            gradePoints: gradePoints,
            isBacklog: isBacklog,
            isImprovement: false, // Will be determined by attempt logic
            attemptType: isBacklog ? 'Backlog' : 'Regular',
            isAdvanced: record.course.is_advanced,
          });
        });

        // Convert map to array and calculate SGPA for each semester
        const semesters = Array.from(semesterMap.values()).map((sem) => {
          const totalCredits = sem.courses.reduce(
            (sum: number, c: any) => sum + Number(c.credits),
            0
          );
          const totalGradePoints = sem.courses.reduce(
            (sum: number, c: any) => sum + Number(c.gradePoints) * Number(c.credits),
            0
          );
          const sgpa =
            totalCredits > 0
              ? (totalGradePoints / totalCredits).toFixed(3)
              : "0.000";

          return {
            sem: sem.sem,
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
          
          const gradePoints = calculateGradePoints(record.grade || "F");
          const isBacklog = isBacklogGrade(record.grade || "F");
          const { academic_year, semester_type } = parseSemesterInfo(record.sem);
          
          courseAttempts.get(record.course_code)!.push({
            grade: gradeEnumToString(record.grade), // Convert enum to string for display
            gradePoints: gradePoints,
            credits: record.course.credits,
            courseName: record.course.course_name,
            sem: record.sem,
            academicYear: academic_year,
            semesterType: semester_type,
            isBacklog: isBacklog,
            isImprovement: false, // Will be determined by attempt logic
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
              sem: attempt.sem,
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
        let uniqueCoursesCredits = 0;
        let uniqueCoursesGradePoints = 0;

        courseAttempts.forEach((attempts, courseCode) => {
          // Sort attempts by grade points (descending) to get best attempt
          const sortedAttempts = attempts.sort((a, b) => b.gradePoints - a.gradePoints);
          const bestAttempt = sortedAttempts[0];

          // Only count if passed
          if (bestAttempt.grade && isPassingGrade(bestAttempt.grade)) {
            uniqueCoursesCredits += Number(bestAttempt.credits);
            uniqueCoursesGradePoints += Number(bestAttempt.gradePoints) * Number(bestAttempt.credits);
          }
        });

        const cpi =
          uniqueCoursesCredits > 0
            ? (uniqueCoursesGradePoints / uniqueCoursesCredits).toFixed(3)
            : "0.000";

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
        .reduce((sum, h) => sum + Number(h.credits), 0);

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
