import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AdvancedCourseEligibility {
  isEligible: boolean;
  requirements: Array<{
    type: string;
    value: string;
    description: string;
    isMet: boolean;
    currentValue?: string;
  }>;
  message: string;
}

/**
 * Check if student is eligible for advanced course
 */
export async function checkAdvancedCourseEligibility(
  enrollmentNo: string,
  courseCode: string
): Promise<AdvancedCourseEligibility> {
  try {
    // Get course and its requirements
    const course = await prisma.course.findUnique({
      where: { course_code: courseCode },
      include: {
        advanced_requirements: {
          where: { is_active: true },
        },
      },
    });

    if (!course) {
      return {
        isEligible: false,
        requirements: [],
        message: "Course not found",
      };
    }

    if (!course.is_advanced) {
      return {
        isEligible: true,
        requirements: [],
        message: "This is not an advanced course - no special requirements",
      };
    }

    // Get student data
    const student = await prisma.student.findUnique({
      where: { enrollment_no: enrollmentNo },
      include: {
        grades: {
          include: { course: true },
        },
      },
    });

    if (!student) {
      return {
        isEligible: false,
        requirements: [],
        message: "Student not found",
      };
    }

    const requirements = [];
    let allRequirementsMet = true;

    // Check each requirement
    for (const req of course.advanced_requirements) {
      let isMet = false;
      let currentValue = "";

      switch (req.requirement_type) {
        case "MIN_CPI":
          const requiredCPI = parseFloat(req.requirement_value);
          const currentCPI = Number(student.current_cpi);
          isMet = currentCPI >= requiredCPI;
          currentValue = currentCPI.toFixed(3);
          break;

        case "MIN_GRADE_IN_COURSE":
          const [prereqCourse, minGrade] = req.requirement_value.split(":");
          const gradeRecord = student.grades.find(g => g.course_code === prereqCourse);
          if (gradeRecord && gradeRecord.grade) {
            const gradePoints = getGradePoints(gradeRecord.grade.toString());
            const requiredGradePoints = getGradePoints(minGrade);
            isMet = gradePoints >= requiredGradePoints;
            currentValue = gradeRecord.grade.toString();
          } else {
            isMet = false;
            currentValue = "Not taken";
          }
          break;

        case "MIN_CREDITS":
          const requiredCredits = parseFloat(req.requirement_value);
          const earnedCredits = Number(student.total_earned_credits);
          isMet = earnedCredits >= requiredCredits;
          currentValue = earnedCredits.toString();
          break;

        case "PERMISSION":
          // This would need to be handled separately (manual approval)
          isMet = false; // Default to false, requires manual approval
          currentValue = "Requires approval";
          break;

        default:
          isMet = false;
          currentValue = "Unknown requirement type";
      }

      requirements.push({
        type: req.requirement_type,
        value: req.requirement_value,
        description: req.description || `${req.requirement_type}: ${req.requirement_value}`,
        isMet,
        currentValue,
      });

      if (!isMet) {
        allRequirementsMet = false;
      }
    }

    return {
      isEligible: allRequirementsMet,
      requirements,
      message: allRequirementsMet
        ? "Student meets all requirements for this advanced course"
        : "Student does not meet all requirements for this advanced course",
    };
  } catch (error) {
    console.error("Error checking advanced course eligibility:", error);
    return {
      isEligible: false,
      requirements: [],
      message: "Error checking eligibility",
    };
  }
}

/**
 * Get all advanced courses available to student
 */
export async function getAvailableAdvancedCourses(enrollmentNo: string) {
  try {
    const advancedCourses = await prisma.course.findMany({
      where: {
        is_advanced: true,
        is_running: true,
      },
      include: {
        advanced_requirements: {
          where: { is_active: true },
        },
      },
    });

    const coursesWithEligibility = await Promise.all(
      advancedCourses.map(async (course) => {
        const eligibility = await checkAdvancedCourseEligibility(enrollmentNo, course.course_code);
        return {
          ...course,
          eligibility,
        };
      })
    );

    return coursesWithEligibility;
  } catch (error) {
    console.error("Error getting available advanced courses:", error);
    return [];
  }
}

/**
 * Helper function to get grade points from grade enum
 */
function getGradePoints(grade: string): number {
  const gradePointsMap: { [key: string]: number } = {
    "A_PLUS": 10.0,
    "A": 9.0,
    "B_PLUS": 8.0,
    "B": 7.0,
    "C": 6.0,
    "D": 5.0,
    "E": 4.0,
    "F": 0.0,
    "I": 0.0,
  };
  return gradePointsMap[grade] ?? 0.0;
}

/**
 * Create advanced course requirement
 */
export async function createAdvancedCourseRequirement(
  courseCode: string,
  requirementType: string,
  requirementValue: string,
  description?: string
) {
  return await prisma.advancedCourseRequirement.create({
    data: {
      course_code: courseCode,
      requirement_type: requirementType,
      requirement_value: requirementValue,
      description,
    },
  });
}

/**
 * Example: Set CPI requirement for a course
 */
export async function setCPIRequirement(courseCode: string, minCPI: number) {
  return await createAdvancedCourseRequirement(
    courseCode,
    "MIN_CPI",
    minCPI.toString(),
    `Minimum CPI of ${minCPI} required`
  );
}