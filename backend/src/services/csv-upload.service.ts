//csv-upload.service.ts
import { PrismaClient } from "@prisma/client";
import Papa from "papaparse";

const prisma = new PrismaClient();

// Grade to grade points mapping
const gradePoints: { [key: string]: number } = {
  "A+": 10.0,
  "A": 9.0,
  "B+": 8.0,
  "B": 7.0,
  "C": 6.0,
  "D": 5.0,
  "F": 0.0,
  "I": 0.0, // Incomplete
  "0": 0.0, // No grade
};

interface ParsedRow {
  faculty_no: string;
  enrollment_no: string;
  semester: string;
  current_semester: number;
  name?: string;
  hall?: string;
  spi?: number;
  cpi?: number;
  courses: Array<{ course_code: string; grade: string }>;
}

/**
 * Parse CSV content and detect format
 */
export async function parseCSV(csvContent: string): Promise<{ rows: ParsedRow[]; format: string; errors: string[] }> {
  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    parsed.errors.forEach((err) => errors.push(`CSV Parse Error: ${err.message}`));
    return { rows, format: "unknown", errors };
  }

  const data = parsed.data as any[];
  if (data.length === 0) {
    errors.push("CSV file is empty");
    return { rows, format: "unknown", errors };
  }

  // Detect format based on headers
  const headers = Object.keys(data[0]);
  const isFormat2 = headers.includes("FacultyN") || headers.includes("EnrolN");

  if (isFormat2) {
    // Format 2: Sem, Br, FacultyN, EnrolN, Name, Semester, Hall, SPI, CPI, etc.
    return parseFormat2(data, errors);
  } else {
    // Format 1: faculty_no, enrollment_no, semester, current_sem, course-grade pairs
    return parseFormat1(data, errors);
  }
}

/**
 * Parse Format 1: faculty_no, enrollment_no, semester, current_sem, course-grade pairs
 */
function parseFormat1(data: any[], errors: string[]): { rows: ParsedRow[]; format: string; errors: string[] } {
  const rows: ParsedRow[] = [];

  data.forEach((row, index) => {
    try {
      const keys = Object.keys(row);
      
      // First 4 columns are fixed
      const faculty_no = row[keys[0]]?.toString().trim();
      const enrollment_no = row[keys[1]]?.toString().trim();
      const semester = row[keys[2]]?.toString().trim();
      const current_semester = parseInt(row[keys[3]]?.toString().trim() || "0");

      if (!faculty_no || !enrollment_no || !semester) {
        errors.push(`Row ${index + 2}: Missing required fields (faculty_no, enrollment_no, or semester)`);
        return;
      }

      // Remaining columns are course-grade pairs
      const courses: Array<{ course_code: string; grade: string }> = [];
      for (let i = 4; i < keys.length; i += 2) {
        const course_code = row[keys[i]]?.toString().trim();
        const grade = row[keys[i + 1]]?.toString().trim();

        if (course_code && grade && grade !== "0") {
          courses.push({ course_code, grade });
        }
      }

      rows.push({
        faculty_no,
        enrollment_no,
        semester,
        current_semester,
        courses,
      });
    } catch (err: any) {
      errors.push(`Row ${index + 2}: ${err.message}`);
    }
  });

  return { rows, format: "format1", errors };
}

/**
 * Parse Format 2: Sem, Br, FacultyN, EnrolN, Name, Semester, Hall, SPI, CPI, etc.
 */
function parseFormat2(data: any[], errors: string[]): { rows: ParsedRow[]; format: string; errors: string[] } {
  const rows: ParsedRow[] = [];

  data.forEach((row, index) => {
    try {
      const semester = row["Sem"]?.toString().trim();
      const faculty_no = row["FacultyN"]?.toString().trim();
      const enrollment_no = row["EnrolN"]?.toString().trim();
      const name = row["Name"]?.toString().trim();
      const current_semester = parseInt(row["Semester"]?.toString().trim() || "0");
      const hall = row["Hall"]?.toString().trim();
      const spi = parseFloat(row["SPI"]?.toString().trim() || "0");
      const cpi = parseFloat(row["CPI"]?.toString().trim() || "0");

      if (!faculty_no || !enrollment_no || !semester) {
        errors.push(`Row ${index + 2}: Missing required fields (FacultyN, EnrolN, or Sem)`);
        return;
      }

      rows.push({
        faculty_no,
        enrollment_no,
        semester,
        current_semester,
        name,
        hall,
        spi,
        cpi,
        courses: [], // Format 2 doesn't have course-grade pairs in same row
      });
    } catch (err: any) {
      errors.push(`Row ${index + 2}: ${err.message}`);
    }
  });

  return { rows, format: "format2", errors };
}

/**
 * Extract academic year and semester type from semester string
 * Example: S21221 -> year: 2021, semester_type: 1
 */
function extractSemesterInfo(semester: string): { academic_year: number; semester_type: number } {
  // Remove 'S' prefix if present
  const semStr = semester.replace(/^S/, "");
  
  // Extract year (first 2 or 4 digits)
  let yearStr = "";
  if (semStr.length >= 5) {
    yearStr = semStr.substring(0, 2);
  }
  
  // Extract semester type (last digit)
  const semester_type = parseInt(semStr.charAt(semStr.length - 1));
  
  // Convert 2-digit year to 4-digit
  const year = parseInt(yearStr);
  const academic_year = year >= 0 && year <= 50 ? 2000 + year : 1900 + year;
  
  return { academic_year, semester_type };
}

