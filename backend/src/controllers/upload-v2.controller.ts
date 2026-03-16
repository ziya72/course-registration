// Enhanced Upload Controller with Analytics and Progress Tracking
import { Request, Response } from "express";
import {
  previewCSVByType,
  processCSVUpload,
  UploadType,
} from "../services/csv-upload-v2.service";

/**
 * Preview CSV before upload with enhanced validation
 * POST /api/admin/upload/v2/preview
 * Body: { uploadType: "students" | "results" | "courses" }
 */
export const previewCSVV2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uploadType } = req.body as { uploadType: UploadType };

    if (!uploadType || !["students", "results", "courses"].includes(uploadType)) {
      res.status(400).json({
        error: "Invalid upload type",
        message: "uploadType must be 'students', 'results', or 'courses'"
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ 
        error: "No file uploaded",
        message: "Please select a CSV file to upload"
      });
      return;
    }

    console.log(`🔍 Previewing ${uploadType} CSV: ${req.file.originalname}`);

    const csvContent = req.file.buffer.toString("utf-8");
    const result = await previewCSVByType(csvContent, uploadType);

    res.json({
      message: "CSV preview generated successfully",
      ...result,
      fileInfo: {
        name: req.file.originalname,
        size: `${(req.file.size / 1024).toFixed(1)} KB`,
        uploadType
      }
    });
  } catch (error: any) {
    console.error("❌ CSV preview error:", error);
    res.status(500).json({
      error: "Failed to preview CSV",
      message: error.message,
    });
  }
};

/**
 * Enhanced CSV Upload with Analytics and Progress Tracking
 * POST /api/admin/upload/v2/process
 * Body: { uploadType: "students" | "results" | "courses" }
 */
export const uploadCSVV2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uploadType } = req.body as { uploadType: UploadType };

    if (!uploadType || !["students", "results", "courses"].includes(uploadType)) {
      res.status(400).json({
        error: "Invalid upload type",
        message: "uploadType must be 'students', 'results', or 'courses'"
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ 
        error: "No file uploaded",
        message: "Please select a CSV file to upload"
      });
      return;
    }

    // Extract user info from authenticated request
    const uploadedBy = (req as any).user?.enrollment_no || (req as any).user?.email || "UNKNOWN";

    console.log("📄 Upload type:", uploadType);
    console.log("📄 File:", req.file.originalname, `(${(req.file.size / 1024).toFixed(2)} KB)`);
    console.log("👤 Uploaded by:", uploadedBy);

    const csvContent = req.file.buffer.toString("utf-8");
    const startTime = Date.now();
    
    const result = await processCSVUpload(
      csvContent, 
      uploadType,
      req.file.size,
      req.file.originalname,
      uploadedBy
    );
    
    const processingTime = Date.now() - startTime;

    console.log("✅ Upload complete:", result.inserted);

    // Enhanced analytics response
    const totalRecords = result.inserted.created + result.inserted.updated + result.inserted.failed;
    const successRate = totalRecords > 0 ? ((result.inserted.created + result.inserted.updated) / totalRecords * 100).toFixed(1) : 0;
    const recordsPerSecond = processingTime > 0 ? Math.round((result.inserted.created + result.inserted.updated) / (processingTime / 1000)) : 0;
    const batchCount = Math.ceil(totalRecords / 50); // Assuming batch size of 50
    const avgBatchTime = batchCount > 0 ? Math.round(processingTime / batchCount) : 0;

    const analytics = {
      totalRecords,
      processingTimeMs: processingTime,
      processingTimeSeconds: (processingTime / 1000).toFixed(1),
      recordsPerSecond,
      successRate: `${successRate}%`,
      batchCount,
      avgBatchTimeMs: avgBatchTime,
      fileSize: `${(req.file.size / 1024).toFixed(1)} KB`,
      fileName: req.file.originalname,
      uploadedBy,
      timestamp: new Date().toISOString(),
      uploadType
    };

    // If there are errors, include the error CSV in response
    if (!result.success && result.errors.length > 0) {
      res.status(207).json({
        message: "Partial success - some records failed",
        ...result,
        hasErrorCSV: !!result.errorCSV,
        analytics
      });
      return;
    }

    res.json({
      message: "CSV uploaded and processed successfully",
      ...result,
      hasErrorCSV: false,
      analytics
    });
  } catch (error: any) {
    console.error("❌ CSV upload error:", error);
    res.status(500).json({
      error: "Failed to process CSV",
      message: error.message,
    });
  }
};

/**
 * Download error CSV from last upload
 * POST /api/admin/upload/v2/download-errors
 * Body: { errorCSV: string }
 */
export const downloadErrorCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const { errorCSV } = req.body;

    if (!errorCSV) {
      res.status(400).json({
        error: "No error CSV data provided",
        message: "errorCSV field is required"
      });
      return;
    }

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="upload-errors.csv"');
    
    res.send(errorCSV);
  } catch (error: any) {
    console.error("❌ Error CSV download error:", error);
    res.status(500).json({
      error: "Failed to download error CSV",
      message: error.message,
    });
  }
};