import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreditValidationResult {
  valid: boolean;
  currentCredits: number;
  newCourseCredits: number;
  totalCredits: number;
  maxCredits: number;
  message?: string;
}

/**
 * Calculate total credits for a student's registered courses
 */
export async function calculateCurrentCredits(
  enrollmentNo: string
): Promise<number> {
  try {
    const registrations = await prisma.courseRegistration.findMany({
      where: {
        enrollment_no: enrollmentNo,
      },
      include: {
        course: true,
      },
    });

    return registrations.reduce(
      (total, reg) => total + reg.course.credits,
      0
    );
  } catch (error) {
    console.error("Error calculating credits:", error);
    throw new Error("Failed to calculate credits");
  }
}

/**
 * Validate if adding a course exceeds credit limit
 */
export async function validateCreditLimit(
  enrollmentNo: string,
  courseCode: string
): Promise<CreditValidationResult> {
  try {
    // Get current registered credits
    const currentCredits = await calculateCurrentCredits(enrollmentNo);

    // Get new course credits
    const course = await prisma.course.findUnique({
      where: { course_code: courseCode },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const newCourseCredits = course.credits;
    const totalCredits = currentCredits + newCourseCredits;

    // Get max credits rule
    const maxCreditsRule = await prisma.registrationRule.findFirst({
      where: {
        rule_name: "MAX_CREDITS",
        is_active: true,
      },
    });

    const maxCredits = maxCreditsRule
      ? parseInt(maxCreditsRule.rule_value || "20")
      : 20;

    // Validate
    const valid = totalCredits <= maxCredits;

    return {
      valid,
      currentCredits,
      newCourseCredits,
      totalCredits,
      maxCredits,
      message: valid
        ? undefined
        : `Exceeds maximum credit limit. Current: ${currentCredits}, Adding: ${newCourseCredits}, Max: ${maxCredits}`,
    };
  } catch (error) {
    console.error("Error validating credit limit:", error);
    throw new Error("Failed to validate credit limit");
  }
}

/**
 * Get maximum allowed credits from registration rules
 */
export async function getMaxCredits(): Promise<number> {
  try {
    const rule = await prisma.registrationRule.findFirst({
      where: {
        rule_name: "MAX_CREDITS",
        is_active: true,
      },
    });

    return rule ? parseInt(rule.rule_value || "20") : 20;
  } catch (error) {
    console.error("Error fetching max credits:", error);
    return 20; // Default fallback
  }
}
