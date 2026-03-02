import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixEnrollmentCase() {
  console.log("🔧 Changing enrollment number to lowercase...");

  try {
    // Update student
    await prisma.student.update({
      where: { enrollment_no: "GM7605" },
      data: { enrollment_no: "gm7605" },
    });
    console.log("✅ Student enrollment updated to lowercase");

    // Update grade records
    await prisma.gradeRecord.updateMany({
      where: { enrollment_no: "GM7605" },
      data: { enrollment_no: "gm7605" },
    });
    console.log("✅ Grade records updated");

    // Update semester results
    await prisma.semesterResult.updateMany({
      where: { enrollment_no: "GM7605" },
      data: { enrollment_no: "gm7605" },
    });
    console.log("✅ Semester results updated");

    console.log("\n✅ Enrollment number changed to: gm7605");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEnrollmentCase();
