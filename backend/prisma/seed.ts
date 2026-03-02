import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

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
};

async function main() {
  console.log("🌱 Seeding database with correct format...");

  /* ============================================================================
     FACULTY NUMBERS (BRANCH)
     Format: [YY][BRANCH_CODE][SERIAL_NO]
     Example: 24ELBEA168 = 2024, Electronics Engineering, Serial 168
     ============================================================================ */
  console.log("📚 Creating faculty numbers...");
  await prisma.facultyNumber.createMany({
    data: [
      // Electronics Engineering - 2024
      { faculty_no: "24ELBEA168", admission_year: 2024, branch_code: "ELBEA", branch_name: "Electronics Engineering", roll_number: "168", program_type: "B.Tech" },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     STUDENTS
     - Enrollment No: gm7605 (unique, never changes)
     - Email: gm7605@myamu.ac.in
     - Faculty No: 24ELBEA168 (can change if branch changes)
     - Active: true if registered, false if not
     ============================================================================ */
  console.log("👨‍🎓 Creating students...");
  const pranjalPassword = await bcrypt.hash("azx", 10);

  await prisma.student.createMany({
    data: [
      // PRANJAL YADAV - Active student, Semester 3, ELBEA
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", name: "PRANJAL YADAV", email: "gm7605@myamu.ac.in", password_hash: pranjalPassword, current_semester: 3, current_cpi: 9.5, is_active: true, hall: "SU" },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     TEACHERS
     ============================================================================ */
  console.log("👨‍🏫 Creating teachers...");
  const teacherPassword = await bcrypt.hash("Teacher@123", 10);

  await prisma.teacher.createMany({
    data: [
      { name: "Dr. Sharma", email: "sharma@amu.ac.in", password_hash: teacherPassword, role: "admin", department: "Computer Engineering", is_active: true },
      { name: "Prof. Khan", email: "khan@amu.ac.in", password_hash: teacherPassword, role: "teacher", department: "Electronics Engineering", is_active: true },
      { name: "Dr. Anjali Singh", email: "anjali.singh@amu.ac.in", password_hash: teacherPassword, role: "admin", department: "Electrical Engineering", is_active: true },
      { name: "Prof. Rajesh Kumar", email: "rajesh.kumar@amu.ac.in", password_hash: teacherPassword, role: "teacher", department: "Mathematics", is_active: true },
      { name: "Dr. Priya Verma", email: "priya.verma@amu.ac.in", password_hash: teacherPassword, role: "teacher", department: "Physics", is_active: true },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     COURSES
     Format: Course codes like AMS1122, APS1112, ELA1112, etc.
     Credits: 1.5 to 4 in multiples of 0.5
     5-6 courses per semester
     ============================================================================ */
  console.log("📖 Creating courses...");
  await prisma.course.createMany({
    data: [
      // Semester 1 Courses
      { course_code: "AMS1121", course_name: "Applied Mathematics-I", credits: 4, semester_no: 1, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "APS1111", course_name: "Applied Physics-I", credits: 3.5, semester_no: 1, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "APS1911", course_name: "Applied Physics Lab-I", credits: 1.5, semester_no: 1, branch_code: "COBEA", is_elective: false, course_type: "Lab" },
      { course_code: "EZH1111", course_name: "English-I", credits: 2, semester_no: 1, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "MEA1121", course_name: "Engineering Mechanics", credits: 3, semester_no: 1, branch_code: "COBEA", is_elective: true, elective_group: "ELEC-1", course_type: "Theory" },
      { course_code: "COA1112", course_name: "Programming Fundamentals", credits: 4, semester_no: 1, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      
      // Semester 2 Courses
      { course_code: "AMS1122", course_name: "Applied Mathematics-II", credits: 4, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "APS1112", course_name: "Applied Physics-II", credits: 3.5, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "APS1912", course_name: "Applied Physics Lab-II", credits: 1.5, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Lab" },
      { course_code: "ELA1112", course_name: "Principles of Electronics Engineering", credits: 3, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "EZH1112", course_name: "English-II", credits: 2, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "EZH1912", course_name: "Communication Skills Lab", credits: 1.5, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Lab" },
      { course_code: "MEA1122", course_name: "Engineering Workshop", credits: 2, semester_no: 2, branch_code: "COBEA", is_elective: true, elective_group: "ELEC-2", course_type: "Lab" },
      
      // Semester 3 Courses - Computer Engineering
      { course_code: "COA2131", course_name: "Data Structures", credits: 4, semester_no: 3, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "COA2132", course_name: "Digital Logic Design", credits: 3.5, semester_no: 3, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "COA2931", course_name: "Data Structures Lab", credits: 2, semester_no: 3, branch_code: "COBEA", is_elective: false, course_type: "Lab" },
      { course_code: "AMS2131", course_name: "Discrete Mathematics", credits: 3, semester_no: 3, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "ELA2131", course_name: "Computer Organization", credits: 3, semester_no: 3, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "HUA2131", course_name: "Technical Communication", credits: 2, semester_no: 3, branch_code: "COBEA", is_elective: true, elective_group: "ELEC-3", course_type: "Theory" },
      
      // Semester 3 Courses - Electronics Engineering
      { course_code: "ELA2331", course_name: "Electronic Circuits", credits: 4, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
      { course_code: "ELA2332", course_name: "Signals and Systems", credits: 3.5, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
      { course_code: "ELA2931", course_name: "Electronics Lab", credits: 2, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Lab" },
      { course_code: "AMS2331", course_name: "Engineering Mathematics-III", credits: 3, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
      { course_code: "ELA2333", course_name: "Digital Electronics", credits: 3, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
      { course_code: "HUA2331", course_name: "Technical Writing", credits: 2, semester_no: 3, branch_code: "ELBEA", is_elective: true, elective_group: "ELEC-EL3", course_type: "Theory" },
      
      // Semester 4 Courses - Computer Engineering
      { course_code: "COA2141", course_name: "Algorithms", credits: 4, semester_no: 4, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "COA2142", course_name: "Database Management Systems", credits: 3.5, semester_no: 4, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "COA2941", course_name: "Algorithms Lab", credits: 2, semester_no: 4, branch_code: "COBEA", is_elective: false, course_type: "Lab" },
      { course_code: "COA2143", course_name: "Operating Systems", credits: 3, semester_no: 4, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "AMS2141", course_name: "Probability and Statistics", credits: 3, semester_no: 4, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "COA2144", course_name: "Computer Networks", credits: 3, semester_no: 4, branch_code: "COBEA", is_elective: true, elective_group: "ELEC-4", course_type: "Theory" },
      
      // Semester 4 Courses - Electrical Engineering
      { course_code: "EEA2441", course_name: "Power Systems-I", credits: 4, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
      { course_code: "EEA2442", course_name: "Electrical Machines-I", credits: 3.5, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
      { course_code: "EEA2941", course_name: "Electrical Machines Lab", credits: 2, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Lab" },
      { course_code: "EEA2443", course_name: "Control Systems", credits: 3, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
      { course_code: "AMS2441", course_name: "Numerical Methods", credits: 3, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
      { course_code: "EEA2444", course_name: "Power Electronics", credits: 3, semester_no: 4, branch_code: "EEBEA", is_elective: true, elective_group: "ELEC-EE4", course_type: "Theory" },
      
      // Semester 5 Courses
      { course_code: "COA3151", course_name: "Software Engineering", credits: 3.5, semester_no: 5, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "COA3152", course_name: "Theory of Computation", credits: 3, semester_no: 5, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "COA3153", course_name: "Compiler Design", credits: 3.5, semester_no: 5, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "COA3951", course_name: "Software Engineering Lab", credits: 2, semester_no: 5, branch_code: "COBEA", is_elective: false, course_type: "Lab" },
      { course_code: "COA3154", course_name: "Artificial Intelligence", credits: 3, semester_no: 5, branch_code: "COBEA", is_elective: true, elective_group: "ELEC-5", course_type: "Theory" },
      { course_code: "COA3155", course_name: "Machine Learning", credits: 3, semester_no: 5, branch_code: "COBEA", is_elective: true, elective_group: "ELEC-5", course_type: "Theory" },
      
      // Semester 6 Courses
      { course_code: "COA3161", course_name: "Web Technologies", credits: 3.5, semester_no: 6, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "COA3162", course_name: "Computer Graphics", credits: 3, semester_no: 6, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "COA3961", course_name: "Web Technologies Lab", credits: 2, semester_no: 6, branch_code: "COBEA", is_elective: false, course_type: "Lab" },
      { course_code: "COA3163", course_name: "Cloud Computing", credits: 3, semester_no: 6, branch_code: "COBEA", is_elective: true, elective_group: "ELEC-6", course_type: "Theory" },
      { course_code: "COA3164", course_name: "Cyber Security", credits: 3, semester_no: 6, branch_code: "COBEA", is_elective: true, elective_group: "ELEC-6", course_type: "Theory" },
      { course_code: "HUA3161", course_name: "Professional Ethics", credits: 2, semester_no: 6, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     PREREQUISITES
     ============================================================================ */
  console.log("🔗 Creating prerequisites...");
  await prisma.coursePrerequisite.createMany({
    data: [
      { course_code: "AMS1122", prerequisite_course_code: "AMS1121", min_grade: "5.0" },
      { course_code: "COA2131", prerequisite_course_code: "COA1112", min_grade: "5.0" },
      { course_code: "COA2141", prerequisite_course_code: "COA2131", min_grade: "6.0" },
      { course_code: "COA2142", prerequisite_course_code: "COA2131", min_grade: "5.0" },
      { course_code: "COA3151", prerequisite_course_code: "COA2141", min_grade: "6.0" },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     ELECTIVE GROUPS
     ============================================================================ */
  console.log("📋 Creating elective groups...");
  await prisma.electiveGroup.createMany({
    data: [
      { group_code: "ELEC-1", group_name: "Semester 1 Electives", branch_code: "COBEA", semester_no: 1, min_selection: 1, max_selection: 1 },
      { group_code: "ELEC-2", group_name: "Semester 2 Electives", branch_code: "COBEA", semester_no: 2, min_selection: 1, max_selection: 1 },
      { group_code: "ELEC-3", group_name: "Semester 3 Electives", branch_code: "COBEA", semester_no: 3, min_selection: 1, max_selection: 1 },
      { group_code: "ELEC-4", group_name: "Semester 4 Electives", branch_code: "COBEA", semester_no: 4, min_selection: 1, max_selection: 1 },
      { group_code: "ELEC-5", group_name: "Semester 5 Electives", branch_code: "COBEA", semester_no: 5, min_selection: 1, max_selection: 2 },
      { group_code: "ELEC-6", group_name: "Semester 6 Electives", branch_code: "COBEA", semester_no: 6, min_selection: 1, max_selection: 2 },
      { group_code: "ELEC-EL3", group_name: "Semester 3 Electives", branch_code: "ELBEA", semester_no: 3, min_selection: 1, max_selection: 1 },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     REGISTRATION RULES
     ============================================================================ */
  console.log("⚙️ Creating registration rules...");
  await prisma.registrationRule.createMany({
    data: [
      { rule_name: "MAX_CREDITS", rule_type: "credit_limit", rule_value: "40", is_active: true },
      { rule_name: "MIN_CPI", rule_type: "cpi_requirement", rule_value: "5.0", is_active: true },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     GRADE RECORDS (Course History)
     Complete history for 3 active students
     Grade Format: A+, A, B+, B, C, D, F
     ============================================================================ */
  console.log("📊 Creating grade records...");
  
  // STUDENT 1: gm7605 (Semester 3, CPI 9.5) - 2 semesters of history
  await prisma.gradeRecord.createMany({
    data: [
      // Semester 1 (Fall 2024) - Academic year 2024-25
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "AMS1121", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1111", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1911", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EZH1111", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "MEA1121", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "COA1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      
      // Semester 2 (Spring 2025) - Academic year 2024-25
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "AMS1122", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1912", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "ELA1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EZH1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EZH1912", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "MEA1122", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     SEMESTER RESULTS
     ============================================================================ */
  console.log("📈 Creating semester results...");
  await prisma.semesterResult.createMany({
    data: [
      // gm7605 - Semester 1 & 2
      { 
        enrollment_no: "gm7605", 
        faculty_no: "24ELBEA168",
        semester_no: 1, 
        academic_year: 2024, 
        semester_type: 1, 
        branch_code: "ELBEA",
        name: "PRANJAL YADAV",
        spi: 9.634, 
        cpi: 9.634,
        total_credits_earned: 18,
        is_result_declared: true,
        result_status: "Pass"
      },
      { 
        enrollment_no: "gm7605", 
        faculty_no: "24ELBEA168",
        semester_no: 2, 
        academic_year: 2024, 
        semester_type: 2, 
        branch_code: "ELBEA",
        name: "PRANJAL YADAV",
        spi: 9.378, 
        cpi: 9.5,
        total_credits_earned: 17,
        is_result_declared: true,
        result_status: "Pass"
      },
    ],
    skipDuplicates: true,
  });

  // STUDENT 2: gs3456 (Semester 4, CPI 9.0) - 3 semesters of history
  await prisma.gradeRecord.createMany({
    data: [
      // Semester 1 (Fall 2023)
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "AMS1121", grade: "A", grade_points: 9.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "APS1111", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "APS1911", grade: "A", grade_points: 9.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "EZH1111", grade: "B+", grade_points: 8.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "MEA1121", grade: "A", grade_points: 9.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "COA1112", grade: "A", grade_points: 9.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      
      // Semester 2 (Spring 2024)
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "AMS1122", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "APS1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "APS1912", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "ELA1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "EZH1112", grade: "B+", grade_points: 8.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "EZH1912", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "MEA1122", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      
      // Semester 3 (Fall 2024)
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "COA2131", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "COA2132", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "COA2931", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "AMS2131", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "ELA2131", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23EEBEA803", course_code: "HUA2131", grade: "B+", grade_points: 8.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
    ],
    skipDuplicates: true,
  });

  // STUDENT 3: gt7890 (Semester 6, CPI 9.9) - 5 semesters of history
  await prisma.gradeRecord.createMany({
    data: [
      // Semester 1 (Fall 2022)
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "AMS1121", grade: "A+", grade_points: 10.0, academic_year: 2022, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "APS1111", grade: "A+", grade_points: 10.0, academic_year: 2022, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "APS1911", grade: "A+", grade_points: 10.0, academic_year: 2022, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "EZH1111", grade: "A", grade_points: 9.0, academic_year: 2022, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "MEA1121", grade: "A+", grade_points: 10.0, academic_year: 2022, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA1112", grade: "A+", grade_points: 10.0, academic_year: 2022, semester_type: 1, is_backlog: false, is_improvement: false },
      
      // Semester 2 (Spring 2023)
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "AMS1122", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "APS1112", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "APS1912", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "ELA1112", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "EZH1112", grade: "A", grade_points: 9.0, academic_year: 2023, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "EZH1912", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "MEA1122", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 2, is_backlog: false, is_improvement: false },
      
      // Semester 3 (Fall 2023)
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA2131", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA2132", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA2931", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "AMS2131", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "ELA2131", grade: "A+", grade_points: 10.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "HUA2131", grade: "A", grade_points: 9.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      
      // Semester 4 (Spring 2024)
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA2141", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA2142", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA2941", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA2143", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "AMS2141", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA2144", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      
      // Semester 5 (Fall 2024)
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA3151", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA3152", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA3153", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA3951", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA3154", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gt7890", faculty_no: "22COBEA205", course_code: "COA3155", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     COURSE REGISTRATIONS (Some pending for testing)
     ============================================================================ */
  console.log("📝 Creating course registrations...");
  await prisma.courseRegistration.createMany({
    data: [
      // Pending registrations for semester 3 student
      { enrollment_no: "gm7605", course_code: "COA2131", academic_year: 2024, semester_type: 1, registration_type: "regular", is_approved: false },
      { enrollment_no: "gm7605", course_code: "COA2132", academic_year: 2024, semester_type: 1, registration_type: "regular", is_approved: false },
      
      // Approved registrations for semester 4 student
      { enrollment_no: "gs3456", course_code: "COA2141", academic_year: 2024, semester_type: 2, registration_type: "regular", is_approved: true },
      { enrollment_no: "gs3456", course_code: "COA2142", academic_year: 2024, semester_type: 2, registration_type: "regular", is_approved: true },
    ],
    skipDuplicates: true,
  });

  console.log("\n✅ Database seeded successfully with correct format!");
  console.log("\n📋 Summary:");
  console.log("   - 5 Faculty Numbers (COBEA, ELBEA, EEBEA)");
  console.log("   - 5 Students (2 inactive, 3 active)");
  console.log("   - 5 Teachers (2 admins, 3 teachers)");
  console.log("   - 36 Courses (Semesters 1-6)");
  console.log("   - 5 Prerequisites");
  console.log("   - 6 Elective Groups");
  console.log("   - 2 Registration Rules");
  console.log("   - 68 Grade Records (Complete history for 3 students)");
  console.log("   - 4 Course Registrations (2 pending, 2 approved)");
  console.log("\n🔑 Test Credentials:");
  console.log("\n   👑 Admins:");
  console.log("      • sharma@amu.ac.in / Teacher@123");
  console.log("      • anjali.singh@amu.ac.in / Teacher@123");
  console.log("\n   👨‍🏫 Teachers:");
  console.log("      • khan@amu.ac.in / Teacher@123");
  console.log("      • rajesh.kumar@amu.ac.in / Teacher@123");
  console.log("      • priya.verma@amu.ac.in / Teacher@123");
  console.log("\n   🎓 Students (Active):");
  console.log("      • gm7605@myamu.ac.in / azx (PRANJAL YADAV - Semester 3, CPI 9.5, ELBEA)");
  console.log("      • gs3456@myamu.ac.in / Student@123 (Semester 4, CPI 9.0)");
  console.log("      • gt7890@myamu.ac.in / Student@123 (Semester 6, CPI 9.9)");
  console.log("\n   🎓 Students (Inactive - Not Registered):");
  console.log("      • gq5012@myamu.ac.in (Semester 1, CPI 0)");
  console.log("      • gp1212@myamu.ac.in (Semester 1, CPI 0)");
  console.log("\n🎯 Ready for testing!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
