// Optimized CSV Upload Service with Bulk Operations + Transaction Batching
// Production-grade implementation for high-performance CSV processing

import { PrismaClient, ElectiveType, Grade } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import Papa from "papaparse";

const prisma = new PrismaClient();

export interface UploadResult {
  success: boolean;
  uploadType: string;
  inserted: { created: number; updated: number; failed: number };
  errors: string[];
  errorCSV?: string;
}

interface ErrorRow {
  rowNumber: number;
  originalData: any;
  errors: string[];
}

export type UploadType = 'students' | 'results' | 'courses';

const BATCH_SIZE = 50; // Optimal batch size for production

// ============================================================================
// OPTIMIZED STUDENT UPLOAD WITH BULK OPERATIONS
// ============================================================================

export async function uploadStudentsOptimized(data: any[]): Promise<UploadResult> {
  const errors: string[] = [];
  const errorRows: ErrorRow[] = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  const batches = [];
  
  // Step 1: Divide into batches
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    batches.push(data.slice(i, i + BATCH_SIZE));
  }

  console.log(`📊 Processing ${data.length} students in ${batches.length} batches of ${BATCH_SIZE}`);

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`);

    try {
      // Step 2: Extract all enrollment numbers from this batch
      const enrollmentNos = batch
        .map(row => row.EnrolN?.toString().trim())
        .filter(Boolean);

      // Step 3: Fetch all grade records for this batch in ONE query
      const allGradeRecords = await prisma.gradeRecord.findMany({
        where: { enrollment_no: { in: enrollmentNos } },
        include: { course: true },
      });

      // Step 4: Group grade records by enrollment number
      const gradeRecordsByStudent = new Map<string, any[]>();
      allGradeRecords.forEach(record => {
        const enrollmentNo = record.enrollment_no;
        if (!gradeRecordsByStudent.has(enrollmentNo)) {
          gradeRecordsByStudent.set(enrollmentNo, []);
        }
        gradeRecordsByStudent.get(enrollmentNo)!.push(record);
      });

      // Step 5: Check existing students in batch
      const existingStudents = await prisma.student.findMany({
        where: { enrollment_no: { in: enrollmentNos } },
        select: { enrollment_no: true }
      });
      const existingEnrollmentNos = new Set(existingStudents.map(s => s.enrollment_no));

      // Step 6: Prepare data for bulk operations
      const studentsToCreate: any[] = [];
      const studentsToUpdate: any[] = [];
      const facultyNumbersToUpsert: any[] = [];
      const batchErrors: ErrorRow[] = [];

      // Process each row in parallel within the batch
      const batchPromises = batch.map(async (row, index) => {
        const rowNumber = batchIndex * BATCH_SIZE + index + 2;

        try {
          const enrollment_no = row.EnrolN?.toString().trim();
          const faculty_no = row.FacultyN?.toString().trim();
          const name = row.Name?.toString().trim();
          const semester_no = parseInt(row.semester_no?.toString().trim() || "0");
          const branch_code = row.Br?.toString().trim();
          const hall = row.Hall?.toString().trim() || null;

          if (!enrollment_no || !faculty_no || !name) {
            throw new Error("Missing required fields: enrollment_no, faculty_no, or name");
          }

          // Step 7: Calculate CPI using pre-fetched data
          const gradeRecords = gradeRecordsByStudent.get(enrollment_no) || [];
          let totalCredits = 0;
          let totalGradePoints = 0;
          const courseCreditsMap = new Map<string, number>();

          gradeRecords.forEach(record => {
            if (record.grade && isPassingGrade(record.grade)) {
              const courseCode = record.course_code;
              const credits = Number(record.course.credits);
              const gradePoints = calculateGradePoints(record.grade);
              
              const currentBest = courseCreditsMap.get(courseCode) || 0;
              if (gradePoints > currentBest) {
                if (courseCreditsMap.has(courseCode)) {
                  totalCredits -= credits;
                  totalGradePoints -= currentBest * credits;
                }
                
                courseCreditsMap.set(courseCode, gradePoints);
                totalCredits += credits;
                totalGradePoints += gradePoints * credits;
              }
            }
          });

          const calculatedCPI = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

          // Prepare faculty number data
          facultyNumbersToUpsert.push({
            faculty_no,
            admission_year: parseInt("20" + faculty_no.substring(0, 2)),
            branch_code: getFullBranchCode(branch_code),
            branch_name: getBranchName(branch_code),
            roll_number: faculty_no.substring(faculty_no.length - 3),
            program_type: "B.Tech",
          });

          // Prepare student data
          const studentData = {
            enrollment_no,
            faculty_no,
            name,
            email: `${enrollment_no.toLowerCase()}@myamu.ac.in`,
            password_hash: "",
            current_semester: semester_no + 1,
            current_cpi: new Decimal(calculatedCPI.toFixed(3)),
            hall,
            is_active: false,
            total_earned_credits: new Decimal(totalCredits.toFixed(1)),
          };

          if (existingEnrollmentNos.has(enrollment_no)) {
            studentsToUpdate.push({
              where: { enrollment_no },
              data: {
                faculty_no,
                name,
                current_semester: semester_no + 1,
                current_cpi: new Decimal(calculatedCPI.toFixed(3)),
                hall,
                total_earned_credits: new Decimal(totalCredits.toFixed(1)),
              }
            });
          } else {
            studentsToCreate.push(studentData);
          }

        } catch (err: any) {
          batchErrors.push({
            rowNumber,
            originalData: row,
            errors: [err.message]
          });
        }
      });

      // Wait for all rows in batch to be processed
      await Promise.all(batchPromises);

      // Step 8: Execute bulk operations in transaction
      await prisma.$transaction(async (tx) => {
        // Bulk upsert faculty numbers
        for (const facultyData of facultyNumbersToUpsert) {
          await tx.facultyNumber.upsert({
            where: { faculty_no: facultyData.faculty_no },
            create: facultyData,
            update: {
              branch_code: facultyData.branch_code,
              branch_name: facultyData.branch_name,
            },
          });
        }

        // Bulk create new students
        if (studentsToCreate.length > 0) {
          await tx.student.createMany({
            data: studentsToCreate,
            skipDuplicates: true,
          });
          created += studentsToCreate.length;
        }

        // Bulk update existing students
        for (const updateData of studentsToUpdate) {
          await tx.student.update(updateData);
        }
        updated += studentsToUpdate.length;
      });

      // Add batch errors to main errors
      batchErrors.forEach(error => {
        failed++;
        errors.push(`Row ${error.rowNumber}: ${error.errors.join(', ')}`);
        errorRows.push(error);
      });

      console.log(`✅ Batch ${batchIndex + 1} completed: ${studentsToCreate.length} created, ${studentsToUpdate.length} updated, ${batchErrors.length} failed`);

    } catch (batchError: any) {
      console.error(`❌ Batch ${batchIndex + 1} failed:`, batchError);
      // Mark entire batch as failed
      batch.forEach((row, index) => {
        const rowNumber = batchIndex * BATCH_SIZE + index + 2;
        failed++;
        errors.push(`Row ${rowNumber}: Batch processing failed - ${batchError.message}`);
        errorRows.push({
          rowNumber,
          originalData: row,
          errors: [`Batch processing failed: ${batchError.message}`]
        });
      });
    }
  }

  console.log(`🎉 Student upload completed: ${created} created, ${updated} updated, ${failed} failed`);

  return {
    success: failed === 0,
    uploadType: "students",
    inserted: { created, updated, failed },
    errors: errors.slice(0, 20),
    errorCSV: errorRows.length > 0 ? generateErrorCSV(errorRows, "students") : undefined,
  };
}

// ============================================================================
// OPTIMIZED COURSE UPLOAD WITH BULK OPERATIONS
// ============================================================================

export async function uploadCoursesOptimized(data: any[]): Promise<UploadResult> {
  const errors: string[] = [];
  const errorRows: ErrorRow[] = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  const batches = [];
  
  // Step 1: Divide into batches
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    batches.push(data.slice(i, i + BATCH_SIZE));
  }

  console.log(`📊 Processing ${data.length} courses in ${batches.length} batches of ${BATCH_SIZE}`);

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`);

    try {
      // Step 2: Extract all course codes from this batch
      const courseCodes = batch
        .map(row => row.course_code?.toString().trim())
        .filter(Boolean);

      // Step 3: Check existing courses in batch
      const existingCourses = await prisma.course.findMany({
        where: { course_code: { in: courseCodes } },
        select: { course_code: true }
      });
      const existingCourseCodes = new Set(existingCourses.map(c => c.course_code));

      // Step 4: Prepare data for bulk operations
      const coursesToCreate: any[] = [];
      const coursesToUpdate: any[] = [];
      const batchErrors: ErrorRow[] = [];

      // Process each row in parallel within the batch
      const batchPromises = batch.map(async (row, index) => {
        const rowNumber = batchIndex * BATCH_SIZE + index + 2;

        try {
          const course_code = row.course_code?.toString().trim();
          const course_name = row.course_name?.toString().trim();
          const credits = parseFloat(row.credits?.toString().trim() || "0");
          const semester_no = parseInt(row.semester_no?.toString().trim() || "0");
          const branch_code = row.branch_code?.toString().trim();
          const is_elective = row.is_elective?.toString().trim().toLowerCase() === "true";
          const is_advanced = row.is_advanced?.toString().trim().toLowerCase() === "true";

          if (!course_code || !course_name) {
            throw new Error("Missing required fields: course_code or course_name");
          }

          const elective_type_str = row.elective_type?.toString().trim().toUpperCase();
          const elective_type = elective_type_str && ["BRANCH", "OPEN"].includes(elective_type_str)
            ? (elective_type_str as ElectiveType)
            : null;
          const elective_group = row.elective_group?.toString().trim() || null;
          const course_type = row.course_type?.toString().trim() || "Theory";
          const max_seats = row.max_seats ? parseInt(row.max_seats.toString().trim()) : null;
          const is_running = row.is_running?.toString().trim().toLowerCase() !== "false";

          const courseData = {
            course_code,
            course_name,
            credits: new Decimal(credits),
            semester_no,
            branch_code,
            is_elective,
            is_advanced,
            elective_type,
            elective_group,
            course_type,
            max_seats,
            is_running,
          };

          if (existingCourseCodes.has(course_code)) {
            coursesToUpdate.push({
              where: { course_code },
              data: {
                course_name,
                credits: new Decimal(credits),
                semester_no,
                branch_code,
                is_elective,
                is_advanced,
                elective_type,
                elective_group,
                course_type,
                max_seats,
                is_running,
              }
            });
          } else {
            coursesToCreate.push(courseData);
          }

        } catch (err: any) {
          batchErrors.push({
            rowNumber,
            originalData: row,
            errors: [err.message]
          });
        }
      });

      // Wait for all rows in batch to be processed
      await Promise.all(batchPromises);

      // Step 5: Execute bulk operations in transaction
      await prisma.$transaction(async (tx) => {
        // Bulk create new courses
        if (coursesToCreate.length > 0) {
          await tx.course.createMany({
            data: coursesToCreate,
            skipDuplicates: true,
          });
          created += coursesToCreate.length;
        }

        // Bulk update existing courses
        for (const updateData of coursesToUpdate) {
          await tx.course.update(updateData);
        }
        updated += coursesToUpdate.length;
      });

      // Add batch errors to main errors
      batchErrors.forEach(error => {
        failed++;
        errors.push(`Row ${error.rowNumber}: ${error.errors.join(', ')}`);
        errorRows.push(error);
      });

      console.log(`✅ Batch ${batchIndex + 1} completed: ${coursesToCreate.length} created, ${coursesToUpdate.length} updated, ${batchErrors.length} failed`);

    } catch (batchError: any) {
      console.error(`❌ Batch ${batchIndex + 1} failed:`, batchError);
      // Mark entire batch as failed
      batch.forEach((row, index) => {
        const rowNumber = batchIndex * BATCH_SIZE + index + 2;
        failed++;
        errors.push(`Row ${rowNumber}: Batch processing failed - ${batchError.message}`);
        errorRows.push({
          rowNumber,
          originalData: row,
          errors: [`Batch processing failed: ${batchError.message}`]
        });
      });
    }
  }

  console.log(`🎉 Course upload completed: ${created} created, ${updated} updated, ${failed} failed`);

  return {
    success: failed === 0,
    uploadType: "courses",
    inserted: { created, updated, failed },
    errors: errors.slice(0, 20),
    errorCSV: errorRows.length > 0 ? generateErrorCSV(errorRows, "courses") : undefined,
  };
}

