import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with Pranjal, Vipan, Dr. Sharma and sample courses...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Clearing existing data...");
  await prisma.courseAttempt.deleteMany();
  await prisma.courseRegistration.deleteMany();
  await prisma.gradeRecord.deleteMany();
  await prisma.semesterResult.deleteMany();
  await prisma.coursePrerequisite.deleteMany();
  await prisma.electiveGroup.deleteMany();
  await prisma.registrationRule.deleteMany();
  await prisma.registrationPhase.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.facultyNumber.deleteMany();

  /* ============================================================================
     FACULTY NUMBERS (BRANCH CODES)
     ============================================================================ */
  console.log("📚 Creating faculty numbers...");
  await prisma.facultyNumber.createMany({
    data: [
      // Pranjal - Electronics Engineering 2024
      { 
        faculty_no: "24ELBEA168", 
        admission_year: 2024, 
        branch_code: "ELBEA", 
        branch_name: "Electronics Engineering", 
        roll_number: "168", 
        program_type: "B.Tech" 
      },
      // Vipan - Computer Engineering 2023
      { 
        faculty_no: "23COBEA205", 
        admission_year: 2023, 
        branch_code: "COBEA", 
        branch_name: "Computer Engineering", 
        roll_number: "205", 
        program_type: "B.Tech" 
      },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     STUDENTS
     ============================================================================ */
  console.log("👨‍🎓 Creating students...");
  const studentPassword = await bcrypt.hash("azx", 10);

  await prisma.student.createMany({
    data: [
      // PRANJAL YADAV - Semester 3, Electronics Engineering
      { 
        enrollment_no: "gm7605", 
        faculty_no: "24ELBEA168", 
        name: "PRANJAL YADAV", 
        email: "gm7605@myamu.ac.in", 
        password_hash: studentPassword, 
        current_semester: 3, 
        current_cpi: 9.5, 
        is_active: true, 
        hall: "SU",
        total_earned_credits: 35,
        required_credits_for_degree: 160
      },
      // VIPAN - Semester 4, Computer Engineering
      { 
        enrollment_no: "gs3456", 
        faculty_no: "23COBEA205", 
        name: "VIPAN", 
        email: "gs3456@myamu.ac.in", 
        password_hash: studentPassword, 
        current_semester: 4, 
        current_cpi: 8.7, 
        is_active: true, 
        hall: "Morrison Court",
        total_earned_credits: 52,
        required_credits_for_degree: 160
      },
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
      { 
        name: "Dr. Sharma", 
        email: "sharma@amu.ac.in", 
        password_hash: teacherPassword, 
        role: "admin", 
        department: "Computer Engineering", 
        is_active: true 
      },
      { 
        name: "Prof. Khan", 
        email: "khan@amu.ac.in", 
        password_hash: teacherPassword, 
        role: "teacher", 
        department: "Electronics Engineering", 
        is_active: true 
      },
      { 
        name: "Dr. Anjali Singh", 
        email: "anjali.singh@amu.ac.in", 
        password_hash: teacherPassword, 
        role: "teacher", 
        department: "Mathematics", 
        is_active: true 
      },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     COURSES - Sample courses for different semesters and branches
     ============================================================================ */
  console.log("📖 Creating courses...");
  await prisma.course.createMany({
    data: [
      // Semester 1 Courses (Common for all branches)
      { 
        course_code: "AMS1121", 
        course_name: "Applied Mathematics-I", 
        credits: 4, 
        semester_no: 1, 
        branch_code: "COMMON", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 120,
        is_running: true
      },
      { 
        course_code: "APS1111", 
        course_name: "Applied Physics-I", 
        credits: 3, 
        semester_no: 1, 
        branch_code: "COMMON", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 120,
        is_running: true
      },
      { 
        course_code: "APS1911", 
        course_name: "Applied Physics Lab-I", 
        credits: 2, 
        semester_no: 1, 
        branch_code: "COMMON", 
        is_elective: false, 
        course_type: "Lab",
        max_seats: 60,
        is_running: true
      },
      { 
        course_code: "EZH1111", 
        course_name: "English-I", 
        credits: 2, 
        semester_no: 1, 
        branch_code: "COMMON", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 120,
        is_running: true
      },
      { 
        course_code: "COA1112", 
        course_name: "Programming Fundamentals", 
        credits: 4, 
        semester_no: 1, 
        branch_code: "COMMON", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 120,
        is_running: true
      },

      // Semester 2 Courses (Common for all branches)
      { 
        course_code: "AMS1122", 
        course_name: "Applied Mathematics-II", 
        credits: 4, 
        semester_no: 2, 
        branch_code: "COMMON", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 120,
        is_running: true
      },
      { 
        course_code: "APS1112", 
        course_name: "Applied Physics-II", 
        credits: 3, 
        semester_no: 2, 
        branch_code: "COMMON", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 120,
        is_running: true
      },
      { 
        course_code: "ELA1112", 
        course_name: "Principles of Electronics Engineering", 
        credits: 3, 
        semester_no: 2, 
        branch_code: "COMMON", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 120,
        is_running: true
      },
      { 
        course_code: "EZH1112", 
        course_name: "English-II", 
        credits: 2, 
        semester_no: 2, 
        branch_code: "COMMON", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 120,
        is_running: true
      },

      // Semester 3 Courses - Electronics Engineering (for Pranjal)
      { 
        course_code: "ELA2331", 
        course_name: "Electronic Circuits", 
        credits: 4, 
        semester_no: 3, 
        branch_code: "ELBEA", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 60,
        is_running: true
      },
      { 
        course_code: "ELA2332", 
        course_name: "Signals and Systems", 
        credits: 3, 
        semester_no: 3, 
        branch_code: "ELBEA", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 60,
        is_running: true
      },
      { 
        course_code: "ELA2931", 
        course_name: "Electronics Lab", 
        credits: 2, 
        semester_no: 3, 
        branch_code: "ELBEA", 
        is_elective: false, 
        course_type: "Lab",
        max_seats: 30,
        is_running: true
      },
      { 
        course_code: "AMS2331", 
        course_name: "Engineering Mathematics-III", 
        credits: 3, 
        semester_no: 3, 
        branch_code: "ELBEA", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 60,
        is_running: true
      },
      { 
        course_code: "ELA2333", 
        course_name: "Digital Electronics", 
        credits: 3, 
        semester_no: 3, 
        branch_code: "ELBEA", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 60,
        is_running: true
      },

      // Semester 3 Courses - Computer Engineering
      { 
        course_code: "COA2131", 
        course_name: "Data Structures", 
        credits: 4, 
        semester_no: 3, 
        branch_code: "COBEA", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 60,
        is_running: true
      },
      { 
        course_code: "COA2132", 
        course_name: "Digital Logic Design", 
        credits: 3, 
        semester_no: 3, 
        branch_code: "COBEA", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 60,
        is_running: true
      },
      { 
        course_code: "COA2931", 
        course_name: "Data Structures Lab", 
        credits: 2, 
        semester_no: 3, 
        branch_code: "COBEA", 
        is_elective: false, 
        course_type: "Lab",
        max_seats: 30,
        is_running: true
      },

      // Semester 4 Courses - Computer Engineering (for Vipan)
      { 
        course_code: "COA2141", 
        course_name: "Algorithms", 
        credits: 4, 
        semester_no: 4, 
        branch_code: "COBEA", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 60,
        is_running: true
      },
      { 
        course_code: "COA2142", 
        course_name: "Database Management Systems", 
        credits: 4, 
        semester_no: 4, 
        branch_code: "COBEA", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 60,
        is_running: true
      },
      { 
        course_code: "COA2143", 
        course_name: "Operating Systems", 
        credits: 3, 
        semester_no: 4, 
        branch_code: "COBEA", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 60,
        is_running: true
      },
      { 
        course_code: "COA2941", 
        course_name: "Algorithms Lab", 
        credits: 2, 
        semester_no: 4, 
        branch_code: "COBEA", 
        is_elective: false, 
        course_type: "Lab",
        max_seats: 30,
        is_running: true
      },
      { 
        course_code: "AMS2141", 
        course_name: "Probability and Statistics", 
        credits: 3, 
        semester_no: 4, 
        branch_code: "COBEA", 
        is_elective: false, 
        course_type: "Theory",
        max_seats: 60,
        is_running: true
      },

      // Elective Courses
      { 
        course_code: "COA2144", 
        course_name: "Computer Networks", 
        credits: 3, 
        semester_no: 4, 
        branch_code: "COBEA", 
        is_elective: true, 
        elective_group: "ELEC-4",
        course_type: "Theory",
        max_seats: 40,
        is_running: true
      },
      { 
        course_code: "COA2145", 
        course_name: "Web Technologies", 
        credits: 3, 
        semester_no: 4, 
        branch_code: "COBEA", 
        is_elective: true, 
        elective_group: "ELEC-4",
        course_type: "Theory",
        max_seats: 40,
        is_running: true
      },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     PREREQUISITES
     ============================================================================ */
  console.log("🔗 Creating prerequisites...");
  await prisma.coursePrerequisite.createMany({
    data: [
      { course_code: "AMS1122", prerequisite_course_code: "AMS1121", min_grade: "D" },
      { course_code: "COA2131", prerequisite_course_code: "COA1112", min_grade: "D" },
      { course_code: "COA2141", prerequisite_course_code: "COA2131", min_grade: "C" },
      { course_code: "COA2142", prerequisite_course_code: "COA2131", min_grade: "D" },
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     ELECTIVE GROUPS
     ============================================================================ */
  console.log("📋 Creating elective groups...");
  await prisma.electiveGroup.createMany({
    data: [
      { 
        group_code: "ELEC-4", 
        group_name: "Semester 4 Electives", 
        branch_code: "COBEA", 
        semester_no: 4, 
        min_selection: 1, 
        max_selection: 2 
      },
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
     REGISTRATION PHASES - Current semester setup
     ============================================================================ */
  console.log("📅 Creating registration phases...");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const semesterType = currentMonth >= 7 ? 1 : 2; // 1 = Fall, 2 = Spring

  await prisma.registrationPhase.createMany({
    data: [
      {
        phase_name: "REGULAR",
        phase_label: "Regular Registration",
        academic_year: currentYear,
        semester_type: semesterType,
        start_date: new Date(currentYear, currentMonth - 1, 1), // Start of current month
        end_date: new Date(currentYear, currentMonth - 1, 15), // 15 days from start
        is_active: true,
        is_enabled: true,
      },
    ],
    skipDuplicates: true,
  });
  /* ============================================================================
     GRADE RECORDS - Academic history for students
     ============================================================================ */
  console.log("📊 Creating grade records...");
  
  // PRANJAL'S ACADEMIC HISTORY (Semester 1 & 2 completed)
  await prisma.gradeRecord.createMany({
    data: [
      // Semester 1 (Fall 2024)
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "AMS1121", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1111", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1911", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EZH1111", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "COA1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      
      // Semester 2 (Spring 2025)
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "AMS1122", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "ELA1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EZH1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
    ],
    skipDuplicates: true,
  });

  // VIPAN'S ACADEMIC HISTORY (Semesters 1, 2, 3 completed)
  await prisma.gradeRecord.createMany({
    data: [
      // Semester 1 (Fall 2023)
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "AMS1121", grade: "A", grade_points: 9.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "APS1111", grade: "B+", grade_points: 8.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "APS1911", grade: "A", grade_points: 9.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "EZH1111", grade: "B+", grade_points: 8.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "COA1112", grade: "A", grade_points: 9.0, academic_year: 2023, semester_type: 1, is_backlog: false, is_improvement: false },
      
      // Semester 2 (Spring 2024)
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "AMS1122", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "APS1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "ELA1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "EZH1112", grade: "B+", grade_points: 8.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      
      // Semester 3 (Fall 2024) - Some courses passed, one failed (for backlog testing)
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "COA2131", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "COA2132", grade: "B+", grade_points: 8.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gs3456", faculty_no: "23COBEA205", course_code: "COA2931", grade: "F", grade_points: 0.0, academic_year: 2024, semester_type: 1, is_backlog: true, is_improvement: false }, // Failed - creates backlog
    ],
    skipDuplicates: true,
  });

  /* ============================================================================
     SEMESTER RESULTS
     ============================================================================ */
  console.log("📈 Creating semester results...");
  await prisma.semesterResult.createMany({
    data: [
      // Pranjal's results
      { 
        enrollment_no: "gm7605", 
        faculty_no: "24ELBEA168",
        semester_no: 1, 
        academic_year: 2024, 
        semester_type: 1, 
        branch_code: "ELBEA",
        name: "PRANJAL YADAV",
        spi: 9.6, 
        cpi: 9.6,
        total_credits_earned: 17,
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
        spi: 9.4, 
        cpi: 9.5,
        total_credits_earned: 18,
        is_result_declared: true,
        result_status: "Pass"
      },
      
      // Vipan's results
      { 
        enrollment_no: "gs3456", 
        faculty_no: "23COBEA205",
        semester_no: 1, 
        academic_year: 2023, 
        semester_type: 1, 
        branch_code: "COBEA",
        name: "VIPAN",
        spi: 8.6, 
        cpi: 8.6,
        total_credits_earned: 17,
        is_result_declared: true,
        result_status: "Pass"
      },
      { 
        enrollment_no: "gs3456", 
        faculty_no: "23COBEA205",
        semester_no: 2, 
        academic_year: 2024, 
        semester_type: 2, 
        branch_code: "COBEA",
        name: "VIPAN",
        spi: 8.8, 
        cpi: 8.7,
        total_credits_earned: 16,
        is_result_declared: true,
        result_status: "Pass"
      },
      { 
        enrollment_no: "gs3456", 
        faculty_no: "23COBEA205",
        semester_no: 3, 
        academic_year: 2024, 
        semester_type: 1, 
        branch_code: "COBEA",
        name: "VIPAN",
        spi: 7.0, 
        cpi: 8.1,
        total_credits_earned: 7, // Only 2 courses passed out of 3
        is_result_declared: true,
        result_status: "Pass with Backlog"
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Database seeded successfully!");
  console.log("📋 Summary:");
  console.log("   👨‍🎓 Students: Pranjal (gm7605), Vipan (gs3456)");
  console.log("   👨‍🏫 Admin: Dr. Sharma (sharma@amu.ac.in)");
  console.log("   📚 Courses: Multiple semesters with prerequisites");
  console.log("   📊 Academic History: Complete grade records");
  console.log("   🔄 Registration Phase: Currently active");
  console.log("");
  console.log("🔑 Login Credentials:");
  console.log("   Students: password = 'azx'");
  console.log("   Teachers: password = 'Teacher@123'");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });