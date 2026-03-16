import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface GraduatingCourseValidationResult {
  valid: boolean;
  message?: string;
  reason?: string;
  details?: {
    hasPreviousAttempt?: boolean;
    lastGrade?: string;
    attendanceFulfilled?: boolean;
    courseCredits?: number;
    earnedCredits?: number;
    requiredCredits?: number;
    willComplete?: boolean;
  };
}

/**
 * Validate graduating course registration (CORRECTED LOGIC)
 * 
 * Graduating course rules:
 * 1. Student previously attempted the course
 * 2. Got grade E or I (failed or incomplete)
 * 3. Attendance already fulfilled in previous attempt
 * 4. Course credits ≤ 4
 * 5. Passing this course will complete degree (earned + course >= required)
 */
export async function validateGraduatingCourse(
  enrollmentNo: string,
  courseCode: string
): Promise<GraduatingCourseValidationResult> {
  try {
    console.log(`🎓 Validating graduating course: ${courseCode} for ${enrollmentNo}`);

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

    // Rule 1: Check if previously attempted with Mode A
    const previousAttempt = await prisma.courseAttempt.findFirst({
      where: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
        registration_mode: 'A', // Must have attended (Mode A)
      },
      orderBy: { attempt_number: 'desc' },
    });

    if (!previousAttempt) {
      return {
        valid: false,
        message: "Graduating course requires previous Mode A attempt (attendance fulfilled)",
        reason: "no_previous_mode_a_attempt",
        details: {
          hasPreviousAttempt: false,
        },
      };
    }

    // Rule 2: Check if latest grade is E or I
    const latestGrade = await prisma.gradeRecord.findFirst({
      where: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
      },
      orderBy: [
        { sem: 'desc' },
      ],
    });

    if (!latestGrade || !['E', 'I'].includes(latestGrade.grade || '')) {
      return {
        valid: false,
        message: `Graduating course only for failed (E) or incomplete (I) courses. Current grade: ${latestGrade?.grade || 'N/A'}`,
        reason: "not_failed_or_incomplete",
        details: {
          hasPreviousAttempt: true,
          lastGrade: latestGrade?.grade || undefined,
        },
      };
    }

    // Rule 3: Check if attendance fulfilled
    // Since Mode A was used, attendance is assumed fulfilled
    // TODO: Add explicit attendance check when attendance system is implemented
    const attendanceFulfilled = true; // Mode A implies attendance fulfilled

    // Rule 4: Check course credits ≤ 4
    if (Number(course.credits) > 4) {
      return {
        valid: false,
        message: `Graduating course must be ≤ 4 credits. This course has ${course.credits} credits.`,
        reason: "credits_exceed_limit",
        details: {
          hasPreviousAttempt: true,
          lastGrade: latestGrade.grade || undefined,
          attendanceFulfilled,
          courseCredits: Number(course.credits),
        },
      };
    }

    // Rule 5: Check if passing this course will complete degree
    const earnedCredits = Number(student.total_earned_credits);
    const requiredCredits = student.required_credits_for_degree;
    const willComplete = (earnedCredits + Number(course.credits)) >= requiredCredits;

    if (!willComplete) {
      return {
        valid: false,
        message: `Graduating course must lead to degree completion. Earned: ${earnedCredits}, Course: ${course.credits}, Required: ${requiredCredits}`,
        reason: "will_not_complete_degree",
        details: {
          hasPreviousAttempt: true,
          lastGrade: latestGrade.grade || undefined,
          attendanceFulfilled,
          courseCredits: Number(course.credits),
          earnedCredits,
          requiredCredits,
          willComplete: false,
        },
      };
    }

    // All checks passed
    return {
      valid: true,
      message: "Eligible for graduating course registration",
      details: {
        hasPreviousAttempt: true,
        lastGrade: latestGrade.grade || undefined,
        attendanceFulfilled,
        courseCredits: Number(course.credits),
        earnedCredits,
        requiredCredits,
        willComplete: true,
      },
    };
  } catch (error) {
    console.error("Error validating graduating course:", error);
    return {
      valid: false,
      message: "Failed to validate graduating course eligibility",
      reason: "validation_error",
    };
  }
}

/**
 * Check if student is in final year (DERIVED, NOT STORED)
 * Corrected logic: semester 7 or 8 only (not >= 7)
 */
export function isFinalYear(semesterNo: number): boolean {
  // ✅ CORRECTED: Use IN (7,8) instead of >= 7
  // This handles extended students who may be in semester 9+
  return semesterNo === 7 || semesterNo === 8;
}

/**
 * Get degree completion status (DERIVED, NOT STORED)
 */
export function getDegreeCompletionStatus(
  earnedCredits: number,
  requiredCredits: number
): string {
  if (earnedCredits >= requiredCredits) {
    return "COMPLETED";
  }
  if (earnedCredits >= requiredCredits - 10) {
    return "GRADUATING";
  }
  return "IN_PROGRESS";
}

/**
 * Calculate remaining credits for degree
 */
export function calculateRemainingCredits(
  earnedCredits: number,
  requiredCredits: number
): number {
  return Math.max(0, requiredCredits - earnedCredits);
}