// ============================================================================
// OPTIMIZED RESULTS UPLOAD WITH BULK OPERATIONS
// ============================================================================

export async function uploadResultsOptimized(data: any[]): Promise<UploadResult> {
  const errors: string[] = [];
  const errorRows: ErrorRow[] = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  const batches = [];
  
  // Step 1: Divide into batches
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    batches.push(data.slice(i, i + BATCH_SIZE));
  }

  console.log(`📊 Processing ${data.length} result records in ${batches.length} batches of ${BATCH_SIZE}`);

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`);

    try {
      // Step 2: Collect all grade records to be processed
      const gradeRecordsToCreate: any[] = [];
      const gradeRecordsToUpdate: any[] = [];
      const batchErrors: ErrorRow[] = [];

      // Step 3: Extract all unique keys for existing record check
      const recordKeys: string[] = [];
      const recordKeyMap = new Map<string, { enrollment_no: string; course_code: string; sem: string }>();

      batch.forEach((row, index) => {
        const rowNumber = batchIndex * BATCH_SIZE + index + 2;
        try {
          const enrollment_no = row.enrollment_no?.toString().trim();
          const sem = row.sem?.toString().trim();
          const no_of_courses = parseInt(row.no_of_courses?.toString().trim() || "0");

          for (let j = 1; j <= no_of_courses; j++) {
            const courseCode = row[`course${j}`]?.toString().trim();
            const gradeStr = row[`grade${j}`]?.toString().trim();

            if (courseCode && gradeStr && enrollment_no && sem) {
              const key = `${enrollment_no}_${courseCode}_${sem}`;
              recordKeys.push(key);
              recordKeyMap.set(key, { enrollment_no, course_code: courseCode, sem });
            }
          }
        } catch (err) {
          // Skip individual row errors for now, will be caught in main processing
        }
      });

      // Step 4: Check existing grade records in batch
      const existingRecords = await prisma.gradeRecord.findMany({
        where: {
          OR: Array.from(recordKeyMap.values()).map(({ enrollment_no, course_code, sem }) => ({
            enrollment_no,
            course_code,
            sem
          }))
        },
        select: { enrollment_no: true, course_code: true, sem: true }
      });

      const existingRecordKeys = new Set(
        existingRecords.map(r => `${r.enrollment_no}_${r.course_code}_${r.sem}`)
      );

      // Step 5: Process each row in parallel within the batch
      const batchPromises = batch.map(async (row, index) => {
        const rowNumber = batchIndex * BATCH_SIZE + index + 2;

        try {
          const faculty_no = row.faculty_no?.toString().trim();
          const enrollment_no = row.enrollment_no?.toString().trim();
          const sem = row.sem?.toString().trim();
          const no_of_courses = parseInt(row.no_of_courses?.toString().trim() || "0");

          if (!enrollment_no || !sem) {
            throw new Error("Missing required fields: enrollment_no or sem");
          }

          // Parse semester info
          const { academic_year, semester_type } = parseSemesterInfo(sem);
          const semester_no = parseInt(sem.charAt(sem.length - 2)) || 1;

          // Process course-grade pairs
          for (let j = 1; j <= no_of_courses; j++) {
            const courseCode = row[`course${j}`]?.toString().trim();
            const gradeStr = row[`grade${j}`]?.toString().trim();

            if (!courseCode || !gradeStr) continue;

            // Convert grade string to enum
            const gradeEnum = stringToGradeEnum(gradeStr);
            if (!gradeEnum) {
              batchErrors.push({
                rowNumber,
                originalData: row,
                errors: [`Invalid grade ${gradeStr} for course ${courseCode}`]
              });
              continue;
            }

            const recordKey = `${enrollment_no}_${courseCode}_${sem}`;
            const gradeRecordData = {
              enrollment_no,
              course_code: courseCode,
              sem,
              semester_no,
              grade: gradeEnum,
            };

            if (existingRecordKeys.has(recordKey)) {
              gradeRecordsToUpdate.push({
                where: {
                  enrollment_no_course_code_sem: {
                    enrollment_no,
                    course_code: courseCode,
                    sem,
                  },
                },
                data: { grade: gradeEnum }
              });
            } else {
              gradeRecordsToCreate.push(gradeRecordData);
            }
          }

        } catch (err: any) {
          batchErrors.push({
            rowNumber,
            originalData: row,
            errors: [err.message]
          });
        }
      });

      // Wait for all rows in batch to be processed
      await Promise.all(batchPromises);

      // Step 6: Execute bulk operations in transaction
      await prisma.$transaction(async (tx) => {
        // Bulk create new grade records
        if (gradeRecordsToCreate.length > 0) {
          await tx.gradeRecord.createMany({
            data: gradeRecordsToCreate,
            skipDuplicates: true,
          });
          created += gradeRecordsToCreate.length;
        }

        // Bulk update existing grade records
        for (const updateData of gradeRecordsToUpdate) {
          await tx.gradeRecord.update(updateData);
        }
        updated += gradeRecordsToUpdate.length;
      });

      // Add batch errors to main errors
      batchErrors.forEach(error => {
        failed++;
        errors.push(`Row ${error.rowNumber}: ${error.errors.join(', ')}`);
        errorRows.push(error);
      });

      console.log(`✅ Batch ${batchIndex + 1} completed: ${gradeRecordsToCreate.length} created, ${gradeRecordsToUpdate.length} updated, ${batchErrors.length} failed`);

    } catch (batchError: any) {
      console.error(`❌ Batch ${batchIndex + 1} failed:`, batchError);
      // Mark entire batch as failed
      batch.forEach((row, index) => {
        const rowNumber = batchIndex * BATCH_SIZE + index + 2;
        failed++;
        errors.push(`Row ${rowNumber}: Batch processing failed - ${batchError.message}`);
        errorRows.push({
          rowNumber,
          originalData: row,
          errors: [`Batch processing failed: ${batchError.message}`]
        });
      });
    }
  }

  console.log(`🎉 Results upload completed: ${created} created, ${updated} updated, ${failed} failed`);

  return {
    success: failed === 0,
    uploadType: "results",
    inserted: { created, updated, failed },
    errors: errors.slice(0, 20),
    errorCSV: errorRows.length > 0 ? generateErrorCSV(errorRows, "results") : undefined,
  };
}

// ============================================================================
// HELPER FUNCTIONS (Import from existing service)
// ============================================================================

function isPassingGrade(grade: Grade): boolean {
  return !['F', 'I', 'E'].includes(grade);
}

function calculateGradePoints(grade: Grade): number {
  const gradePoints: Record<Grade, number> = {
    'A_PLUS': 10, 'A': 9, 'B_PLUS': 8, 'B': 7, 'C': 5, 'D': 4, 'E': 0,
    'F': 0, 'I': 0
  };
  return gradePoints[grade] || 0;
}

function getFullBranchCode(shortCode: string): string {
  const branchMap: Record<string, string> = {
    'CE': 'CIVIL', 'ME': 'MECH', 'EE': 'ELEC', 'ECE': 'ECE', 'CSE': 'CSE',
    'CHE': 'CHEM', 'BT': 'BT', 'AM': 'AM', 'PE': 'PE', 'IT': 'IT'
  };
  return branchMap[shortCode] || shortCode;
}

function getBranchName(shortCode: string): string {
  const branchNames: Record<string, string> = {
    'CE': 'Civil Engineering', 'ME': 'Mechanical Engineering', 
    'EE': 'Electrical Engineering', 'ECE': 'Electronics & Communication Engineering',
    'CSE': 'Computer Science & Engineering', 'CHE': 'Chemical Engineering',
    'BT': 'Biotechnology', 'AM': 'Applied Mathematics', 'PE': 'Petroleum Engineering',
    'IT': 'Information Technology'
  };
  return branchNames[shortCode] || shortCode;
}

function parseSemesterInfo(sem: string): { academic_year: string; semester_type: string } {
  // Parse semester format like "2023-24-1" or "2023-24-2"
  const parts = sem.split('-');
  if (parts.length >= 3) {
    const year1 = parts[0];
    const year2 = parts[1];
    const semesterNum = parts[2];
    return {
      academic_year: `${year1}-${year2}`,
      semester_type: semesterNum === '1' ? 'ODD' : 'EVEN'
    };
  }
  return { academic_year: sem, semester_type: 'ODD' };
}

function stringToGradeEnum(gradeStr: string): Grade | null {
  const gradeMap: Record<string, Grade> = {
    'A+': 'A_PLUS', 'A': 'A', 'B+': 'B_PLUS', 'B': 'B', 'C': 'C',
    'D': 'D', 'E': 'E', 'F': 'F', 'I': 'I'
  };
  return gradeMap[gradeStr.toUpperCase()] || null;
}

function generateErrorCSV(errorRows: ErrorRow[], uploadType: UploadType): string {
  if (errorRows.length === 0) return '';
  
  // Generate CSV with error information
  const headers = Object.keys(errorRows[0].originalData).concat(['Error_Messages']);
  const csvRows = errorRows.map(row => {
    const values = Object.values(row.originalData).concat([row.errors.join('; ')]);
    return values.map(v => `"${v}"`).join(',');
  });
  
  return [headers.join(','), ...csvRows].join('\n');
}