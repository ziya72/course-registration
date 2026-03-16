//app.ts
 
import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes";
import studentRoutes from "./routes/student.routes";
import courseRoutes from "./routes/course.routes";
import teacherRoutes from "./routes/teacher.routes";
import uploadRoutes from "./routes/upload.routes";
import uploadOptimizedRoutes from "./routes/upload-optimized.routes";
import registrationControlRoutes from "./routes/registration-control.routes";
import debugRoutes from "./routes/debug.routes";
import encryptionTestRoutes from "./routes/encryption-test.routes";
import { encryptionMiddleware, decryptionMiddleware } from "./middleware/encryption.middleware";
import { jwtDecryptMiddleware } from "./middleware/jwt-decrypt.middleware";
import { EncryptionService } from "./utils/encryption";
import { JWTEncryptionService } from "./utils/jwt-encryption";

const app = express();

// CORS Configuration - Expanded for file uploads
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:5173",
  "https://course-registration-new.netlify.app",
  "https://course-re-frontend.netlify.app",
  "https://velvety-treacle-871a56.netlify.app",
  process.env.FRONTEND_URL || "",
].filter(Boolean);

console.log("🔧 Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Encryption/Decryption middleware
app.use(decryptionMiddleware);
app.use(encryptionMiddleware);

// JWT decryption middleware (for extracting encrypted JWT payload)
app.use(jwtDecryptMiddleware);

// Validate encryption configuration on startup
if (process.env.ENABLE_ENCRYPTION === 'true') {
  if (EncryptionService.validateConfiguration()) {
    console.log("🔐 API Response encryption enabled and configured properly");
  } else {
    console.warn("⚠️  API Response encryption enabled but configuration invalid - responses will not be encrypted");
  }
} else {
  console.log("🔓 API Response encryption disabled");
}

// Validate JWT encryption configuration
if (JWTEncryptionService.validateConfiguration()) {
  console.log("🔐 JWT Payload encryption enabled and configured properly");
} else {
  console.warn("⚠️  JWT Payload encryption configuration invalid - JWT payloads will not be encrypted");
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

console.log("Mounting routes...");

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Course Registration API",
    status: "running",
    endpoints: {
      health: "/test",
      auth: "/api/auth",
      student: "/api/student",
      courses: "/api/courses",
      teacher: "/api/teacher",
      upload: "/api/admin/upload",
      uploadOptimized: "/api/admin/upload/optimized",
      registrationControl: "/api/registration-control",
      encryptionTest: "/api/encryption-test"
    }
  });
});

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

app.use("/api/admin/upload", uploadOptimizedRoutes);
console.log("Optimized Upload routes mounted at /api/admin/upload");
console.log("  POST /api/admin/upload/optimized (🚀 PRODUCTION-GRADE)");
console.log("  GET /api/admin/upload/performance-info");

app.use("/api/registration-control", registrationControlRoutes);
console.log("Registration Control routes mounted at /api/registration-control");

app.use("/api/debug", debugRoutes);
console.log("Debug routes mounted at /api/debug");

app.use("/api/encryption-test", encryptionTestRoutes);
console.log("Encryption test routes mounted at /api/encryption-test");

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
