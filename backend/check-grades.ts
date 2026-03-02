import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkGrades() {
  console.log("🔍 Checking grade records for gm7605...\n");

  const gradeRecords = await prisma.gradeRecord.findMany({
    where: { enrollment_no: "gm7605" },
    include: { course: true },
    orderBy: [
      { academic_year: "asc" },
      { semester_type: "asc" },
    ],
  });

  console.log(`Found ${gradeRecords.length} grade records:\n`);

  gradeRecords.forEach((record) => {
    console.log(`  ${record.course_code} - ${record.course.course_name}`);
    console.log(`    Grade: ${record.grade}, Credits: ${record.course.credits}`);
    console.log(`    Year: ${record.academic_year}, Semester Type: ${record.semester_type}\n`);
  });

  // Calculate earned credits
  const passGrades = ["A+", "A", "B+", "B", "C", "D"];
  const earnedCredits = gradeRecords
    .filter(record => record.grade && passGrades.includes(record.grade))
    .reduce((sum, record) => sum + record.course.credits, 0);

  console.log(`\n💯 Total Earned Credits: ${earnedCredits}`);

  await prisma.$disconnect();
}

checkGrades().catch(console.error);
