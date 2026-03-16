import { PrismaClient, Grade, ElectiveType } from "@prisma/client";
import Papa from "papaparse";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

export type UploadType = "students" | "results" | "courses";

interface PreviewRow {
  rowNumber: number;
  identifier: string;
  action: "CREATE" | "UPDATE" | "ERROR" | "UNCHANGED";
  data: any;
  errors: string[];
}

interface PreviewResult {
  uploadType: UploadType;
  totalRows: number;
  summary: {
    create: number;
    update: number;
    error: number;
    unchanged: number;
  };
  preview: PreviewRow[];
  errors: string[];
}

interface UploadResult {
  success: boolean;
  uploadType: UploadType;
  inserted: {
    created: number;
    updated: number;
    failed: number;
  };
  errors: string[];
  errorCSV?: string;
}

interface ErrorRow {
  rowNumber: number;
  originalData: any;
  errors: string[];
}

/**
 * Detect if CSV has headers
 */
function detectHeader(csvContent: string, uploadType: UploadType): boolean {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return false;
  
  const firstLine = lines[0].toLowerCase();
  
  // Check for common header patterns
  const headerPatterns = {
    students: ['sem', 'br', 'facultyn', 'enroln', 'name', 'semester_no'],
    results: ['faculty_no', 'enrollment_no', 'sem', 'no_of_courses'],
    courses: ['course_code', 'course_name', 'credits', 'semester_no']
  };
  
  const patterns = headerPatterns[uploadType];
  return patterns.some(pattern => firstLine.includes(pattern));
}

/**
 * Preview CSV data before upload
 */
export async function previewCSVByType(
  csvContent: string,
  uploadType: UploadType,
  fileSize?: number,
  fileName?: string
): Promise<PreviewResult> {
  try {
    const hasHeader = detectHeader(csvContent, uploadType);
    
    const parseResult = Papa.parse(csvContent, {
      header: hasHeader,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      return {
        uploadType,
        totalRows: 0,
        summary: { create: 0, update: 0, error: 1, unchanged: 0 },
        preview: [],
        errors: parseResult.errors.map(e => e.message),
      };
    }

    const data = parseResult.data as any[];
    
    // Add default headers if no header detected
    if (!hasHeader) {
      const headers = getDefaultHeaders(uploadType, data[0]?.length);
      const dataWithHeaders = data.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
      return await previewByType(dataWithHeaders, uploadType);
    }

    return await previewByType(data, uploadType);
  } catch (error: any) {
    return {
      uploadType,
      totalRows: 0,
      summary: { create: 0, update: 0, error: 1, unchanged: 0 },
      preview: [],
      errors: [error.message],
    };
  }
}

function getDefaultHeaders(uploadType: UploadType, columnCount?: number): string[] {
  const headers: { [key: string]: string[] } = {
    students: ['Sem', 'Br', 'FacultyN', 'EnrolN', 'Name', 'semester_no', 'SPI', 'CPI', 'credit_earned', 'Hall', 'Remark'],
    results: ['faculty_no', 'enrollment_no', 'sem', 'no_of_courses'],
    courses: ['course_code', 'course_name', 'credits', 'semester_no', 'branch_code', 'is_elective', 'is_advanced', 'elective_type', 'elective_group', 'course_type', 'max_seats', 'is_running'],
  };
  
  // For results, add dynamic course-grade pairs
  if (uploadType === 'results' && columnCount) {
    const baseHeaders = headers.results;
    const dynamicCount = columnCount - 4;
    const pairs = Math.floor(dynamicCount / 2);
    
    for (let i = 1; i <= pairs; i++) {
      baseHeaders.push(`course${i}`);
      baseHeaders.push(`grade${i}`);
    }
    
    return baseHeaders;
  }
  
  return headers[uploadType] || [];
}

async function previewByType(data: any[], uploadType: UploadType): Promise<PreviewResult> {
  switch (uploadType) {
    case 'students':
      return await previewStudents(data);
    case 'results':
      return await previewResults(data);
    case 'courses':
      return await previewCourses(data);
    default:
      throw new Error(`Unknown upload type: ${uploadType}`);
  }
}

async function previewStudents(data: any[]): Promise<PreviewResult> {
  const preview: PreviewRow[] = [];
  const errors: string[] = [];
  const summary = { create: 0, update: 0, error: 0, unchanged: 0 };

  try {
    const enrollmentNos = data
      .map(row => row.EnrolN?.toString().trim())
      .filter(Boolean);
    
    const existingStudents = await prisma.student.findMany({
      where: { enrollment_no: { in: enrollmentNos } },
      select: { enrollment_no: true },
    });
    
    const existingStudentsSet = new Set(existingStudents.map(s => s.enrollment_no));

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      const rowErrors: string[] = [];

      try {
        const enrollment_no = row.EnrolN?.toString().trim();
        const faculty_no = row.FacultyN?.toString().trim();
        const name = row.Name?.toString().trim();
        const semester_no = parseInt(row.semester_no?.toString().trim() || "0");
        const branch_code = row.Br?.toString().trim();
        
        // Optional fields
        const spi = row.SPI ? parseFloat(row.SPI.toString().trim()) : null;
        const cpi = row.CPI ? parseFloat(row.CPI.toString().trim()) : null;
        const credit_earned = row.credit_earned ? parseFloat(row.credit_earned.toString().trim()) : null;
        const hall = row.Hall?.toString().trim() || null;
        const remark = row.Remark?.toString().trim() || null;

        if (!enrollment_no) rowErrors.push("Missing enrollment number");
        if (!faculty_no) rowErrors.push("Missing faculty number");
        if (!name) rowErrors.push("Missing name");
        if (!semester_no || semester_no < 1 || semester_no > 8) rowErrors.push("Invalid semester_no (1-8)");
        if (!branch_code) rowErrors.push("Missing branch code");

        if (rowErrors.length > 0) {
          preview.push({
            rowNumber,
            identifier: enrollment_no || "UNKNOWN",
            action: "ERROR",
            data: row,
            errors: rowErrors,
          });
          summary.error++;
          continue;
        }

        const action = existingStudentsSet.has(enrollment_no) ? "UPDATE" : "CREATE";
        if (action === "CREATE") summary.create++;
        else summary.update++;

        preview.push({
          rowNumber,
          identifier: enrollment_no,
          action,
          data: {
            enrollment_no,
            faculty_no,
            name,
            semester_no,
            branch_code,
            spi,
            cpi,
            credit_earned,
            hall,
            remark,
          },
          errors: [],
        });
      } catch (err: any) {
        rowErrors.push(err.message);
        preview.push({
          rowNumber,
          identifier: row.EnrolN || "UNKNOWN",
          action: "ERROR",
          data: row,
          errors: rowErrors,
        });
        summary.error++;
      }
    }
  } catch (err: any) {
    errors.push(`Database error: ${err.message}`);
  }

  return {
    uploadType: "students",
    totalRows: data.length,
    summary,
    preview: preview, // Return all rows, frontend will handle pagination
    errors,
  };
}

