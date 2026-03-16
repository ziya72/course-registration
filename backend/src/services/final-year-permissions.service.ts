import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface FinalYearValidationResult {
  valid: boolean;
  message?: string;
  reason?: string;
  details?: {
    isFinalYear?: boolean;
    isRunning?: boolean;
    modeCorrect?: boolean;
    nonRunningCount?: number;
    willBeDelayed?: boolean;
  };
}

/**
 * Check if student is in final year (DERIVED, NOT STORED)
 * CORRECTED: semester IN (7,8) instead of >= 7
 */
export function isFinalYear(semesterNo: number): boolean {
  // ✅ CORRECTED: Only semester 7 or 8
  // Extended students (semester 9+) are NOT considered final year
  return semesterNo === 7 || semesterNo === 8;
}

/**
 * Validate non-running course registration for final year students
 * 
 * Rules:
 * 1. Student must be in final year (semester 7 or 8)
 * 2. Course must not be running (is_running = false)
 * 3. Must use Mode C (exam only)
 * 4. Maximum 3 non-running courses allowed
 * 5. Graduation will be delayed without this course
 */
export async function validateNonRunningCourse(
  enrollmentNo: string,
  courseCode: string,
  registrationMode: string
): Promise<FinalYearValidationResult> {
  try {
    console.log(`🎓 Validating non-running course: ${courseCode} for ${enrollmentNo}`);

    // Get student details
    const student = await prisma.student.findUnique({
      where: { enrollment_no: enrollmentNo },
    });

    if (!student) {
      return {
        valid: false,
        message: "Student not found",
        reason: "student_not_found",
      };
    }

    // Rule 1: Check if student is in final year
    const isStudentFinalYear = isFinalYear(student.current_semester);
    if (!isStudentFinalYear) {
      return {
        valid: false,
        message: `Non-running courses only allowed for final year students (semester 7-8). Current semester: ${student.current_semester}`,
        reason: "not_final_year",
        details: {
          isFinalYear: false,
        },
      };
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { course_code: courseCode },
    });

    if (!course) {
      return {
        valid: false,
        message: "Course not found",
        reason: "course_not_found",
      };
    }

    // Rule 2: Check if course is not running
    if (course.is_running) {
      return {
        valid: false,
        message: "This validation is only for non-running courses",
        reason: "course_is_running",
        details: {
          isFinalYear: true,
          isRunning: true,
        },
      };
    }

    // Rule 3: Check if Mode C is used
    if (registrationMode !== 'C') {
      return {
        valid: false,
        message: "Non-running courses must be registered in Mode C (exam only)",
        reason: "mode_not_c",
        details: {
          isFinalYear: true,
          isRunning: false,
          modeCorrect: false,
        },
      };
    }

    // Rule 4: Check if already registered 3 non-running courses
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const semesterType = currentMonth >= 7 ? 1 : 2;

    const nonRunningCount = await countNonRunningRegistrations(
      enrollmentNo,
      currentYear,
      semesterType
    );

    if (nonRunningCount >= 3) {
      return {
        valid: false,
        message: `Maximum 3 non-running courses allowed. Already registered: ${nonRunningCount}`,
        reason: "non_running_limit_exceeded",
        details: {
          isFinalYear: true,
          isRunning: false,
          modeCorrect: true,
          nonRunningCount,
        },
      };
    }

    // Rule 5: Check if graduation will be delayed
    const graduationCheck = await checkGraduationDelay(enrollmentNo);
    if (!graduationCheck.willBeDelayed) {
      return {
        valid: false,
        message: "Non-running courses only allowed if graduation will be delayed otherwise",
        reason: "graduation_not_delayed",
        details: {
          isFinalYear: true,
          isRunning: false,
          modeCorrect: true,
          nonRunningCount,
          willBeDelayed: false,
        },
      };
    }

    // All checks passed
    return {
      valid: true,
      message: "Eligible to register non-running course",
      details: {
        isFinalYear: true,
        isRunning: false,
        modeCorrect: true,
        nonRunningCount,
        willBeDelayed: true,
      },
    };
  } catch (error) {
    console.error("Error validating non-running course:", error);
    return {
      valid: false,
      message: "Failed to validate non-running course eligibility",
      reason: "validation_error",
    };
  }
}

/**
 * Count current non-running course registrations (CALCULATED DYNAMICALLY)
 */
export async function countNonRunningRegistrations(
  enrollmentNo: string,
  academicYear: number,
  semesterType: number
): Promise<number> {
  try {
    // ✅ Calculate dynamically
    const count = await prisma.courseRegistration.count({
      where: {
        enrollment_no: enrollmentNo,
        academic_year: academicYear,
        semester_type: semesterType,
        status: 'ACTIVE',
        deleted_at: null,
        course: {
          is_running: false,
        },
      },
    });

    console.log(`📊 Non-running registrations for ${enrollmentNo}: ${count}`);
    return count;
  } catch (error) {
    console.error("Error counting non-running registrations:", error);
    return 0;
  }
}

/**
 * Check if graduation will be delayed without additional courses
 */
export async function checkGraduationDelay(
  enrollmentNo: string
): Promise<{ willBeDelayed: boolean; remainingCredits: number }> {
  try {
    const student = await prisma.student.findUnique({
      where: { enrollment_no: enrollmentNo },
    });

    if (!student) {
      return { willBeDelayed: false, remainingCredits: 0 };
    }

    const earnedCredits = student.total_earned_credits;
    const requiredCredits = student.required_credits_for_degree;

    // Get current semester active registrations
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const semesterType = currentMonth >= 7 ? 1 : 2;

    const currentRegistrations = await prisma.courseRegistration.findMany({
      where: {
        enrollment_no: enrollmentNo,
        academic_year: currentYear,
        semester_type: semesterType,
        status: 'ACTIVE',
        deleted_at: null,
      },
      include: {
        course: true,
      },
    });

    // Calculate potential credits if all current courses pass
    const potentialCredits = currentRegistrations.reduce(
      (sum, reg) => sum + Number(reg.course.credits),
      0
    );

    const totalAfterSemester = Number(earnedCredits) + potentialCredits;
    const remainingCredits = requiredCredits - totalAfterSemester;

    // If remaining credits > 0, graduation will be delayed
    const willBeDelayed = remainingCredits > 0;

    console.log(`🎓 Graduation delay check for ${enrollmentNo}:`, {
      earnedCredits,
      potentialCredits,
      totalAfterSemester,
      requiredCredits,
      remainingCredits,
      willBeDelayed,
    });

    return { willBeDelayed, remainingCredits: Math.max(0, remainingCredits) };
  } catch (error) {
    console.error("Error checking graduation delay:", error);
    return { willBeDelayed: false, remainingCredits: 0 };
  }
}