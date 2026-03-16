import { PrismaClient } from "@prisma/client";
import { getPreviousAttempts } from "./attempt-tracking.service";

const prisma = new PrismaClient();

export interface ImprovementValidationResult {
  valid: boolean;
  message?: string;
  reason?: string;
  details?: {
    courseType?: string;
    firstAttemptGrade?: string;
    hasPassedBefore?: boolean;
    improvementTaken?: boolean;
    previousAttempts?: number;
  };
}

/**
 * Validate improvement eligibility
 * Rules:
 * 1. Course passed in first attempt (grade >= D, not F/E/I)
 * 2. Only once (no previous improvement attempts)
 * 3. Only theory courses (not lab/project/seminar)
 * 4. Mode B or C only (NOT Mode A)
 */
export async function validateImprovementEligibility(
  enrollmentNo: string,
  courseCode: string,
  registrationMode: string
): Promise<ImprovementValidationResult> {
  try {
    console.log(`🔍 Validating improvement eligibility: ${courseCode} for ${enrollmentNo}`);

    // Check course type (must be Theory)
    const course = await prisma.course.findUnique({
      where: { course_code: courseCode },
    });

    if (!course) {
      return {
        valid: false,
        message: "Course not found",
        reason: 'course_not_found',
      };
    }

    // Rule 3: Only theory courses
    if (course.course_type !== 'Theory') {
      return {
        valid: false,
        message: `Improvement not allowed for ${course.course_type} courses. Only Theory courses can be improved.`,
        reason: 'not_theory_course',
        details: {
          courseType: course.course_type,
        },
      };
    }

    // Rule 4: Mode A not allowed for improvement (checked in mode validation)
    if (registrationMode === 'A') {
      return {
        valid: false,
        message: "Mode A not allowed for improvement. Use Mode B or C.",
        reason: 'improvement_mode_a_not_allowed',
      };
    }

    // Get first attempt grade
    const firstAttemptGrade = await getFirstAttemptGrade(enrollmentNo, courseCode);
    
    if (!firstAttemptGrade) {
      return {
        valid: false,
        message: "No previous attempt found. Cannot improve without first attempting the course.",
        reason: 'no_previous_attempt',
      };
    }

    // Rule 1: Course must have been passed in first attempt
    const hasPassedBefore = !['E', 'F', 'I'].includes(firstAttemptGrade);
    
    if (!hasPassedBefore) {
      return {
        valid: false,
        message: `Cannot improve failed course. First attempt grade was ${firstAttemptGrade}. Use backlog registration instead.`,
        reason: 'course_not_passed',
        details: {
          firstAttemptGrade,
          hasPassedBefore: false,
        },
      };
    }

    // Rule 2: Check if improvement already taken
    const previousAttempts = await getPreviousAttempts(enrollmentNo, courseCode);
    const improvementTaken = previousAttempts.some(attempt => attempt.attempt_type === 'IMPROVEMENT');

    if (improvementTaken) {
      return {
        valid: false,
        message: "Improvement already taken for this course. Only one improvement attempt allowed.",
        reason: 'already_improved',
        details: {
          improvementTaken: true,
          previousAttempts: previousAttempts.length,
        },
      };
    }

    // All checks passed
    return {
      valid: true,
      message: "Eligible for improvement registration",
      details: {
        courseType: course.course_type,
        firstAttemptGrade,
        hasPassedBefore: true,
        improvementTaken: false,
        previousAttempts: previousAttempts.length,
      },
    };

  } catch (error) {
    console.error("Error validating improvement eligibility:", error);
    return {
      valid: false,
      message: "Failed to validate improvement eligibility",
      reason: 'validation_error',
    };
  }
}

/**
 * Get first attempt grade for a course
 */
async function getFirstAttemptGrade(
  enrollmentNo: string,
  courseCode: string
): Promise<string | null> {
  try {
    // Get the earliest grade record (first attempt)
    const firstGrade = await prisma.gradeRecord.findFirst({
      where: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
      },
      orderBy: [
        { sem: 'asc' },
      ],
    });

    return firstGrade?.grade || null;
  } catch (error) {
    console.error("Error getting first attempt grade:", error);
    return null;
  }
}

/**
 * Check if course passed on first attempt
 */
export async function checkCoursePassedOnce(
  enrollmentNo: string,
  courseCode: string
): Promise<boolean> {
  try {
    const firstGrade = await getFirstAttemptGrade(enrollmentNo, courseCode);
    return firstGrade ? !['E', 'F', 'I'].includes(firstGrade) : false;
  } catch (error) {
    console.error("Error checking if course passed once:", error);
    return false;
  }
}

/**
 * Check if improvement not already taken
 */
export async function checkImprovementNotTaken(
  enrollmentNo: string,
  courseCode: string
): Promise<boolean> {
  try {
    const previousAttempts = await getPreviousAttempts(enrollmentNo, courseCode);
    return !previousAttempts.some(attempt => attempt.attempt_type === 'IMPROVEMENT');
  } catch (error) {
    console.error("Error checking improvement status:", error);
    return false;
  }
}

/**
 * Check if course type is Theory
 */
export async function checkCourseTypeTheory(courseCode: string): Promise<boolean> {
  try {
    const course = await prisma.course.findUnique({
      where: { course_code: courseCode },
    });

    return course?.course_type === 'Theory';
  } catch (error) {
    console.error("Error checking course type:", error);
    return false;
  }
}

/**
 * Get improvement attempt count for a course
 */
export async function getPreviousImprovementAttempts(
  enrollmentNo: string,
  courseCode: string
): Promise<number> {
  try {
    const attempts = await getPreviousAttempts(enrollmentNo, courseCode);
    return attempts.filter(attempt => attempt.attempt_type === 'IMPROVEMENT').length;
  } catch (error) {
    console.error("Error getting improvement attempts:", error);
    return 0;
  }
}