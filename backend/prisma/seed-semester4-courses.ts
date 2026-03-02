import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating Semester 4 EEBEA courses...");

  // Semester 4 courses (Electrical Engineering - Even Semester)
  const sem4Courses = [
    { course_code: "AMS2242", course_name: "Numerical Methods", credits: 3, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EEC2122", course_name: "Electrical Machines-II", credits: 4, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EEC2742", course_name: "Control Systems", credits: 4, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EEC2752", course_name: "Power Electronics", credits: 3.5, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EEC2762", course_name: "Analog Electronics", credits: 3, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Theory" },
    { course_code: "EEC2922", course_name: "Electrical Machines Lab II", credits: 2, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Lab" },
    { course_code: "EEC2932", course_name: "Electronics Lab", credits: 2, semester_no: 4, branch_code: "EEBEA", is_elective: false, course_type: "Lab" },
    { course_code: "HUA2342", course_name: "Professional Ethics", credits: 2, semester_no: 4, branch_code: "EEBEA", is_elective: true, elective_group: "ELEC-EE4", course_type: "Theory" },
  ];

  console.log(`📖 Creating ${sem4Courses.length} Semester 4 courses...`);
  
  for (const course of sem4Courses) {
    await prisma.course.upsert({
      where: { course_code: course.course_code },
      update: {},
      create: course,
    });
  }

  // Create elective group
  console.log("📋 Creating elective group...");
  await prisma.electiveGroup.upsert({
    where: { group_id: 2 },
    update: {},
    create: {
      group_code: "ELEC-EE4",
      group_name: "Semester 4 Electives",
      branch_code: "EEBEA",
      semester_no: 4,
      min_selection: 0,
      max_selection: 1,
    },
  });

  console.log("\n✅ Semester 4 courses created successfully!");
  console.log("\n📋 Summary:");
  console.log(`   - ${sem4Courses.length} courses created for Semester 4 EEBEA`);
  console.log("   - 7 non-elective courses (will be auto-selected)");
  console.log("   - 1 elective course (optional)");
  console.log("\n📚 Courses:");
  sem4Courses.forEach(c => {
    console.log(`   • ${c.course_code} - ${c.course_name} (${c.credits} cr) ${c.is_elective ? '[ELECTIVE]' : '[MANDATORY]'}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
