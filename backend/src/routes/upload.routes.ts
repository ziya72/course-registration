//upload.routes.ts
 
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authenticate, adminOnly } from "../middlewares/auth.middleware";
import { uploadCSV, previewCSV } from "../controllers/upload.controller";
import { uploadCSVV2, previewCSVV2, downloadErrorCSV } from "../controllers/upload-v2.controller";

const router = Router();

// Test route to verify router is working
router.get("/test", (req, res) => {
  res.json({ message: "Upload routes are working!" });
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4.5 * 1024 * 1024, // 4.5MB limit (Vercel's request body limit)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

// Multer error handler middleware
const multerErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    console.error("❌ Multer error:", err.code, err.message);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ 
        error: "File too large", 
        message: "Maximum file size is 4.5MB (Vercel limit)" 
      });
    }
    return res.status(400).json({ 
      error: "File upload error", 
      message: err.message 
    });
  }
  
  if (err) {
    console.error("❌ Upload error:", err.message);
    return res.status(400).json({ 
      error: "Upload failed", 
      message: err.message 
    });
  }
  
  next();
};

// Request logging middleware
const logRequest = (req: Request, res: Response, next: NextFunction) => {
  console.log(`🔄 ${req.method} ${req.path}`);
  console.log("📋 Headers:", req.headers['content-type']);
  console.log("👤 User:", req.user ? `ID: ${req.user.enrollmentNo || req.user.teacherId} (${req.user.role})` : "Not authenticated");
  next();
};

// Admin-only routes with proper error handling
router.post(
  "/csv",
  logRequest,
  authenticate,
  adminOnly,
  upload.single("file"),
  multerErrorHandler,
  uploadCSV
);

router.post(
  "/preview",
  logRequest,
  authenticate,
  adminOnly,
  upload.single("file"),
  multerErrorHandler,
  previewCSV
);

// V2 endpoints with upload type support
router.post(
  "/v2/preview",
  logRequest,
  authenticate,
  adminOnly,
  upload.single("file"),
  multerErrorHandler,
  previewCSVV2
);

router.post(
  "/v2/process",
  logRequest,
  authenticate,
  adminOnly,
  upload.single("file"),
  multerErrorHandler,
  uploadCSVV2
);

router.post(
  "/v2/download-errors",
  logRequest,
  authenticate,
  adminOnly,
  downloadErrorCSV
);

export default router;
