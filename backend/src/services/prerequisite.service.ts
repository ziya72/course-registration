import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface PrerequisiteCheckResult {
  met: boolean;
  missing: Array<{
    course_code: string;
    course_name: string;
    min_grade: string;
  }>;
}

/**
 * Check if student has met all prerequisites for a course
 */
export async function checkPrerequisites(
  enrollmentNo: string,
  courseCode: string
): Promise<PrerequisiteCheckResult> {
  try {
    // Get prerequisites for the course
    const prerequisites = await prisma.coursePrerequisite.findMany({
      where: { course_code: courseCode },
      include: {
        prerequisite: true, // Include course details
      },
    });

    // If no prerequisites, return met
    if (prerequisites.length === 0) {
      return { met: true, missing: [] };
    }

    // Check each prerequisite
    const missing = [];

    for (const prereq of prerequisites) {
      // Check if student has completed this prerequisite
      const gradeRecord = await prisma.gradeRecord.findFirst({
        where: {
          enrollment_no: enrollmentNo,
          course_code: prereq.prerequisite_course_code,
        },
      });

      // If no grade record, prerequisite not completed
      if (!gradeRecord) {
        missing.push({
          course_code: prereq.prerequisite_course_code,
          course_name: prereq.prerequisite.course_name,
          min_grade: prereq.min_grade,
        });
        continue;
      }

      // Check if grade meets minimum requirement
      const gradeMet = checkGradeRequirement(
        gradeRecord.grade || "",
        prereq.min_grade
      );

      if (!gradeMet) {
        missing.push({
          course_code: prereq.prerequisite_course_code,
          course_name: prereq.prerequisite.course_name,
          min_grade: prereq.min_grade,
        });
      }
    }

    return {
      met: missing.length === 0,
      missing,
    };
  } catch (error) {
    console.error("Error checking prerequisites:", error);
    throw new Error("Failed to check prerequisites");
  }
}

/**
 * Check if grade meets minimum requirement
 * Grades are numeric (0-10 scale) representing CPI/grade points
 */
function checkGradeRequirement(
  actualGrade: string,
  minGrade: string
): boolean {
  // Convert grades to numbers
  const actualValue = parseFloat(actualGrade);
  const minValue = parseFloat(minGrade);

  // If either is NaN, consider as not met
  if (isNaN(actualValue) || isNaN(minValue)) {
    return false;
  }

  // Check if actual grade meets or exceeds minimum
  return actualValue >= minValue;
}

/**
 * Get all prerequisites for a course
 */
export async function getPrerequisites(courseCode: string) {
  try {
    return await prisma.coursePrerequisite.findMany({
      where: { course_code: courseCode },
      include: {
        prerequisite: true,
      },
    });
  } catch (error) {
    console.error("Error fetching prerequisites:", error);
    throw new Error("Failed to fetch prerequisites");
  }
}