async function previewResults(data: any[]): Promise<PreviewResult> {
  const preview: PreviewRow[] = [];
  const errors: string[] = [];
  const summary = { create: 0, update: 0, error: 0, unchanged: 0 };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2;
    const rowErrors: string[] = [];

    try {
      const faculty_no = row.faculty_no?.toString().trim();
      const enrollment_no = row.enrollment_no?.toString().trim();
      const sem = row.sem?.toString().trim();
      const no_of_courses = parseInt(row.no_of_courses?.toString().trim() || "0");

      if (!faculty_no) rowErrors.push("Missing faculty_no");
      if (!enrollment_no) rowErrors.push("Missing enrollment_no");
      if (!sem) rowErrors.push("Missing sem");
      if (isNaN(no_of_courses) || no_of_courses < 0) rowErrors.push("Invalid no_of_courses");

      if (rowErrors.length > 0) {
        preview.push({
          rowNumber,
          identifier: enrollment_no || "UNKNOWN",
          action: "ERROR",
          data: row,
          errors: rowErrors,
        });
        summary.error++;
        continue;
      }

      // Count grade records that will be created
      summary.create += no_of_courses;

      preview.push({
        rowNumber,
        identifier: enrollment_no,
        action: "CREATE",
        data: { faculty_no, enrollment_no, sem, no_of_courses },
        errors: [],
      });
    } catch (err: any) {
      rowErrors.push(err.message);
      preview.push({
        rowNumber,
        identifier: row.enrollment_no || "UNKNOWN",
        action: "ERROR",
        data: row,
        errors: rowErrors,
      });
      summary.error++;
    }
  }

  return {
    uploadType: "results",
    totalRows: data.length,
    summary,
    preview: preview, // Return all rows, frontend will handle pagination
    errors,
  };
}

