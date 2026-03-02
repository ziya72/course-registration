"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Seeding extended dummy data...");
    /* FACULTY NUMBERS (BRANCH) */
    await prisma.facultyNumber.createMany({
        data: [
            {
                faculty_no: "gm7605",
                admission_year: 2024,
                branch_code: "COBEA",
                branch_name: "Computer Engineering",
                roll_number: "7605",
                program_type: "B.Tech",
            },
            {
                faculty_no: "gp1212",
                admission_year: 2024,
                branch_code: "COBEA",
                branch_name: "Computer Engineering",
                roll_number: "1212",
                program_type: "B.Tech",
            },
            {
                faculty_no: "gq5012",
                admission_year: 2024,
                branch_code: "COBEA",
                branch_name: "Computer Engineering",
                roll_number: "5012",
                program_type: "B.Tech",
            },
        ],
        skipDuplicates: true,
    });
    /*STUDENTS (PRE-CREATED) */
    const studentPassword = await bcrypt_1.default.hash("Student@123", 10);
    await prisma.student.createMany({
        data: [
            {
                enrollment_no: "gm7605",
                faculty_no: "gm7605",
                name: "Gaurav Mishra",
                email: "gm7605@myamu.ac.in",
                password_hash: studentPassword,
                current_semester: 1,
                current_cpi: 0.0,
                is_active: true, // Already activated by admin
            },
            {
                enrollment_no: "gp1212",
                faculty_no: "gp1212",
                name: "Gaurav Pandey",
                email: "gp1212@amu.ac.in",
                password_hash: studentPassword,
                current_semester: 1,
                current_cpi: 0.0,
                is_active: true, // Already activated by admin
            },
            {
                enrollment_no: "gq5012",
                faculty_no: "gq5012",
                name: "Test Student",
                email: "gq5012@myamu.ac.in",
                password_hash: "", // No password yet - needs to register
                current_semester: 1,
                current_cpi: 0.0,
                is_active: false, // Not activated - for testing registration flow
            },
        ],
        skipDuplicates: true,
    });
    /*TEACHERS*/
    const teacherPassword = await bcrypt_1.default.hash("Teacher@123", 10);
    await prisma.teacher.createMany({
        data: [
            {
                name: "Dr. Sharma",
                email: "sharma@amu.ac.in",
                password_hash: teacherPassword,
                role: "teacher",
                department: "Computer Engineering",
                is_active: true,
            },
        ],
        skipDuplicates: true,
    });
    /*COURSES*/
    await prisma.course.createMany({
        data: [
            {
                course_code: "CS101",
                course_name: "Programming Fundamentals",
                credits: 4,
                semester_no: 1,
                branch_code: "COBEA",
                is_elective: false,
                course_type: "Theory",
            },
            {
                course_code: "CS102",
                course_name: "Data Structures",
                credits: 4,
                semester_no: 2,
                branch_code: "COBEA",
                is_elective: false,
                course_type: "Theory",
            },
            {
                course_code: "MA101",
                course_name: "Engineering Mathematics",
                credits: 4,
                semester_no: 1,
                branch_code: "COBEA",
                is_elective: false,
                course_type: "Theory",
            },
            {
                course_code: "HS101",
                course_name: "Technical Communication",
                credits: 2,
                semester_no: 1,
                branch_code: "COBEA",
                is_elective: true,
                elective_group: "HS-GRP",
                course_type: "Theory",
            },
        ],
        skipDuplicates: true,
    });
    /* PREREQUISITES*/
    await prisma.coursePrerequisite.createMany({
        data: [
            {
                course_code: "CS102",
                prerequisite_course_code: "CS101",
                min_grade: "5.0", // Minimum 5.0 out of 10
            },
        ],
        skipDuplicates: true,
    });
    /* ELECTIVE GROUP*/
    await prisma.electiveGroup.createMany({
        data: [
            {
                group_code: "HS-GRP",
                group_name: "Humanities Electives",
                branch_code: "COBEA",
                semester_no: 1,
                min_selection: 1,
                max_selection: 1,
            },
        ],
        skipDuplicates: true,
    });
    /*REGISTRATION RULES*/
    await prisma.registrationRule.createMany({
        data: [
            {
                rule_name: "MAX_CREDITS",
                rule_type: "credit_limit",
                rule_value: "20",
                is_active: true,
            },
        ],
        skipDuplicates: true,
    });
    console.log("✅ Dummy data seeded successfully");
}
main()
    .catch((e) => {
    console.error("Seeding failed", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
