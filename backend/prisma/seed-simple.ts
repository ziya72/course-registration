import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with PRANJAL YADAV only...");

  // Faculty Number
  console.log("📚 Creating faculty number...");
  await prisma.facultyNumber.create({
    data: {
      faculty_no: "24ELBEA168",
      admission_year: 2024,
      branch_code: "ELBEA",
      branch_name: "Electronics Engineering",
      roll_number: "168",
      program_type: "B.Tech"
    },
  });

  // Student
  console.log("👨‍🎓 Creating student...");
  const pranjalPassword = await bcrypt.hash("azx", 10);
  await prisma.student.create({
    data: {
      enrollment_no: "gm7605",
      faculty_no: "24ELBEA168",
      name: "PRANJAL YADAV",
      email: "gm7605@myamu.ac.in",
      password_hash: pranjalPassword,
      current_semester: 3,
      current_cpi: 9.5,
      is_active: true,
      hall: "SU"
    },
  });

  // Teachers
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
  });

  // Courses - Semester 1 & 2 (common), Semester 3 ELBEA
  console.log("📖 Creating courses...");
  await prisma.course.createMany({
    data: [
      // Semester 1
      { course_code: "AMS1121", course_name: "Applied Mathematics-I", credits: 4, semester_no: 1, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "APS1111", course_name: "Applied Physics-I", credits: 3.5, semester_no: 1, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "APS1911", course_name: "Applied Physics Lab-I", credits: 1.5, semester_no: 1, branch_code: "COBEA", is_elective: false, course_type: "Lab" },
      { course_code: "EZH1111", course_name: "English-I", credits: 2, semester_no: 1, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "MEA1121", course_name: "Engineering Mechanics", credits: 3, semester_no: 1, branch_code: "COBEA", is_elective: true, elective_group: "ELEC-1", course_type: "Theory" },
      { course_code: "COA1112", course_name: "Programming Fundamentals", credits: 4, semester_no: 1, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      
      // Semester 2
      { course_code: "AMS1122", course_name: "Applied Mathematics-II", credits: 4, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "APS1112", course_name: "Applied Physics-II", credits: 3.5, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "APS1912", course_name: "Applied Physics Lab-II", credits: 1.5, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Lab" },
      { course_code: "ELA1112", course_name: "Principles of Electronics Engineering", credits: 3, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "EZH1112", course_name: "English-II", credits: 2, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Theory" },
      { course_code: "EZH1912", course_name: "Communication Skills Lab", credits: 1.5, semester_no: 2, branch_code: "COBEA", is_elective: false, course_type: "Lab" },
      { course_code: "MEA1122", course_name: "Engineering Workshop", credits: 2, semester_no: 2, branch_code: "COBEA", is_elective: true, elective_group: "ELEC-2", course_type: "Lab" },
      
      // Semester 3 - Electronics Engineering (ELBEA)
      { course_code: "ELA2331", course_name: "Electronic Circuits", credits: 4, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
      { course_code: "ELA2332", course_name: "Signals and Systems", credits: 3.5, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
      { course_code: "ELA2931", course_name: "Electronics Lab", credits: 2, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Lab" },
      { course_code: "AMS2331", course_name: "Engineering Mathematics-III", credits: 3, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
      { course_code: "ELA2333", course_name: "Digital Electronics", credits: 3, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
      { course_code: "HUA2331", course_name: "Technical Writing", credits: 2, semester_no: 3, branch_code: "ELBEA", is_elective: true, elective_group: "ELEC-EL3", course_type: "Theory" },
    ],
  });

  // Elective Groups
  console.log("📋 Creating elective groups...");
  await prisma.electiveGroup.createMany({
    data: [
      { group_code: "ELEC-EL3", group_name: "Semester 3 Electives", branch_code: "ELBEA", semester_no: 3, min_selection: 1, max_selection: 1 },
    ],
  });

  // Registration Rules
  console.log("⚙️ Creating registration rules...");
  await prisma.registrationRule.createMany({
    data: [
      { rule_name: "MAX_CREDITS", rule_type: "credit_limit", rule_value: "40", is_active: true },
      { rule_name: "MIN_CPI", rule_type: "cpi_requirement", rule_value: "5.0", is_active: true },
      // Deadline rules - Set to 30 days from now for registration, 15 days for modification
      { rule_name: "REGISTRATION_DEADLINE", rule_type: "deadline", rule_value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), is_active: true },
      { rule_name: "MODIFICATION_DEADLINE", rule_type: "deadline", rule_value: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), is_active: true },
    ],
  });

  // Grade Records for gm7605 - Semester 1 & 2
  console.log("📊 Creating grade records...");
  await prisma.gradeRecord.createMany({
    data: [
      // Semester 1
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "AMS1121", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1111", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1911", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EZH1111", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "MEA1121", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "COA1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      
      // Semester 2
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "AMS1122", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1912", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "ELA1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EZH1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EZH1912", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "MEA1122", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
    ],
  });

  // Semester Results
  console.log("📈 Creating semester results...");
  await prisma.semesterResult.createMany({
    data: [
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
  });

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Summary:");
  console.log("   - 1 Faculty Number (ELBEA)");
  console.log("   - 1 Student (PRANJAL YADAV - gm7605)");
  console.log("   - 5 Teachers (2 admins, 3 teachers)");
  console.log("   - 19 Courses (Semester 1, 2, 3 ELBEA)");
  console.log("   - 1 Elective Group");
  console.log("   - 4 Registration Rules (including deadlines)");
  console.log("   - 13 Grade Records (Semester 1 & 2 for gm7605)");
  console.log("   - 2 Semester Results (Semester 1 & 2 for gm7605)");
  console.log("   - 0 Course Registrations (gm7605 has NOT registered for semester 3 yet)");
  console.log("\n🔑 Test Credentials:");
  console.log("\n   👑 Admins:");
  console.log("      • sharma@amu.ac.in / Teacher@123");
  console.log("      • anjali.singh@amu.ac.in / Teacher@123");
  console.log("\n   👨‍🏫 Teachers:");
  console.log("      • khan@amu.ac.in / Teacher@123");
  console.log("      • rajesh.kumar@amu.ac.in / Teacher@123");
  console.log("      • priya.verma@amu.ac.in / Teacher@123");
  console.log("\n   🎓 Student:");
  console.log("      • gm7605@myamu.ac.in / azx (PRANJAL YADAV - Semester 3, CPI 9.5, ELBEA, Hall: SU)");
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
