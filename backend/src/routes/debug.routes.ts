import { Router, Request, Response } from "express";

const router = Router();

// Debug endpoint to check environment variables
router.get("/env-check", (req: Request, res: Response) => {
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Not set',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Not set',
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set',
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'not set',
    SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME || 'not set',
    FRONTEND_URL: process.env.FRONTEND_URL || 'not set',
  };

  res.json({
    message: "Environment variables status",
    environment: envStatus,
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint to check if users exist in database
router.get("/check-users", async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const studentCount = await prisma.student.count();
    const teacherCount = await prisma.teacher.count();
    
    const students = await prisma.student.findMany({
      select: {
        enrollment_no: true,
        email: true,
        name: true,
        is_active: true,
        password_hash: true,
      },
      take: 5,
    });

    const teachers = await prisma.teacher.findMany({
      select: {
        teacher_id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        password_hash: true,
      },
      take: 5,
    });

    await prisma.$disconnect();

    res.json({
      message: "Database user check",
      counts: {
        students: studentCount,
        teachers: teacherCount,
      },
      sampleStudents: students.map((s: any) => ({
        ...s,
        password_hash: s.password_hash ? '✅ Has password' : '❌ No password',
      })),
      sampleTeachers: teachers.map((t: any) => ({
        ...t,
        password_hash: t.password_hash ? '✅ Has password' : '❌ No password',
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Database check failed",
      message: error.message,
    });
  }
});

// Debug endpoint to test login credentials
router.post("/test-login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const bcrypt = require("bcrypt");
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    // Check if teacher
    const teacher = await prisma.teacher.findUnique({
      where: { email },
    });

    if (teacher) {
      const match = await bcrypt.compare(password, teacher.password_hash);
      await prisma.$disconnect();
      return res.json({
        found: true,
        type: "teacher",
        email: teacher.email,
        name: teacher.name,
        role: teacher.role,
        passwordMatch: match,
        isActive: teacher.is_active,
      });
    }

    // Check if student
    const student = await prisma.student.findUnique({
      where: { email },
    });

    if (student) {
      const match = await bcrypt.compare(password, student.password_hash);
      await prisma.$disconnect();
      return res.json({
        found: true,
        type: "student",
        email: student.email,
        name: student.name,
        enrollment_no: student.enrollment_no,
        passwordMatch: match,
        isActive: student.is_active,
      });
    }

    await prisma.$disconnect();
    res.json({
      found: false,
      message: "User not found",
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Test login failed",
      message: error.message,
    });
  }
});

export default router;
