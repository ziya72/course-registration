import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CGPAValidationResult {
  valid: boolean;
  currentCGPA: number;
  requiredCGPA: number;
  backlogCount: number;
  message?: string;
  reason?: string;
}

/**
 * Calculate backlog count from latest grades (NOT stored in DB)
 * Backlog = courses with latest grade in ['E', 'F', 'I']
 */
export async function calculateBacklogCount(enrollmentNo: string): Promise<number> {
  try {
    // Get all grade records for student
    const allGrades = await prisma.gradeRecord.findMany({
      where: { enrollment_no: enrollmentNo },
      orderBy: [
        { course_code: 'asc' },
        { sem: 'desc' },
      ],
    });

    // Group by course and get latest grade for each
    const courseLatestGrades = new Map<string, string>();
    
    allGrades.forEach(record => {
      const courseCode = record.course_code;
      if (!courseLatestGrades.has(courseCode) && record.grade) {
        courseLatestGrades.set(courseCode, record.grade);
      }
    });

    // Count courses with failing grades
    let backlogCount = 0;
    courseLatestGrades.forEach(grade => {
      if (['E', 'F', 'I'].includes(grade)) {
        backlogCount++;
      }
    });

    console.log(`📊 Backlog calculation for ${enrollmentNo}:`, {
      totalCourses: courseLatestGrades.size,
      backlogCount,
      failedCourses: Array.from(courseLatestGrades.entries())
        .filter(([_, grade]) => ['E', 'F', 'I'].includes(grade))
        .map(([course, grade]) => `${course}:${grade}`),
    });

    return backlogCount;
  } catch (error) {
    console.error("Error calculating backlog count:", error);
    return 0;
  }
}

/**
 * Validate minor degree registration eligibility
 * Requirements: CGPA ≥ 7.5, no backlog, after 2nd semester
 */
export async function validateMinorDegreeEligibility(
  enrollmentNo: string
): Promise<CGPAValidationResult> {
  try {
    const student = await prisma.student.findUnique({
      where: { enrollment_no: enrollmentNo },
    });

    if (!student) {
      return {
        valid: false,
        currentCGPA: 0,
        requiredCGPA: 7.5,
        backlogCount: 0,
        message: "Student not found",
        reason: 'student_not_found',
      };
    }

    const currentCGPA = Number(student.current_cpi);
    const backlogCount = await calculateBacklogCount(enrollmentNo);
    const requiredCGPA = 7.5;

    // Check semester requirement
    if (student.current_semester <= 2) {
      return {
        valid: false,
        currentCGPA,
        requiredCGPA,
        backlogCount,
        message: "Minor degree registration allowed only after 2nd semester",
        reason: 'semester_requirement_not_met',
      };
    }

    // Check CGPA requirement
    if (currentCGPA < requiredCGPA) {
      return {
        valid: false,
        currentCGPA,
        requiredCGPA,
        backlogCount,
        message: `CGPA ${currentCGPA} is below required ${requiredCGPA}`,
        reason: 'cgpa_insufficient',
      };
    }

    // Check backlog requirement
    if (backlogCount > 0) {
      return {
        valid: false,
        currentCGPA,
        requiredCGPA,
        backlogCount,
        message: `Cannot register for minor degree with ${backlogCount} backlog course(s)`,
        reason: 'backlog_exists',
      };
    }

    return {
      valid: true,
      currentCGPA,
      requiredCGPA,
      backlogCount,
      message: "Eligible for minor degree registration",
    };
  } catch (error) {
    console.error("Error validating minor degree eligibility:", error);
    return {
      valid: false,
      currentCGPA: 0,
      requiredCGPA: 7.5,
      backlogCount: 0,
      message: "Failed to validate minor degree eligibility",
      reason: 'validation_error',
    };
  }
}

/**
 * Validate third-year student registering for final year course
 * Requirements: CGPA ≥ 7.5, no backlog, prerequisites cleared
 */
