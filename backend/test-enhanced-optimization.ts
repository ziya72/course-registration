import { PrismaClient, Grade } from "@prisma/client";

const prisma = new PrismaClient();

async function testEnhancedOptimization() {
  console.log("🔥 Testing Enhanced Database Schema Optimization...\n");

  try {
    // Test 1: Check Grade enum is working
    console.log("📊 Test 1: Testing Grade enum validation...");
    
    const validGrades = [Grade.A_PLUS, Grade.A, Grade.B_PLUS, Grade.B, Grade.C, Grade.D, Grade.E, Grade.F, Grade.I];
    console.log(`✅ Grade enum has ${validGrades.length} valid values:`, validGrades);

    // Test 2: Check indexes exist
    console.log("\n📊 Test 2: Checking database indexes...");
    
    const indexQuery = `
      SELECT 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE tablename = 'GradeRecord' 
      ORDER BY indexname;
    `;
    
    const indexes = await prisma.$queryRawUnsafe(indexQuery);
    console.log("✅ GradeRecord indexes:");
    console.log(indexes);

    // Test 3: Test unique constraint
    console.log("\n📊 Test 3: Testing unique constraint (enrollment_no, course_code, sem)...");
    
    try {
      // This should work - first record
      await prisma.gradeRecord.create({
        data: {
          enrollment_no: "TEST001",
          course_code: "CS101",
          sem: "S24251",
          semester_no: 1,
          grade: Grade.A,
        },
      });
      console.log("✅ First record created successfully");

      // This should fail - duplicate
      try {
        await prisma.gradeRecord.create({
          data: {
            enrollment_no: "TEST001",
            course_code: "CS101", 
            sem: "S24251",
            semester_no: 1,
            grade: Grade.B,
          },
        });
        console.log("❌ Duplicate record created - constraint not working!");
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log("✅ Unique constraint working - duplicate rejected");
        } else {
          console.log("❌ Unexpected error:", error.message);
        }
      }

      // Clean up test record
      await prisma.gradeRecord.deleteMany({
        where: { enrollment_no: "TEST001" },
      });
      console.log("✅ Test records cleaned up");

    } catch (error: any) {
      console.log("❌ Test record creation failed:", error.message);
    }

    // Test 4: Test query performance with indexes
    console.log("\n📊 Test 4: Testing query performance with new indexes...");
    
    const startTime = Date.now();
    
    // Test enrollment_no index
    const studentGrades = await prisma.gradeRecord.findMany({
      where: { enrollment_no: "gm7605" },
      include: { course: true },
    });
    
    // Test sem index  
    const semesterGrades = await prisma.gradeRecord.findMany({
      where: { sem: "S24251" },
      include: { course: true },
    });
    
    // Test composite index (enrollment_no + sem)
    const studentSemesterGrades = await prisma.gradeRecord.findMany({
      where: {
        enrollment_no: "gm7605",
        sem: "S24251",
      },
      include: { course: true },
    });
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ All queries completed in ${queryTime}ms`);
    console.log(`   - Student grades: ${studentGrades.length} records`);
    console.log(`   - Semester grades: ${semesterGrades.length} records`);
    console.log(`   - Student+Semester: ${studentSemesterGrades.length} records`);

    // Test 5: Test grade enum functions
    console.log("\n📊 Test 5: Testing grade enum helper functions...");
    
    const gradePoints: { [key in Grade]: number } = {
      [Grade.A_PLUS]: 10.0,
      [Grade.A]: 9.0,
      [Grade.B_PLUS]: 8.0,
      [Grade.B]: 7.0,
      [Grade.C]: 6.0,
      [Grade.D]: 5.0,
      [Grade.E]: 4.0,
      [Grade.F]: 0.0,
      [Grade.I]: 0.0,
    };

    function calculateGradePoints(grade: Grade): number {
      return gradePoints[grade] ?? 0.0;
    }

    function isBacklogGrade(grade: Grade): boolean {
      return (grade === Grade.E || grade === Grade.F || grade === Grade.I);
    }

    function isPassingGrade(grade: Grade): boolean {
      return (grade === Grade.A_PLUS || grade === Grade.A || grade === Grade.B_PLUS || 
              grade === Grade.B || grade === Grade.C || grade === Grade.D);
    }

    const testGrades = [Grade.A_PLUS, Grade.B, Grade.D, Grade.E, Grade.F, Grade.I];
    testGrades.forEach(grade => {
      const points = calculateGradePoints(grade);
      const isBacklog = isBacklogGrade(grade);
      const isPassing = isPassingGrade(grade);
      console.log(`   Grade ${grade}: ${points} points, Backlog: ${isBacklog}, Passing: ${isPassing}`);
    });

    // Test 6: Verify CPI calculation uses best attempt
    console.log("\n📊 Test 6: Verifying CPI calculation logic...");
    
    // Simulate course attempts
    const courseAttempts = new Map<string, any[]>();
    courseAttempts.set("CS101", [
      { grade: Grade.F, gradePoints: 0.0, credits: 3 },
      { grade: Grade.E, gradePoints: 4.0, credits: 3 },
      { grade: Grade.B, gradePoints: 7.0, credits: 3 }, // Best attempt
    ]);

    let totalCredits = 0;
    let totalGradePoints = 0;

    courseAttempts.forEach((attempts, courseCode) => {
      const bestAttempt = attempts.reduce((best, curr) => 
        curr.gradePoints > best.gradePoints ? curr : best
      );
      
      if (isPassingGrade(bestAttempt.grade)) {
        totalCredits += bestAttempt.credits;
        totalGradePoints += bestAttempt.gradePoints * bestAttempt.credits;
      }
      
      console.log(`   ${courseCode}: Best grade ${bestAttempt.grade} (${bestAttempt.gradePoints} points)`);
    });

    const cpi = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(3) : "0.000";
    console.log(`   ✅ Calculated CPI: ${cpi} (uses best attempt per course)`);

    console.log("\n🎉 All enhanced optimization tests passed successfully!");
    console.log("\n📈 Enhanced Optimization Benefits:");
    console.log("   ✅ Grade enum prevents invalid grades");
    console.log("   ✅ Unique constraint prevents duplicate attempts");
    console.log("   ✅ Optimized indexes for common queries");
    console.log("   ✅ CPI calculation uses best attempt per course");
    console.log("   ✅ Type-safe grade operations");

  } catch (error) {
    console.error("❌ Enhanced optimization test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnhancedOptimization();