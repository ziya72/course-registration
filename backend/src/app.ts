//app.ts
 
import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes";
import studentRoutes from "./routes/student.routes";
import courseRoutes from "./routes/course.routes";
import teacherRoutes from "./routes/teacher.routes";
import uploadRoutes from "./routes/upload.routes";
import registrationControlRoutes from "./routes/registration-control.routes";

const app = express();

// CORS Configuration - Expanded for file uploads
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:8081"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

console.log("Mounting routes...");

// Health check route
app.get("/test", (req, res) => {
  res.json({ message: "Server is running" });
});

// Mount routes
app.use("/api/auth", authRoutes);
console.log("Auth routes mounted at /api/auth");

app.use("/api/student", studentRoutes);
console.log("Student routes mounted at /api/student");

app.use("/api/courses", courseRoutes);
console.log("Course routes mounted at /api/courses");

app.use("/api/teacher", teacherRoutes);
console.log("Teacher routes mounted at /api/teacher");

app.use("/api/admin/upload", uploadRoutes);
console.log("Upload routes mounted at /api/admin/upload");
console.log("  POST /api/admin/upload/csv");
console.log("  POST /api/admin/upload/preview");
console.log("  GET /api/admin/upload/test");

app.use("/api/registration-control", registrationControlRoutes);
console.log("Registration Control routes mounted at /api/registration-control");

// 404 handler - must be after all routes
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ Global error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export default app;