async function previewCourses(data: any[]): Promise<PreviewResult> {
  const preview: PreviewRow[] = [];
  const errors: string[] = [];
  const summary = { create: 0, update: 0, error: 0, unchanged: 0 };

  try {
    const courseCodes = data
      .map(row => row.course_code?.toString().trim())
      .filter(Boolean);
    
    const existingCourses = await prisma.course.findMany({
      where: { course_code: { in: courseCodes } },
      select: { course_code: true },
    });
    
    const existingCoursesSet = new Set(existingCourses.map(c => c.course_code));

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      const rowErrors: string[] = [];

      try {
        const course_code = row.course_code?.toString().trim();
        const course_name = row.course_name?.toString().trim();
        const credits = parseFloat(row.credits?.toString().trim() || "0");
        const semester_no = parseInt(row.semester_no?.toString().trim() || "0");
        const branch_code = row.branch_code?.toString().trim();
        const is_elective = row.is_elective?.toString().trim().toLowerCase() === "true";
        const is_advanced = row.is_advanced?.toString().trim().toLowerCase() === "true";

        if (!course_code) rowErrors.push("Missing course code");
        if (!course_name) rowErrors.push("Missing course name");
        if (!credits || credits <= 0) rowErrors.push("Invalid credits");
        if (!semester_no || semester_no < 1 || semester_no > 8) rowErrors.push("Invalid semester (1-8)");
        if (!branch_code) rowErrors.push("Missing branch code");

        if (rowErrors.length > 0) {
          preview.push({
            rowNumber,
            identifier: course_code || "UNKNOWN",
            action: "ERROR",
            data: row,
            errors: rowErrors,
          });
          summary.error++;
          continue;
        }

        const action = existingCoursesSet.has(course_code) ? "UPDATE" : "CREATE";
        if (action === "CREATE") summary.create++;
        else summary.update++;

        preview.push({
          rowNumber,
          identifier: course_code,
          action,
          data: {
            course_code,
            course_name,
            credits,
            semester_no,
            branch_code,
            is_elective,
            is_advanced,
          },
          errors: [],
        });
      } catch (err: any) {
        rowErrors.push(err.message);
        preview.push({
          rowNumber,
          identifier: row.course_code || "UNKNOWN",
          action: "ERROR",
          data: row,
          errors: rowErrors,
        });
        summary.error++;
      }
    }
  } catch (err: any) {
    errors.push(`Database error: ${err.message}`);
  }

  return {
    uploadType: "courses",
    totalRows: data.length,
    summary,
    preview: preview, // Return all rows, frontend will handle pagination
    errors,
  };
}

/**
 * Process CSV upload
 */
export async function processCSVUpload(
  csvContent: string,
  uploadType: UploadType,
  fileSize?: number,
  fileName?: string,
  uploadedBy?: string
): Promise<UploadResult> {
  try {
    const hasHeader = detectHeader(csvContent, uploadType);
    
    const parseResult = Papa.parse(csvContent, {
      header: hasHeader,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        uploadType,
        inserted: { created: 0, updated: 0, failed: 1 },
        errors: parseResult.errors.map(e => e.message),
      };
    }

    const data = parseResult.data as any[];
    
    if (!hasHeader) {
      const headers = getDefaultHeaders(uploadType, data[0]?.length);
      const dataWithHeaders = data.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
      return await uploadByType(dataWithHeaders, uploadType);
    }

    return await uploadByType(data, uploadType);
  } catch (error: any) {
    return {
      success: false,
      uploadType,
      inserted: { created: 0, updated: 0, failed: 1 },
      errors: [error.message],
    };
  }
}

async function uploadByType(data: any[], uploadType: UploadType): Promise<UploadResult> {
  switch (uploadType) {
    case 'students':
      return await uploadStudents(data);
    case 'results':
      return await uploadResults(data);
    case 'courses':
      return await uploadCourses(data);
    default:
      throw new Error(`Unknown upload type: ${uploadType}`);
  }
}

