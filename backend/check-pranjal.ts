import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking PRANJAL YADAV's data...\n");

  // Get student
  const student = await prisma.student.findUnique({
    where: { enrollment_no: "gm7605" },
    include: { faculty: true },
  });

  if (!student) {
    console.log("❌ Student not found!");
    return;
  }

  console.log("👨‍🎓 Student Info:");
  console.log(`   Name: ${student.name}`);
  console.log(`   Enrollment: ${student.enrollment_no}`);
  console.log(`   Email: ${student.email}`);
  console.log(`   Faculty: ${student.faculty_no}`);
  console.log(`   Branch: ${student.faculty?.branch_name} (${student.faculty?.branch_code})`);
  console.log(`   Current Semester: ${student.current_semester}`);
  console.log(`   CPI: ${student.current_cpi}`);
  console.log(`   Hall: ${student.hall}`);

  // Get all grade records
  const gradeRecords = await prisma.gradeRecord.findMany({
    where: { enrollment_no: "gm7605" },
    include: { course: true },
    orderBy: [
      { academic_year: "asc" },
      { semester_type: "asc" },
    ],
  });

  console.log(`\n📚 Grade Records: ${gradeRecords.length} total`);

  // Group by semester
  const sem1 = gradeRecords.filter(r => r.academic_year === 2024 && r.semester_type === 1);
  const sem2 = gradeRecords.filter(r => r.academic_year === 2024 && r.semester_type === 2);

  console.log(`\n📖 Semester 1 (2024 Odd): ${sem1.length} courses`);
  if (sem1.length > 0) {
    sem1.forEach(r => {
      console.log(`   ${r.course_code} - ${r.course.course_name}: ${r.grade} (${r.grade_points})`);
    });
  } else {
    console.log("   ❌ NO SEMESTER 1 DATA FOUND!");
  }

  console.log(`\n📖 Semester 2 (2024 Even): ${sem2.length} courses`);
  if (sem2.length > 0) {
    sem2.forEach(r => {
      console.log(`   ${r.course_code} - ${r.course.course_name}: ${r.grade} (${r.grade_points})`);
    });
  } else {
    console.log("   ❌ NO SEMESTER 2 DATA FOUND!");
  }

  // Get semester results
  const semesterResults = await prisma.semesterResult.findMany({
    where: { enrollment_no: "gm7605" },
    orderBy: [
      { academic_year: "asc" },
      { semester_type: "asc" },
    ],
  });

  console.log(`\n📈 Semester Results: ${semesterResults.length}`);
  semesterResults.forEach(r => {
    console.log(`   Semester ${r.semester_no} (${r.academic_year} Type ${r.semester_type}): SPI ${r.spi}, CPI ${r.cpi}`);
  });

  // Get registrations
  const registrations = await prisma.courseRegistration.findMany({
    where: { enrollment_no: "gm7605" },
    include: { course: true },
    orderBy: [
      { academic_year: "desc" },
      { semester_type: "desc" },
    ],
  });

  console.log(`\n📝 Course Registrations: ${registrations.length}`);
  if (registrations.length > 0) {
    registrations.forEach(r => {
      const status = r.deleted_at ? "DROPPED" : (r.is_approved ? "APPROVED" : "PENDING");
      console.log(`   ${r.course_code} - ${r.course.course_name} (${r.academic_year} Sem ${r.semester_type}) - ${status}`);
    });
  } else {
    console.log("   ❌ NO REGISTRATIONS FOUND!");
  }

  console.log("\n✅ Check complete!");
}

main()
  .catch((e) => {
    console.error("❌ Check failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
