import { Router } from "express";
import { CourseController } from "../controllers/course.controller";
import { authenticate, studentOnly } from "../middlewares/auth.middleware";

const router = Router();

// Student course routes
router.get("/available", authenticate, studentOnly, CourseController.getAvailableCourses);
router.post("/register", authenticate, studentOnly, CourseController.registerCourse);
router.delete("/drop/:courseCode", authenticate, studentOnly, CourseController.dropCourse);
router.get("/enrolled", authenticate, studentOnly, CourseController.getEnrolledCourses);

export default router;
