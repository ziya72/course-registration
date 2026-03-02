import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 VIPAN KUMAR - Quick Verification\n");
  console.log("=" .repeat(60));

  const student = await prisma.student.findUnique({
    where: { enrollment_no: "gq5012" },
  });

  if (!student) {
    console.log("❌ Student not found!");
    return;
  }

  console.log("\n✅ STUDENT FOUND");
  console.log(`   Email: ${student.email}`);
  console.log(`   Password: azx`);
  console.log(`   Current Semester: ${student.current_semester}`);
  console.log(`   CPI: ${student.current_cpi}`);

  const gradeRecords = await prisma.gradeRecord.findMany({
    where: { enrollment_no: "gq5012" },
    orderBy: [{ academic_year: "asc" }, { semester_type: "asc" }],
  });

  console.log(`\n📚 GRADE RECORDS: ${gradeRecords.length} total`);
  
  const sem1 = gradeRecords.filter(r => r.academic_year === 2024 && r.semester_type === 1);
  const sem2 = gradeRecords.filter(r => r.academic_year === 2024 && r.semester_type === 2);
  const sem3 = gradeRecords.filter(r => r.academic_year === 2025 && r.semester_type === 1);

  console.log(`   Semester 1: ${sem1.length} courses (${sem1.filter(r => r.grade === 'E').length} failures)`);
  console.log(`   Semester 2: ${sem2.length} courses`);
  console.log(`   Semester 3: ${sem3.length} courses (${sem3.filter(r => r.is_backlog).length} backlog reattempts)`);

  const backlogs = gradeRecords.filter(r => r.is_backlog);
  console.log(`\n🔄 BACKLOG REATTEMPTS: ${backlogs.length}`);
  backlogs.forEach(b => {
    console.log(`   ${b.course_code}: Grade ${b.grade} (${b.academic_year} Sem ${b.semester_type})`);
  });

  const semResults = await prisma.semesterResult.findMany({
    where: { enrollment_no: "gq5012" },
    orderBy: [{ semester_no: "asc" }],
  });

  console.log(`\n📊 SEMESTER RESULTS:`);
  semResults.forEach(r => {
    console.log(`   Sem ${r.semester_no}: SPI ${r.spi}, CPI ${r.cpi}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Verification Complete!");
  console.log("\n📝 To test in the app:");
  console.log("   1. Make sure backend is running: npm run dev");
  console.log("   2. Login with: gq5012@myamu.ac.in / azx");
  console.log("   3. Check dashboard for CPI and credits");
  console.log("   4. View course history to see reattempts");
  console.log("\n📝 To test with REST API:");
  console.log("   Open backend/VIPAN_TESTS.rest in VS Code");
  console.log("   Click 'Send Request' on each endpoint");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
