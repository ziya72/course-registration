import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface ScheduleConflictResult {
  conflict: boolean;
  conflictingCourse?: {
    course_code: string;
    course_name: string;
    day: string;
    time: string;
  };
  message?: string;
}

/**
 * Check for schedule conflicts when registering a new course
 */
export async function checkScheduleConflict(
  enrollmentNo: string,
  newCourseCode: string
): Promise<ScheduleConflictResult> {
  try {
    // Get student's currently registered courses
    const registrations = await prisma.courseRegistration.findMany({
      where: {
        enrollment_no: enrollmentNo,
      },
      include: {
        course: {
          include: {
            schedules: true,
          },
        },
      },
    });

    // Get schedule for new course
    const newCourseSchedules = await prisma.courseSchedule.findMany({
      where: {
        course_code: newCourseCode,
      },
    });

    // If no schedules defined, no conflict
    if (newCourseSchedules.length === 0) {
      return { conflict: false };
    }

    // Check each registered course for conflicts
    for (const registration of registrations) {
      const existingSchedules = registration.course.schedules;

      for (const newSchedule of newCourseSchedules) {
        for (const existingSchedule of existingSchedules) {
          // Check if same day
          if (
            newSchedule.day_of_week === existingSchedule.day_of_week &&
            newSchedule.start_time &&
            newSchedule.end_time &&
            existingSchedule.start_time &&
            existingSchedule.end_time
          ) {
            // Check for time overlap
            const conflict = checkTimeOverlap(
              newSchedule.start_time,
              newSchedule.end_time,
              existingSchedule.start_time,
              existingSchedule.end_time
            );

            if (conflict) {
              return {
                conflict: true,
                conflictingCourse: {
                  course_code: registration.course.course_code,
                  course_name: registration.course.course_name,
                  day: existingSchedule.day_of_week || "",
                  time: `${formatTime(existingSchedule.start_time)}-${formatTime(existingSchedule.end_time)}`,
                },
                message: `Schedule conflict with ${registration.course.course_code} on ${existingSchedule.day_of_week}`,
              };
            }
          }
        }
      }
    }

    return { conflict: false };
  } catch (error) {
    console.error("Error checking schedule conflict:", error);
    throw new Error("Failed to check schedule conflict");
  }
}

/**
 * Check if two time ranges overlap
 */
function checkTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  const s1 = start1.getTime();
  const e1 = end1.getTime();
  const s2 = start2.getTime();
  const e2 = end2.getTime();

  // Check if ranges overlap
  return s1 < e2 && s2 < e1;
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Get schedule for a course
 */
export async function getCourseSchedule(courseCode: string) {
  try {
    return await prisma.courseSchedule.findMany({
      where: { course_code: courseCode },
    });
  } catch (error) {
    console.error("Error fetching course schedule:", error);
    throw new Error("Failed to fetch course schedule");
  }
}
