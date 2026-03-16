import { PrismaClient, AttemptType, RegistrationMode } from "@prisma/client";

const prisma = new PrismaClient();

export interface AttemptInfo {
  attemptNumber: number;
  attemptType: AttemptType;
  hasPassedBefore: boolean;
  lastGrade?: string;
  canImprove: boolean;
}

/**
 * Determine attempt type automatically based on course history
 * Students should NOT decide attempt type - system derives it
 */
export async function determineAttemptType(
  enrollmentNo: string,
  courseCode: string,
  requestedType: string // from registrationType in API
): Promise<{ attemptType: AttemptType; attemptNumber: number }> {
  try {
    // Get all previous attempts for this course
    const previousAttempts = await prisma.courseAttempt.findMany({
      where: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
      },
      orderBy: {
        attempt_number: 'desc',
      },
    });

    const attemptNumber = previousAttempts.length + 1;

    // If no previous attempts, must be REGULAR
    if (previousAttempts.length === 0) {
      return {
        attemptType: AttemptType.REGULAR,
        attemptNumber: 1,
      };
    }

    // Get latest grade from GradeRecord
    const latestGrade = await prisma.gradeRecord.findFirst({
      where: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
      },
      orderBy: [
        { sem: 'desc' },
      ],
    });

    const lastGrade = latestGrade?.grade;

    // Determine attempt type based on previous result and request
    if (!lastGrade || ['E', 'F', 'I'].includes(lastGrade)) {
      // Course failed or incomplete - this is BACKLOG
      return {
        attemptType: AttemptType.BACKLOG,
        attemptNumber,
      };
    } else if (['D', 'C'].includes(lastGrade) && requestedType === 'improvement') {
      // Course passed with low grade and improvement requested
      return {
        attemptType: AttemptType.IMPROVEMENT,
        attemptNumber,
      };
    } else {
      // Course already passed well - should not register again
      throw new Error(`Course already passed with grade ${lastGrade}. Cannot register again.`);
    }
  } catch (error) {
    console.error("Error determining attempt type:", error);
    throw error;
  }
}

/**
 * Get attempt information for a course
 */
export async function getAttemptInfo(
  enrollmentNo: string,
  courseCode: string
): Promise<AttemptInfo> {
  try {
    const attempts = await prisma.courseAttempt.findMany({
      where: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
      },
      orderBy: {
        attempt_number: 'desc',
      },
    });

    const attemptNumber = attempts.length + 1;

    // Get latest grade
    const latestGrade = await prisma.gradeRecord.findFirst({
      where: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
      },
      orderBy: [
        { sem: 'desc' },
      ],
    });

    const lastGrade = latestGrade?.grade;
    const hasPassedBefore = lastGrade && !['E', 'F', 'I'].includes(lastGrade);

    // Check if improvement is possible
    const canImprove = !!hasPassedBefore && 
                      ['D', 'C'].includes(lastGrade || '') &&
                      !attempts.some(a => a.attempt_type === AttemptType.IMPROVEMENT);

    let attemptType: AttemptType = AttemptType.REGULAR;
    if (attempts.length > 0) {
      if (!hasPassedBefore) {
        attemptType = AttemptType.BACKLOG;
      }
    }

    return {
      attemptNumber,
      attemptType,
      hasPassedBefore: !!hasPassedBefore,
      lastGrade: lastGrade || undefined,
      canImprove: canImprove,
    };
  } catch (error) {
    console.error("Error getting attempt info:", error);
    throw new Error("Failed to get attempt information");
  }
}

/**
 * Record course attempt AFTER registration succeeds
 */
export async function recordCourseAttempt(
  enrollmentNo: string,
  courseCode: string,
  attemptType: AttemptType,
  attemptNumber: number,
  registrationMode: RegistrationMode,
  academicYear: number,
  semesterType: number,
  semesterNo: number
): Promise<void> {
  try {
    await prisma.courseAttempt.create({
      data: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
        attempt_number: attemptNumber,
        attempt_type: attemptType,
        academic_year: academicYear,
        semester_type: semesterType,
        semester_no: semesterNo,
        registration_mode: registrationMode,
      },
    });

    console.log(`✅ Recorded attempt: ${enrollmentNo} -> ${courseCode} (${attemptType} #${attemptNumber}, Mode ${registrationMode})`);
  } catch (error) {
    console.error("Error recording course attempt:", error);
    throw new Error("Failed to record course attempt");
  }
}

/**
 * Get total attempt count for a course
 */
export async function getAttemptCount(
  enrollmentNo: string,
  courseCode: string
): Promise<number> {
  try {
    return await prisma.courseAttempt.count({
      where: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
      },
    });
  } catch (error) {
    console.error("Error getting attempt count:", error);
    return 0;
  }
}

/**
 * Get previous attempts for mode validation
 */
export async function getPreviousAttempts(
  enrollmentNo: string,
  courseCode: string
): Promise<any[]> {
  try {
    return await prisma.courseAttempt.findMany({
      where: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
      },
      orderBy: {
        attempt_number: 'asc',
      },
    });
  } catch (error) {
    console.error("Error getting previous attempts:", error);
    return [];
  }
}

/**
 * Update attempt result when grades are uploaded
 */
export async function updateAttemptResult(
  enrollmentNo: string,
  courseCode: string,
  academicYear: number,
  semesterType: number,
  grade: string
): Promise<void> {
  try {
    await prisma.courseAttempt.updateMany({
      where: {
        enrollment_no: enrollmentNo,
        course_code: courseCode,
        academic_year: academicYear,
        semester_type: semesterType,
      },
      data: {
        grade_obtained: grade,
        is_completed: true,
      },
    });

    console.log(`✅ Updated attempt result: ${enrollmentNo} -> ${courseCode} = ${grade}`);
  } catch (error) {
    console.error("Error updating attempt result:", error);
    throw new Error("Failed to update attempt result");
  }
}