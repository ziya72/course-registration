import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface ElectiveValidationResult {
  valid: boolean;
  groupCode?: string;
  currentCount: number;
  minSelection: number;
  maxSelection: number;
  message?: string;
}

/**
 * Validate elective course selection
 */
export async function validateElectiveSelection(
  enrollmentNo: string,
  courseCode: string
): Promise<ElectiveValidationResult> {
  try {
    // Get course details
    const course = await prisma.course.findUnique({
      where: { course_code: courseCode },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // If not an elective, no validation needed
    if (!course.is_elective || !course.elective_group) {
      return {
        valid: true,
        currentCount: 0,
        minSelection: 0,
        maxSelection: 0,
      };
    }

    // Get elective group details
    const electiveGroup = await prisma.electiveGroup.findFirst({
      where: {
        group_code: course.elective_group,
        branch_code: course.branch_code,
        semester_no: course.semester_no,
      },
    });

    if (!electiveGroup) {
      // If group not found, allow registration
      return {
        valid: true,
        currentCount: 0,
        minSelection: 0,
        maxSelection: 0,
      };
    }

    // Get student's current registrations in this elective group
    const currentRegistrations = await prisma.courseRegistration.findMany({
      where: {
        enrollment_no: enrollmentNo,
      },
      include: {
        course: true,
      },
    });

    // Count courses in same elective group
    const currentCount = currentRegistrations.filter(
      (reg) =>
        reg.course.is_elective &&
        reg.course.elective_group === course.elective_group
    ).length;

    // Check if adding this course exceeds max selection
    const newCount = currentCount + 1;
    const valid = newCount <= electiveGroup.max_selection;

    return {
      valid,
      groupCode: electiveGroup.group_code,
      currentCount,
      minSelection: electiveGroup.min_selection,
      maxSelection: electiveGroup.max_selection,
      message: valid
        ? undefined
        : `Exceeds maximum selection for elective group ${electiveGroup.group_name}. Max: ${electiveGroup.max_selection}, Current: ${currentCount}`,
    };
  } catch (error) {
    console.error("Error validating elective selection:", error);
    throw new Error("Failed to validate elective selection");
  }
}

/**
 * Get elective groups for a branch and semester
 */
export async function getElectiveGroups(
  branchCode: string,
  semesterNo: number
) {
  try {
    return await prisma.electiveGroup.findMany({
      where: {
        branch_code: branchCode,
        semester_no: semesterNo,
      },
    });
  } catch (error) {
    console.error("Error fetching elective groups:", error);
    throw new Error("Failed to fetch elective groups");
  }
}

/**
 * Check if student has met minimum elective requirements
 */
export async function checkMinimumElectives(
  enrollmentNo: string,
  branchCode: string,
  semesterNo: number
): Promise<{ met: boolean; missing: string[] }> {
  try {
    const electiveGroups = await getElectiveGroups(branchCode, semesterNo);
    const missing: string[] = [];

    for (const group of electiveGroups) {
      // Get student's registrations in this group
      const registrations = await prisma.courseRegistration.findMany({
        where: {
          enrollment_no: enrollmentNo,
        },
        include: {
          course: true,
        },
      });

      const count = registrations.filter(
        (reg) =>
          reg.course.is_elective &&
          reg.course.elective_group === group.group_code
      ).length;

      if (count < group.min_selection) {
        missing.push(
          `${group.group_name} (need ${group.min_selection - count} more)`
        );
      }
    }

    return {
      met: missing.length === 0,
      missing,
    };
  } catch (error) {
    console.error("Error checking minimum electives:", error);
    throw new Error("Failed to check minimum electives");
  }
}