/**
 * Extract branch info from faculty number
 * Example: 24COBEA160 -> year: 2024, branch_code: COBEA, roll: 160
 */
function extractFacultyInfo(faculty_no: string): {
  admission_year: number;
  branch_code: string;
  roll_number: string;
} {
  // Extract year (first 2 digits)
  const yearStr = faculty_no.substring(0, 2);
  const admission_year = 2000 + parseInt(yearStr);
  
  // Extract branch code (next 5-6 characters until digits)
  const match = faculty_no.match(/^\d{2}([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid faculty number format: ${faculty_no}`);
  }
  
  const branch_code = match[1];
  const roll_number = match[2];
  
  return { admission_year, branch_code, roll_number };
}

/**
 * Get branch name from branch code
 */
function getBranchName(branch_code: string): string {
  const branchMap: { [key: string]: string } = {
    COBEA: "Computer Engineering",
    ELBEA: "Electronics Engineering",
    EEBEA: "Electrical Engineering",
    MEBEA: "Mechanical Engineering",
    CEBEA: "Civil Engineering",
    CHBEA: "Chemical Engineering",
    AEBEA: "Aerospace Engineering",
    AE: "Aerospace Engineering",
  };
  
  return branchMap[branch_code] || branch_code;
}

/**
 * Process and insert data into database
 */
export async function processAndInsertData(rows: ParsedRow[]): Promise<{
  success: boolean;
  inserted: { students: number; faculty: number; courses: number; grades: number };
  errors: string[];
}> {
  const errors: string[] = [];
  let studentsInserted = 0;
  let facultyInserted = 0;
  let coursesInserted = 0;
  let gradesInserted = 0;

  try {
    for (const row of rows) {
      try {
        // 1. Create or update FacultyNumber
        const facultyInfo = extractFacultyInfo(row.faculty_no);
        const existingFaculty = await prisma.facultyNumber.findUnique({
          where: { faculty_no: row.faculty_no },
        });

        if (!existingFaculty) {
          await prisma.facultyNumber.create({
            data: {
              faculty_no: row.faculty_no,
              admission_year: facultyInfo.admission_year,
              branch_code: facultyInfo.branch_code,
              branch_name: getBranchName(facultyInfo.branch_code),
              roll_number: facultyInfo.roll_number,
              program_type: "B.Tech",
            },
          });
          facultyInserted++;
        }

        // 2. Create or update Student
        const existingStudent = await prisma.student.findUnique({
          where: { enrollment_no: row.enrollment_no },
        });

        if (!existingStudent) {
          await prisma.student.create({
            data: {
              enrollment_no: row.enrollment_no,
              faculty_no: row.faculty_no,
              name: row.name || `Student ${row.enrollment_no}`,
              email: `${row.enrollment_no.toLowerCase()}@myamu.ac.in`,
              password_hash: "", // Inactive until they register
              current_semester: row.current_semester || 1,
              current_cpi: row.cpi || 0.0,
              hall: row.hall || null,
              is_active: false,
            },
          });
          studentsInserted++;
        } else {
          // Update existing student
          await prisma.student.update({
            where: { enrollment_no: row.enrollment_no },
            data: {
              current_semester: row.current_semester || existingStudent.current_semester,
              current_cpi: row.cpi || existingStudent.current_cpi,
              hall: row.hall || existingStudent.hall,
            },
          });
        }

        // 3. Process courses and grades
        const semesterInfo = extractSemesterInfo(row.semester);

        for (const courseGrade of row.courses) {
          // Create course if doesn't exist
          const existingCourse = await prisma.course.findUnique({
            where: { course_code: courseGrade.course_code },
          });

          if (!existingCourse) {
            await prisma.course.create({
              data: {
                course_code: courseGrade.course_code,
                course_name: courseGrade.course_code, // Use code as name for now
                credits: 3, // Default credits
                semester_no: 0, // Unknown, to be updated later
                branch_code: facultyInfo.branch_code,
                is_elective: false,
                course_type: "Theory",
              },
            });
            coursesInserted++;
          }

          // Create grade record
          const grade = courseGrade.grade === "0" ? null : courseGrade.grade;
          const grade_points_value = grade ? (gradePoints[grade] ?? 0.0) : null;

          // Check if grade record already exists
          const existingGrade = await prisma.gradeRecord.findFirst({
            where: {
              enrollment_no: row.enrollment_no,
              course_code: courseGrade.course_code,
              academic_year: semesterInfo.academic_year,
              semester_type: semesterInfo.semester_type,
            },
          });

          if (!existingGrade) {
            await prisma.gradeRecord.create({
              data: {
                enrollment_no: row.enrollment_no,
                faculty_no: row.faculty_no,
                course_code: courseGrade.course_code,
                academic_year: semesterInfo.academic_year,
                semester_type: semesterInfo.semester_type,
                grade: grade,
                grade_points: grade_points_value,
                is_backlog: false,
                is_improvement: false,
              },
            });
            gradesInserted++;
          }
        }
      } catch (err: any) {
        errors.push(`Error processing ${row.enrollment_no}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      inserted: {
        students: studentsInserted,
        faculty: facultyInserted,
        courses: coursesInserted,
        grades: gradesInserted,
      },
      errors,
    };
  } catch (err: any) {
    errors.push(`Database error: ${err.message}`);
    return {
      success: false,
      inserted: { students: 0, faculty: 0, courses: 0, grades: 0 },
      errors,
    };
  } finally {
    await prisma.$disconnect();
  }
}