export async function validateThirdYearFinalYearCourse(
  enrollmentNo: string,
  courseCode: string
): Promise<CGPAValidationResult> {
  try {
    const student = await prisma.student.findUnique({
      where: { enrollment_no: enrollmentNo },
    });

    const course = await prisma.course.findUnique({
      where: { course_code: courseCode },
    });

    if (!student || !course) {
      return {
        valid: false,
        currentCGPA: 0,
        requiredCGPA: 7.5,
        backlogCount: 0,
        message: "Student or course not found",
        reason: 'not_found',
      };
    }

    const currentCGPA = Number(student.current_cpi);
    const backlogCount = await calculateBacklogCount(enrollmentNo);
    const requiredCGPA = 7.5;

    // Check if student is in third year (semester 5 or 6)
    const isThirdYear = [5, 6].includes(student.current_semester);
    if (!isThirdYear) {
      return {
        valid: false,
        currentCGPA,
        requiredCGPA,
        backlogCount,
        message: "This rule applies only to third-year students (semester 5-6)",
        reason: 'not_third_year',
      };
    }

    // Check if course is final year course (semester 7 or 8)
    const isFinalYearCourse = [7, 8].includes(course.semester_no);
    if (!isFinalYearCourse) {
      return {
        valid: true, // Not a final year course, no special validation needed
        currentCGPA,
        requiredCGPA,
        backlogCount,
        message: "Not a final year course, no special validation required",
      };
    }

    // Check CGPA requirement
    if (currentCGPA < requiredCGPA) {
      return {
        valid: false,
        currentCGPA,
        requiredCGPA,
        backlogCount,
        message: `CGPA ${currentCGPA} is below required ${requiredCGPA} for final year course`,
        reason: 'cgpa_insufficient',
      };
    }

    // Check backlog requirement
    if (backlogCount > 0) {
      return {
        valid: false,
        currentCGPA,
        requiredCGPA,
        backlogCount,
        message: `Cannot register for final year course with ${backlogCount} backlog course(s)`,
        reason: 'backlog_exists',
      };
    }

    return {
      valid: true,
      currentCGPA,
      requiredCGPA,
      backlogCount,
      message: "Eligible to register for final year course",
    };
  } catch (error) {
    console.error("Error validating third year final year course:", error);
    return {
      valid: false,
      currentCGPA: 0,
      requiredCGPA: 7.5,
      backlogCount: 0,
      message: "Failed to validate final year course eligibility",
      reason: 'validation_error',
    };
  }
}

/**
 * Generic CGPA requirement checker
 */
export async function checkCGPARequirement(
  enrollmentNo: string,
  requiredCGPA: number,
  requireNoBacklog: boolean = false
): Promise<CGPAValidationResult> {
  try {
    const student = await prisma.student.findUnique({
      where: { enrollment_no: enrollmentNo },
    });

    if (!student) {
      return {
        valid: false,
        currentCGPA: 0,
        requiredCGPA,
        backlogCount: 0,
        message: "Student not found",
        reason: 'student_not_found',
      };
    }

    const currentCGPA = Number(student.current_cpi);
    const backlogCount = requireNoBacklog ? await calculateBacklogCount(enrollmentNo) : 0;

    // Check CGPA
    if (currentCGPA < requiredCGPA) {
      return {
        valid: false,
        currentCGPA,
        requiredCGPA,
        backlogCount,
        message: `CGPA ${currentCGPA} is below required ${requiredCGPA}`,
        reason: 'cgpa_insufficient',
      };
    }

    // Check backlog if required
    if (requireNoBacklog && backlogCount > 0) {
      return {
        valid: false,
        currentCGPA,
        requiredCGPA,
        backlogCount,
        message: `Cannot proceed with ${backlogCount} backlog course(s)`,
        reason: 'backlog_exists',
      };
    }

    return {
      valid: true,
      currentCGPA,
      requiredCGPA,
      backlogCount,
      message: "CGPA requirement met",
    };
  } catch (error) {
    console.error("Error checking CGPA requirement:", error);
    return {
      valid: false,
      currentCGPA: 0,
      requiredCGPA,
      backlogCount: 0,
      message: "Failed to check CGPA requirement",
      reason: 'validation_error',
    };
  }
}