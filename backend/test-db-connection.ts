import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  console.log("🔍 Testing database connection...");
  
  try {
    // Simple connection test
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful!");
    console.log("Result:", result);
    
    // Test basic query
    const studentCount = await prisma.student.count();
    console.log(`📊 Current students in database: ${studentCount}`);
    
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then((success) => {
    if (success) {
      console.log("\n🎉 Database is accessible!");
      console.log("You can now run the cleanup script.");
    } else {
      console.log("\n⚠️  Database connection issues detected.");
      console.log("Please check:");
      console.log("1. Internet connection");
      console.log("2. Database server status");
      console.log("3. Database credentials");
    }
    process.exit(success ? 0 : 1);
  });