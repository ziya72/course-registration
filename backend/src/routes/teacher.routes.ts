import { Router } from "express";
import { TeacherController } from "../controllers/teacher.controller";
import { AdminController } from "../controllers/admin.controller";
import { authenticate, teacherOnly, adminOnly } from "../middlewares/auth.middleware";

const router = Router();

// ============================================================================
// TEACHER ROUTES (accessible by both teacher and admin)
// ============================================================================

// Dashboard
router.get("/dashboard", authenticate, teacherOnly, TeacherController.getDashboard);

// Student management
router.get("/students", authenticate, teacherOnly, TeacherController.getStudents);
router.put("/students/:enrollmentNo/status", authenticate, adminOnly, TeacherController.updateStudentStatus);

// Course viewing
router.get("/courses", authenticate, teacherOnly, TeacherController.getCourses);

// Approvals (admin only)
router.get("/approvals", authenticate, adminOnly, TeacherController.getApprovals);
router.post("/approvals/:id/approve", authenticate, adminOnly, TeacherController.approveRegistration);
router.post("/approvals/:id/reject", authenticate, adminOnly, TeacherController.rejectRegistration);

// Reports
router.get("/reports/stats", authenticate, teacherOnly, TeacherController.getStatistics);

// ============================================================================
// ADMIN ROUTES (accessible only by admin)
// ============================================================================

// Course management
router.get("/courses/check", authenticate, adminOnly, AdminController.checkCourseExists);
router.post("/courses", authenticate, adminOnly, AdminController.addCourse);
router.put("/courses/:courseCode", authenticate, adminOnly, AdminController.updateCourse);
router.delete("/courses/:courseCode", authenticate, adminOnly, AdminController.deleteCourse);

// Prerequisite management (admin only)
router.post("/courses/:courseCode/prerequisites", authenticate, adminOnly, AdminController.addPrerequisite);
router.put("/courses/:courseCode/prerequisites/:prerequisiteCode", authenticate, adminOnly, AdminController.updatePrerequisite);
router.delete("/courses/:courseCode/prerequisites/:prerequisiteCode", authenticate, adminOnly, AdminController.deletePrerequisite);

// Registration rules
router.get("/rules", authenticate, adminOnly, AdminController.getRules);
router.put("/rules/:ruleId", authenticate, adminOnly, AdminController.updateRule);

// Registration toggle
router.post("/registration/toggle", authenticate, adminOnly, AdminController.toggleRegistration);

export default router;
