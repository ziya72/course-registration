import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addDeadlines() {
  console.log("⏰ Adding deadline rules...");

  try {
    // Delete existing deadline rules if any
    await prisma.registrationRule.deleteMany({
      where: {
        rule_name: { in: ["REGISTRATION_DEADLINE", "MODIFICATION_DEADLINE"] },
      },
    });

    // Add new deadline rules
    await prisma.registrationRule.createMany({
      data: [
        // Registration deadline - 30 days from now
        { 
          rule_name: "REGISTRATION_DEADLINE", 
          rule_type: "deadline", 
          rule_value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), 
          is_active: true 
        },
        // Modification deadline - 15 days from now
        { 
          rule_name: "MODIFICATION_DEADLINE", 
          rule_type: "deadline", 
          rule_value: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), 
          is_active: true 
        },
      ],
    });

    console.log("✅ Deadline rules added successfully!");
    console.log(`   - Registration deadline: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleString()}`);
    console.log(`   - Modification deadline: ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleString()}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addDeadlines();
