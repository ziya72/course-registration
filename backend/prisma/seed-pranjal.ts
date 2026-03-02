import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with PRANJAL YADAV (Semester 1 from screenshot)...");

  // Clean existing data for PRANJAL YADAV
  console.log("🧹 Cleaning existing data for gm7605...");
  await prisma.gradeRecord.deleteMany({ where: { enrollment_no: "gm7605" } });
  await prisma.semesterResult.deleteMany({ where: { enrollment_no: "gm7605" } });
  await prisma.courseRegistration.deleteMany({ where: { enrollment_no: "gm7605" } });
  await prisma.student.deleteMany({ where: { enrollment_no: "gm7605" } });
  await prisma.facultyNumber.deleteMany({ where: { faculty_no: "24ELBEA168" } });

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
  console.log("👨‍🎓 Creating student PRANJAL YADAV...");
  const pranjalPassword = await bcrypt.hash("azx", 10);
  await prisma.student.create({
    data: {
      enrollment_no: "gm7605",
      faculty_no: "24ELBEA168",
      name: "PRANJAL YADAV",
      email: "gm7605@myamu.ac.in",
      password_hash: pranjalPassword,
      current_semester: 3, // Ready to register for Semester 3
      current_cpi: 9.567, // (9.634 + 9.5) / 2
      is_active: true,
      hall: "SU"
    },
  });

  // Create Semester 1 courses (from screenshot)
  console.log("📖 Creating Semester 1 ELBEA courses...");
  const sem1Courses = [
    { course_code: "ACS1112", course_name: "Applied Chemistry", credits: 3.5, semester_no: 1, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "ACS1912", course_name: "Applied Chemistry Lab", credits: 1.5, semester_no: 1, branch_code: "ELBEA", is_elective: false, course_type: "Lab" },
    { course_code: "AMS1112", course_name: "Applied Mathematics-I", credits: 4, semester_no: 1, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "CEU1112", course_name: "Environmental Studies", credits: 2, semester_no: 1, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "COA1912", course_name: "Computer Programming Lab", credits: 2, semester_no: 1, branch_code: "ELBEA", is_elective: false, course_type: "Lab" },
    { course_code: "EEA1112", course_name: "Principles of Electrical Engineering", credits: 3, semester_no: 1, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "MEA1112", course_name: "Thermal Sciences", credits: 3, semester_no: 1, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "MEA1912", course_name: "Engineering Graphics Lab", credits: 2, semester_no: 1, branch_code: "ELBEA", is_elective: false, course_type: "Lab" },
  ];

  for (const course of sem1Courses) {
    await prisma.course.upsert({
      where: { course_code: course.course_code },
      update: {},
      create: course,
    });
  }

  // Create Semester 2 courses (for future registration)
  console.log("📖 Creating Semester 2 ELBEA courses...");
  const sem2Courses = [
    { course_code: "AMS1122", course_name: "Applied Mathematics-II", credits: 4, semester_no: 2, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "APS1111", course_name: "Applied Physics-I", credits: 3.5, semester_no: 2, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "APS1911", course_name: "Applied Physics Lab-I", credits: 1.5, semester_no: 2, branch_code: "ELBEA", is_elective: false, course_type: "Lab" },
    { course_code: "ELA1112", course_name: "Principles of Electronics Engineering", credits: 3, semester_no: 2, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EZH1111", course_name: "English-I", credits: 2, semester_no: 2, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EZH1911", course_name: "Communication Skills Lab", credits: 1.5, semester_no: 2, branch_code: "ELBEA", is_elective: false, course_type: "Lab" },
    { course_code: "MEA1121", course_name: "Engineering Mechanics", credits: 3, semester_no: 2, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "COA1112", course_name: "Programming Fundamentals", credits: 4, semester_no: 2, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
  ];

  for (const course of sem2Courses) {
    await prisma.course.upsert({
      where: { course_code: course.course_code },
      update: {},
      create: course,
    });
  }

  // Create Semester 3 courses (Electronics Engineering)
  console.log("📖 Creating Semester 3 ELBEA courses...");
  const sem3Courses = [
    { course_code: "ELA2331", course_name: "Electronic Circuits", credits: 4, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "ELA2332", course_name: "Signals and Systems", credits: 3.5, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "ELA2931", course_name: "Electronics Lab", credits: 2, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Lab" },
    { course_code: "AMS2331", course_name: "Engineering Mathematics-III", credits: 3, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "ELA2333", course_name: "Digital Electronics", credits: 3, semester_no: 3, branch_code: "ELBEA", is_elective: false, course_type: "Theory" },
    { course_code: "HUA2331", course_name: "Technical Writing", credits: 2, semester_no: 3, branch_code: "ELBEA", is_elective: true, elective_group: "ELEC-EL3", course_type: "Theory" },
  ];

  for (const course of sem3Courses) {
    await prisma.course.upsert({
      where: { course_code: course.course_code },
      update: {},
      create: course,
    });
  }

  // Grade Records - Semester 1 (from screenshot: Odd Semester 2024-25)
  console.log("📊 Creating Semester 1 grade records (from screenshot)...");
  await prisma.gradeRecord.createMany({
    data: [
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "ACS1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "ACS1912", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "AMS1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "CEU1112", grade: "B+", grade_points: 8.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "COA1912", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EEA1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "MEA1112", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "MEA1912", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 1, is_backlog: false, is_improvement: false },
    ],
  });

  // Grade Records - Semester 2 (Even Semester 2024-25)
  console.log("📊 Creating Semester 2 grade records...");
  await prisma.gradeRecord.createMany({
    data: [
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "AMS1122", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1111", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "APS1911", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "ELA1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EZH1111", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "EZH1911", grade: "A", grade_points: 9.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "MEA1121", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
      { enrollment_no: "gm7605", faculty_no: "24ELBEA168", course_code: "COA1112", grade: "A+", grade_points: 10.0, academic_year: 2024, semester_type: 2, is_backlog: false, is_improvement: false },
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
        total_credits_earned: 21,
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
        spi: 9.5, 
        cpi: 9.567, // (9.634 + 9.5) / 2
        total_credits_earned: 21.5,
        is_result_declared: true,
        result_status: "Pass"
      },
    ],
  });

  // Elective Groups
  console.log("📋 Creating elective groups...");
  await prisma.electiveGroup.upsert({
    where: { group_id: 1 },
    update: {},
    create: {
      group_code: "ELEC-EL3",
      group_name: "Semester 3 Electives",
      branch_code: "ELBEA",
      semester_no: 3,
      min_selection: 1,
      max_selection: 1,
    },
  });

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Summary:");
  console.log("   - 1 Faculty Number (24ELBEA168 - ELBEA)");
  console.log("   - 1 Student (PRANJAL YADAV - gm7605)");
  console.log("   - 22 Courses (Semester 1, 2, 3 ELBEA)");
  console.log("   - 16 Grade Records (8 Semester 1 + 8 Semester 2)");
  console.log("   - 2 Semester Results");
  console.log("   - 1 Elective Group");
  console.log("\n🎓 Student Details:");
  console.log("   • Name: PRANJAL YADAV");
  console.log("   • Enrollment: gm7605");
  console.log("   • Email: gm7605@myamu.ac.in");
  console.log("   • Password: azx");
  console.log("   • Branch: Electronics Engineering (ELBEA)");
  console.log("   • Faculty: 24ELBEA168");
  console.log("   • Current Semester: 3 (ready to register for Semester 3)");
  console.log("   • CPI: 9.567");
  console.log("   • Hall: SU");
  console.log("\n📊 Academic Performance:");
  console.log("   • Semester 1 SPI: 9.634 (all passed with A+, A, B+ grades)");
  console.log("   • Semester 2 SPI: 9.5 (all passed with A+, A grades)");
  console.log("   • Total Earned Credits: 42.5");
  console.log("\n📝 Semester 1 Courses (from screenshot):");
  console.log("   1. ACS1112 - Applied Chemistry: A+ (3.5 cr)");
  console.log("   2. ACS1912 - Applied Chemistry Lab: A (1.5 cr)");
  console.log("   3. AMS1112 - Applied Mathematics-I: A+ (4 cr)");
  console.log("   4. CEU1112 - Environmental Studies: B+ (2 cr)");
  console.log("   5. COA1912 - Computer Programming Lab: A+ (2 cr)");
  console.log("   6. EEA1112 - Principles of Electrical Engineering: A+ (3 cr)");
  console.log("   7. MEA1112 - Thermal Sciences: A (3 cr)");
  console.log("   8. MEA1912 - Engineering Graphics Lab: A (2 cr)");
  console.log("\n🎯 Ready for Semester 3 registration!");
  console.log("   Available courses: Electronic Circuits, Signals and Systems, etc.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
