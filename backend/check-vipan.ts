import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking VIPAN KUMAR's data...\n");

  // Get student
  const student = await prisma.student.findUnique({
    where: { enrollment_no: "gq5012" },
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
  console.log(`   Active: ${student.is_active}`);

  // Get all grade records
  const gradeRecords = await prisma.gradeRecord.findMany({
    where: { enrollment_no: "gq5012" },
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
  const sem3 = gradeRecords.filter(r => r.academic_year === 2025 && r.semester_type === 1);

  console.log(`\n📖 Semester 1 (2024 Odd): ${sem1.length} courses`);
  sem1.forEach(r => {
    const badge = r.is_backlog ? " [BACKLOG]" : r.is_improvement ? " [IMPROVEMENT]" : "";
    console.log(`   ${r.course_code} - ${r.course.course_name}: ${r.grade} (${r.grade_points})${badge}`);
  });

  console.log(`\n📖 Semester 2 (2024 Even): ${sem2.length} courses`);
  sem2.forEach(r => {
    const badge = r.is_backlog ? " [BACKLOG]" : r.is_improvement ? " [IMPROVEMENT]" : "";
    console.log(`   ${r.course_code} - ${r.course.course_name}: ${r.grade} (${r.grade_points})${badge}`);
  });

  console.log(`\n📖 Semester 3 (2025 Odd): ${sem3.length} courses`);
  sem3.forEach(r => {
    const badge = r.is_backlog ? " [BACKLOG]" : r.is_improvement ? " [IMPROVEMENT]" : "";
    console.log(`   ${r.course_code} - ${r.course.course_name}: ${r.grade} (${r.grade_points})${badge}`);
  });

  // Check for reattempts
  const courseAttempts = new Map<string, any[]>();
  gradeRecords.forEach(r => {
    if (!courseAttempts.has(r.course_code)) {
      courseAttempts.set(r.course_code, []);
    }
    courseAttempts.get(r.course_code)!.push({
      semester: `${r.academic_year} Sem ${r.semester_type}`,
      grade: r.grade,
      gradePoints: Number(r.grade_points),
      isBacklog: r.is_backlog,
      isImprovement: r.is_improvement,
    });
  });

  console.log(`\n🔄 Reattempted Courses:`);
  let reattemptCount = 0;
  courseAttempts.forEach((attempts, courseCode) => {
    if (attempts.length > 1) {
      reattemptCount++;
      console.log(`\n   ${courseCode}:`);
      attempts.forEach((attempt, idx) => {
        const type = attempt.isBacklog ? "BACKLOG" : attempt.isImprovement ? "IMPROVEMENT" : "Regular";
        console.log(`     Attempt ${idx + 1}: ${attempt.semester} - Grade ${attempt.grade} (${attempt.gradePoints}) [${type}]`);
      });
    }
  });

  if (reattemptCount === 0) {
    console.log("   None");
  }

  // Calculate statistics
  const passGrades = ["A+", "A", "B+", "B", "C", "D"];
  let uniqueCoursesCredits = 0;
  let uniqueCoursesGradePoints = 0;

  courseAttempts.forEach((attempts, courseCode) => {
    // Get best attempt
    const sortedAttempts = attempts.sort((a, b) => b.gradePoints - a.gradePoints);
    const bestAttempt = sortedAttempts[0];

    // Find the course to get credits
    const gradeRecord = gradeRecords.find(r => r.course_code === courseCode);
    if (gradeRecord && bestAttempt.grade && passGrades.includes(bestAttempt.grade)) {
      uniqueCoursesCredits += gradeRecord.course.credits;
      uniqueCoursesGradePoints += bestAttempt.gradePoints * gradeRecord.course.credits;
    }
  });

  const calculatedCPI = uniqueCoursesCredits > 0
    ? (uniqueCoursesGradePoints / uniqueCoursesCredits).toFixed(3)
    : "0.000";

  console.log(`\n📊 Statistics:`);
  console.log(`   Total Attempts: ${gradeRecords.length}`);
  console.log(`   Unique Courses: ${courseAttempts.size}`);
  console.log(`   Reattempted Courses: ${reattemptCount}`);
  console.log(`   Earned Credits (best attempts): ${uniqueCoursesCredits}`);
  console.log(`   Calculated CPI: ${calculatedCPI}`);
  console.log(`   Stored CPI: ${student.current_cpi}`);

  // Get semester results
  const semesterResults = await prisma.semesterResult.findMany({
    where: { enrollment_no: "gq5012" },
    orderBy: [
      { academic_year: "asc" },
      { semester_type: "asc" },
    ],
  });

  console.log(`\n📈 Semester Results: ${semesterResults.length}`);
  semesterResults.forEach(r => {
    console.log(`   Semester ${r.semester_no} (${r.academic_year} Type ${r.semester_type}): SPI ${r.spi}, CPI ${r.cpi}, Credits ${r.total_credits_earned}, Status: ${r.result_status}`);
  });

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