async function uploadStudents(data: any[]): Promise<UploadResult> {
  const errors: string[] = [];
  const errorRows: ErrorRow[] = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  const BATCH_SIZE = 50;
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
          
          // Optional fields
          const spi = row.SPI ? parseFloat(row.SPI.toString().trim()) : null;
          const cpi = row.CPI ? parseFloat(row.CPI.toString().trim()) : null;
          const credit_earned = row.credit_earned ? parseFloat(row.credit_earned.toString().trim()) : null;
          const remark = row.Remark?.toString().trim() || null;

          if (!enrollment_no || !faculty_no || !name) {
            throw new Error("Missing required fields: enrollment_no, faculty_no, or name");
          }

          // Step 7: Calculate CPI using pre-fetched data (only if not provided in CSV)
          const gradeRecords = gradeRecordsByStudent.get(enrollment_no) || [];
          let totalCredits = credit_earned !== null ? credit_earned : 0;
          let totalGradePoints = 0;
          const courseCreditsMap = new Map<string, number>();
          
          // Only calculate if CPI not provided in CSV
          let calculatedCPI = cpi !== null ? cpi : 0;
          
          if (cpi === null) {
            totalCredits = 0; // Reset if calculating
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

            calculatedCPI = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
          }

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
            current_spi: spi !== null ? new Decimal(spi.toFixed(3)) : new Decimal(0),
            current_cpi: new Decimal(calculatedCPI.toFixed(3)),
            hall,
            remark,
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
                current_spi: spi !== null ? new Decimal(spi.toFixed(3)) : new Decimal(0),
                current_cpi: new Decimal(calculatedCPI.toFixed(3)),
                hall,
                remark,
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

      // Step 8: Handle faculty numbers first (outside transaction for speed)
      if (facultyNumbersToUpsert.length > 0) {
        // Use createMany with skipDuplicates for bulk insert
        try {
          await prisma.facultyNumber.createMany({
            data: facultyNumbersToUpsert,
            skipDuplicates: true,
          });
        } catch (error) {
          // If bulk insert fails, fall back to individual upserts
          console.log(`⚠️ Bulk faculty insert failed, using individual upserts...`);
          for (const facultyData of facultyNumbersToUpsert) {
            try {
              await prisma.facultyNumber.upsert({
                where: { faculty_no: facultyData.faculty_no },
                create: facultyData,
                update: {
                  branch_code: facultyData.branch_code,
                  branch_name: facultyData.branch_name,
                },
              });
            } catch (err) {
              // Ignore individual faculty number errors
              console.log(`⚠️ Faculty number ${facultyData.faculty_no} already exists`);
            }
          }
        }
      }

      // Step 9: Execute student operations in optimized transaction
      await prisma.$transaction(async (tx) => {
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
      }, {
        timeout: 30000, // 30 second timeout
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



async function uploadResults(data: any[]): Promise<UploadResult> {
  const errors: string[] = [];
  const errorRows: ErrorRow[] = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  const BATCH_SIZE = 50;
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
      }, {
        timeout: 30000, // 30 second timeout
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

async function uploadCourses(data: any[]): Promise<UploadResult> {
  const errors: string[] = [];
  const errorRows: ErrorRow[] = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  const BATCH_SIZE = 50;
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
      }, {
        timeout: 30000, // 30 second timeout
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



// Helper functions
function getBranchName(branch_code: string): string {
  const branchMap: { [key: string]: string } = {
    CE: "Computer Engineering",
    EE: "Electronics Engineering",
    ME: "Mechanical Engineering",
    CI: "Civil Engineering",
    CH: "Chemical Engineering",
    AR: "Architecture",
  };
  return branchMap[branch_code] || branch_code;
}

function getFullBranchCode(short_code: string): string {
  const branchCodeMap: { [key: string]: string } = {
    CE: "COBEA",
    EE: "EEBEA", 
    ME: "MEBEA",
    CI: "CIBEA",
    CH: "CHBEA",
    AR: "ARBEA",
  };
  return branchCodeMap[short_code] || short_code;
}

function parseSemesterInfo(sem: string): { academic_year: number; semester_type: number } {
  const semStr = sem.replace(/^S/, "");
  const yearStr = semStr.substring(0, 2);
  const semester_type = parseInt(semStr.charAt(semStr.length - 1));
  const year = parseInt(yearStr);
  const academic_year = year >= 0 && year <= 50 ? 2000 + year : 1900 + year;
  return { academic_year, semester_type };
}

function calculateGradePoints(grade: Grade): number {
  const gradePointsMap: { [key: string]: number } = {
    A_PLUS: 10.0,
    A: 9.0,
    B_PLUS: 8.0,
    B: 7.0,
    C: 6.0,
    D: 5.0,
    E: 4.0,
    F: 0.0,
    I: 0.0,
  };
  return gradePointsMap[grade] ?? 0.0;
}

function isPassingGrade(grade: Grade): boolean {
  return !['E', 'F', 'I'].includes(grade);
}

function stringToGradeEnum(gradeStr: string): Grade | null {
  const gradeMap: { [key: string]: Grade } = {
    'A+': 'A_PLUS',
    'A': 'A',
    'B+': 'B_PLUS',
    'B': 'B',
    'C': 'C',
    'D': 'D',
    'E': 'E',
    'F': 'F',
    'I': 'I',
  };
  return gradeMap[gradeStr] || null;
}

function generateErrorCSV(errorRows: ErrorRow[], uploadType: UploadType): string {
  if (errorRows.length === 0) return '';
  
  const headers = getDefaultHeaders(uploadType);
  headers.push('ERRORS');
  
  const csvRows = [headers.join(',')];
  
  errorRows.forEach(errorRow => {
    const row = errorRow.originalData;
    const values = headers.slice(0, -1).map(header => {
      const value = row[header] || '';
      return `"${value.toString().replace(/"/g, '""')}"`;
    });
    values.push(`"${errorRow.errors.join('; ').replace(/"/g, '""')}"`);
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}