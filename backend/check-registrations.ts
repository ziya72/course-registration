import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkRegistrations() {
  console.log("🔍 Checking registrations for gm7605...\n");

  const registrations = await prisma.courseRegistration.findMany({
    where: { enrollment_no: "gm7605" },
    include: { course: true },
    orderBy: { registered_at: 'desc' },
  });

  console.log(`Found ${registrations.length} registrations:\n`);

  registrations.forEach((reg) => {
    console.log(`  ${reg.course_code} - ${reg.course.course_name}`);
    console.log(`    Academic Year: ${reg.academic_year}, Semester Type: ${reg.semester_type}`);
    console.log(`    Registered At: ${reg.registered_at}`);
    console.log(`    Deleted At: ${reg.deleted_at || 'Not deleted'}`);
    console.log(`    Approved: ${reg.is_approved}\n`);
  });

  await prisma.$disconnect();
}

checkRegistrations().catch(console.error);
