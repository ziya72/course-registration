import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with VIPAN KUMAR (3 semesters with reattempts)...");

  // Clean existing data for VIPAN KUMAR
  console.log("🧹 Cleaning existing data for gq5012...");
  await prisma.gradeRecord.deleteMany({ where: { enrollment_no: "gq5012" } });
  await prisma.semesterResult.deleteMany({ where: { enrollment_no: "gq5012" } });
  await prisma.courseRegistration.deleteMany({ where: { enrollment_no: "gq5012" } });
  await prisma.student.deleteMany({ where: { enrollment_no: "gq5012" } });
  await prisma.facultyNumber.deleteMany({ where: { faculty_no: "24EEBEA201" } });

  // Faculty Number
  console.log("📚 Creating faculty number...");
  await prisma.facultyNumber.create({
    data: {
      faculty_no: "24EEBEA201",
      admission_year: 2024,
      branch_code: "EEBEA",
      branch_name: "Electrical Engineering",
      roll_number: "201",
      program_type: "B.Tech"
    },
  });

  // Student
  console.log("👨‍🎓 Creating student VIPAN KUMAR...");
  const vipanPassword = await bcrypt.hash("azx", 10);
  await prisma.student.create({
    data: {
      enrollment_no: "gq5012",
      faculty_no: "24EEBEA201",
      name: "VIPAN KUMAR",
      email: "gq5012@myamu.ac.in",
      password_hash: vipanPassword,
      current_semester: 4,
      current_cpi: 5.602, // Average of 3 SPIs: (2.533 + 9.634 + 4.639) / 3
      is_active: true,
      hall: "SU"
    },
  });

  // Create all required courses (Semester 1, 2, and 3)
  console.log("📖 Creating courses for all semesters...");
  const allCourses = [
    // Semester 1 courses
    { course_code: "AMS1121", course_name: "Applied Mathematics-I", credits: 4, semester_no: 1, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "AMS1112", course_name: "Applied Mathematics-I (Group B)", credits: 4, semester_no: 1, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "APS1111", course_name: "Applied Physics-I", credits: 3.5, semester_no: 1, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "APS1911", course_name: "Applied Physics Lab-I", credits: 1.5, semester_no: 1, branch_code: "EEBEA", is_elective: false, course_type: "Lab" },
    { course_code: "EZH1111", course_name: "English-I", credits: 2, semester_no: 1, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "MEA1121", course_name: "Engineering Mechanics", credits: 3, semester_no: 1, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "COA1112", course_name: "Programming Fundamentals", credits: 4, semester_no: 1, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "ELA1112", course_name: "Principles of Electronics Engineering", credits: 3, semester_no: 1, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    
    // Semester 2 courses
    { course_code: "ACS1112", course_name: "Applied Chemistry", credits: 3.5, semester_no: 2, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "ACS1912", course_name: "Applied Chemistry Lab", credits: 1.5, semester_no: 2, branch_code: "EEBEA", is_elective: false, course_type: "Lab" },
    { course_code: "AMS1122", course_name: "Applied Mathematics-II", credits: 4, semester_no: 2, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "CEU1112", course_name: "Environmental Studies", credits: 2, semester_no: 2, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "COA1912", course_name: "Computer Programming Lab", credits: 2, semester_no: 2, branch_code: "EEBEA", is_elective: false, course_type: "Lab" },
    { course_code: "EEA1112", course_name: "Principles of Electrical Engineering", credits: 3, semester_no: 2, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "MEA1112", course_name: "Thermal Sciences", credits: 3, semester_no: 2, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "MEA1912", course_name: "Engineering Graphics Lab", credits: 2, semester_no: 2, branch_code: "EEBEA", is_elective: false, course_type: "Lab" },
    
    // Semester 3 courses (Electrical Engineering)
    { course_code: "AMS2232", course_name: "Higher Mathematics", credits: 4, semester_no: 3, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "APS2052", course_name: "Electrical Engineering Materials", credits: 3, semester_no: 3, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EEC2112", course_name: "Electrical Machines-I", credits: 4, semester_no: 3, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EEC2712", course_name: "Circuit Theory", credits: 4, semester_no: 3, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EEC2722", course_name: "Electromagnetic Field Theory", credits: 3.5, semester_no: 3, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EEC2732", course_name: "Signals & Systems", credits: 3, semester_no: 3, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EEC2912", course_name: "Electrical Machines Lab I", credits: 2, semester_no: 3, branch_code: "EEBEA", is_elective: false, course_type: "Lab" },
    { course_code: "EEU201X", course_name: "Ethics in Engineering Practice", credits: 2, semester_no: 3, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
  ];

  for (const course of allCourses) {
    await prisma.course.upsert({
      where: { course_code: course.course_code },
      update: {},
      create: course,
    });
  }

  // Grade Records - Semester 1 (VIPAN's result - SPI 2.533)
  console.log("📊 Creating Semester 1 grade records (with 2 failures)...");
  await prisma.gradeRecord.createMany({
    data: [
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "AMS1121", grade: "E", grade_points: 4.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "APS1111", grade: "D", grade_points: 5.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "APS1911", grade: "D", grade_points: 5.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "EZH1111", grade: "C", grade_points: 6.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "MEA1121", grade: "D", grade_points: 5.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "COA1112", grade: "D", grade_points: 5.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "AMS1112", grade: "E", grade_points: 4.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false }, // FAILED
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "ELA1112", grade: "E", grade_points: 4.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false }, // FAILED
    ],
  });

  // Grade Records - Semester 2 (Using PRANJAL's 1st sem result with Sem 2 course codes)
  // Mapping: AMS1112→AMS1122, ACS1112→Chemistry course, etc.
  console.log("📊 Creating Semester 2 grade records (using PRANJAL's 1st sem result)...");
  await prisma.gradeRecord.createMany({
    data: [
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "ACS1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false }, // Applied Chemistry
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "ACS1912", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false }, // Applied Chemistry Lab
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "AMS1122", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false }, // Applied Mathematics-II (was AMS1112)
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "CEU1112", grade: "B+", grade_points: 8.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false }, // Environmental Studies
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "COA1912", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false }, // Computer Programming Lab
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "EEA1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false }, // Principles of Electrical Engineering
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "MEA1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false }, // Thermal Sciences
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "MEA1912", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false }, // Engineering Graphics Lab
    ],
  });

  // Grade Records - Semester 3 (VIPAN's result - SPI 4.639 with BACKLOG reattempts)
  console.log("📊 Creating Semester 3 grade records (with 2 BACKLOG reattempts)...");
  await prisma.gradeRecord.createMany({
    data: [
      // Regular Semester 3 courses
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "AMS2232", grade: "D", grade_points: 5.0, academic_year: 2025, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "APS2052", grade: "D", grade_points: 5.0, academic_year: 2025, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "EEC2112", grade: "D", grade_points: 5.0, academic_year: 2025, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "EEC2712", grade: "D", grade_points: 5.0, academic_year: 2025, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "EEC2722", grade: "D", grade_points: 5.0, academic_year: 2025, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "EEC2732", grade: "D", grade_points: 5.0, academic_year: 2025, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "EEC2912", grade: "D", grade_points: 5.0, academic_year: 2025, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "EEU201X", grade: "D", grade_points: 5.0, academic_year: 2025, semester_type: 1, is_backlog: false, is_improvement: false },
      // BACKLOG reattempts (failed in Sem 1, passed in Sem 3)
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "AMS1112", grade: "D", grade_points: 5.0, academic_year: 2025, semester_type: 1, is_backlog: true, is_improvement: false },
      { enrollment_no: "gq5012", faculty_no: "24EEBEA201", course_code: "ELA1112", grade: "D", grade_points: 5.0, academic_year: 2025, semester_type: 1, is_backlog: true, is_improvement: false },
    ],
  });

  // Semester Results
  console.log("📈 Creating semester results...");
  await prisma.semesterResult.createMany({
    data: [
      { 
        enrollment_no: "gq5012", 
        faculty_no: "24EEBEA201",
        semester_no: 1, 
        academic_year: 2024, 
        semester_type: 1, 
        branch_code: "EEBEA",
        name: "VIPAN KUMAR",
        spi: 2.533, 
        cpi: 2.533,
        total_credits_earned: 14, // Only passed courses (E grades don't count)
        is_result_declared: true,
        result_status: "Pass with Backlog"
      },
      { 
        enrollment_no: "gq5012", 
        faculty_no: "24EEBEA201",
        semester_no: 2, 
        academic_year: 2024, 
        semester_type: 2, 
        branch_code: "EEBEA",
        name: "VIPAN KUMAR",
        spi: 9.634, 
        cpi: 6.084, // (2.533 + 9.634) / 2
        total_credits_earned: 21,
        is_result_declared: true,
        result_status: "Pass"
      },
      { 
        enrollment_no: "gq5012", 
        faculty_no: "24EEBEA201",
        semester_no: 3, 
        academic_year: 2025, 
        semester_type: 1, 
        branch_code: "EEBEA",
        name: "VIPAN KUMAR",
        spi: 4.639, 
        cpi: 5.602, // (2.533 + 9.634 + 4.639) / 3
        total_credits_earned: 25.5, // 8 regular courses + 2 backlog courses
        is_result_declared: true,
        result_status: "Pass"
      },
    ],
  });

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Summary:");
  console.log("   - 1 Faculty Number (24EEBEA201 - EEBEA)");
  console.log("   - 1 Student (VIPAN KUMAR - gq5012)");
  console.log("   - 24 Courses (Semester 1, 2, 3 EEBEA)");
  console.log("   - 26 Grade Records:");
  console.log("     • Semester 1: 8 courses (2 failed: AMS1112, ELA1112)");
  console.log("     • Semester 2: 8 courses (using PRANJAL's 1st sem result with Sem 2 course codes)");
  console.log("     • Semester 3: 10 courses (8 regular + 2 BACKLOG reattempts)");
  console.log("   - 3 Semester Results");
  console.log("\n🎓 Student Details:");
  console.log("   • Name: VIPAN KUMAR");
  console.log("   • Enrollment: gq5012");
  console.log("   • Email: gq5012@myamu.ac.in");
  console.log("   • Password: azx");
  console.log("   • Branch: Electrical Engineering (EEBEA)");
  console.log("   • Faculty: 24EEBEA201");
  console.log("   • Current Semester: 4");
  console.log("   • CPI: 5.602");
  console.log("   • Hall: SU");
  console.log("\n📊 Academic Performance:");
  console.log("   • Semester 1 SPI: 2.533 (2 failures)");
  console.log("   • Semester 2 SPI: 9.634 (using PRANJAL's 1st sem result)");
  console.log("   • Semester 3 SPI: 4.639 (cleared 2 backlogs)");
  console.log("\n🔄 Reattempts:");
  console.log("   • AMS1112: Failed in Sem 1 (E) → Passed in Sem 3 (D) - BACKLOG");
  console.log("   • ELA1112: Failed in Sem 1 (E) → Passed in Sem 3 (D) - BACKLOG");
  console.log("\n🎯 Ready for Semester 4 registration!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
