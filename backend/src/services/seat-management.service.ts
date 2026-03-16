import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SeatCheckResult {
  available: boolean;
  currentEnrollment: number;
  maxSeats: number | null;
  availableSeats: number | null;
  message?: string;
}

/**
 * Get current enrollment count (CALCULATED DYNAMICALLY, NOT STORED)
 * This prevents inconsistency from drops, deletions, or migrations
 */
export async function getCurrentEnrollment(
  courseCode: string,
  academicYear: number,
  semesterType: number
): Promise<number> {
  try {
    // ✅ Calculate dynamically from CourseRegistration table
    const count = await prisma.courseRegistration.count({
      where: {
        course_code: courseCode,
        academic_year: academicYear,
        semester_type: semesterType,
        status: 'ACTIVE', // Only count active registrations
        deleted_at: null,  // Exclude soft-deleted (already exists in schema)
      },
    });

    console.log(`📊 Current enrollment for ${courseCode}: ${count}`);
    return count;
  } catch (error) {
    console.error("Error getting current enrollment:", error);
    return 0;
  }
}

/**
 * Check if seats are available for a course
 */
export async function checkSeatAvailability(
  courseCode: string,
  academicYear: number,
  semesterType: number
): Promise<SeatCheckResult> {
  try {
    // Get course details
    const course = await prisma.course.findUnique({
      where: { course_code: courseCode },
    });

    if (!course) {
      return {
        available: false,
        currentEnrollment: 0,
        maxSeats: null,
        availableSeats: null,
        message: "Course not found",
      };
    }

    // If max_seats is NULL, unlimited seats
    if (course.max_seats === null) {
      return {
        available: true,
        currentEnrollment: 0,
        maxSeats: null,
        availableSeats: null,
        message: "Unlimited seats available",
      };
    }

    // Calculate current enrollment dynamically
    const currentEnrollment = await getCurrentEnrollment(
      courseCode,
      academicYear,
      semesterType
    );

    const availableSeats = course.max_seats - currentEnrollment;

    // Check if seats available
    if (currentEnrollment < course.max_seats) {
      return {
        available: true,
        currentEnrollment,
        maxSeats: course.max_seats,
        availableSeats,
        message: `${availableSeats} seat(s) available`,
      };
    }

    // Check oversubscription rules
    const canOversubscribe = await checkOversubscriptionAllowed();
    if (canOversubscribe.allowed) {
      const oversubscriptionLimit = Math.floor(
        course.max_seats * (1 + canOversubscribe.percentage / 100)
      );

      if (currentEnrollment < oversubscriptionLimit) {
        return {
          available: true,
          currentEnrollment,
          maxSeats: course.max_seats,
          availableSeats: oversubscriptionLimit - currentEnrollment,
          message: `Oversubscription allowed. ${oversubscriptionLimit - currentEnrollment} seat(s) available`,
        };
      }
    }

    // Course is full
    return {
      available: false,
      currentEnrollment,
      maxSeats: course.max_seats,
      availableSeats: 0,
      message: "Course is full. No seats available.",
    };
  } catch (error) {
    console.error("Error checking seat availability:", error);
    return {
      available: false,
      currentEnrollment: 0,
      maxSeats: null,
      availableSeats: null,
      message: "Failed to check seat availability",
    };
  }
}

/**
 * Check if oversubscription is allowed
 */
async function checkOversubscriptionAllowed(): Promise<{
  allowed: boolean;
  percentage: number;
}> {
  try {
    const allowRule = await prisma.registrationRule.findFirst({
      where: {
        rule_name: "ALLOW_OVERSUBSCRIPTION",
        is_active: true,
      },
    });

    const percentageRule = await prisma.registrationRule.findFirst({
      where: {
        rule_name: "OVERSUBSCRIPTION_PERCENTAGE",
        is_active: true,
      },
    });

    const allowed = allowRule?.rule_value === "true";
    const percentage = percentageRule
      ? parseInt(percentageRule.rule_value || "10")
      : 10;

    return { allowed, percentage };
  } catch (error) {
    console.error("Error checking oversubscription rules:", error);
    return { allowed: false, percentage: 0 };
  }
}

/**
 * Get available seats for a course
 */
export async function getAvailableSeats(
  courseCode: string,
  academicYear: number,
  semesterType: number
): Promise<number | null> {
  try {
    const seatCheck = await checkSeatAvailability(
      courseCode,
      academicYear,
      semesterType
    );

    return seatCheck.availableSeats;
  } catch (error) {
    console.error("Error getting available seats:", error);
    return null;
  }
}