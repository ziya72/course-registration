//upload.controller.ts

import { Request, Response } from "express";
import { parseCSV, processAndInsertData } from "../services/csv-upload.service";

/**
 * Upload and process CSV file
 * POST /api/admin/upload/csv
 */
export const uploadCSV = async (req: Request, res: Response): Promise<void> => {
  console.log("📤 Upload CSV endpoint hit!");
  console.log("📁 File received:", req.file ? "Yes" : "No");
  
  if (req.file) {
    console.log("📄 File details:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
    });
  }
  
  console.log("👤 User:", req.user ? `ID: ${req.user.enrollmentNo || req.user.teacherId} (${req.user.role})` : "Not authenticated");
  
  try {
    if (!req.file) {
      console.log("❌ No file in request");
      res.status(400).json({ 
        error: "No file uploaded",
        message: "Please select a CSV file to upload"
      });
      return;
    }

    // Read file content
    const csvContent = req.file.buffer.toString("utf-8");
    console.log("📄 CSV content length:", csvContent.length, "characters");
    console.log("📄 First 200 chars:", csvContent.substring(0, 200));

    // Parse CSV
    const { rows, format, errors: parseErrors } = await parseCSV(csvContent);
    console.log("✅ Parsed:", rows.length, "rows, format:", format);

    if (parseErrors.length > 0) {
      console.log("⚠️ Parse errors:", parseErrors.length);
      res.status(400).json({
        error: "CSV parsing failed",
        message: "The CSV file contains errors",
        details: parseErrors.slice(0, 10),
        totalErrors: parseErrors.length,
      });
      return;
    }

    if (rows.length === 0) {
      console.log("❌ No valid data in CSV");
      res.status(400).json({ 
        error: "No valid data found in CSV",
        message: "The CSV file appears to be empty or has no valid rows"
      });
      return;
    }

    // Process and insert data
    console.log("🔄 Processing and inserting data...");
    const result = await processAndInsertData(rows);
    console.log("✅ Insert complete:", result.inserted);

    if (!result.success && result.errors.length > 0) {
      console.log("⚠️ Partial success with errors:", result.errors.length);
      res.status(207).json({
        message: "Partial success - some records failed",
        inserted: result.inserted,
        errors: result.errors.slice(0, 10),
        totalErrors: result.errors.length,
      });
      return;
    }

    console.log("🎉 Upload successful!");
    res.json({
      message: "CSV uploaded and processed successfully",
      format,
      inserted: result.inserted,
      totalRows: rows.length,
    });
  } catch (error: any) {
    console.error("❌ CSV upload error:", error);
    res.status(500).json({
      error: "Failed to process CSV",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const previewCSV = async (req: Request, res: Response): Promise<void> => {
  console.log("👁️ Preview CSV endpoint hit!");
  console.log("📁 File received:", req.file ? "Yes" : "No");
  
  if (req.file) {
    console.log("📄 File details:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
    });
  }
  
  try {
    if (!req.file) {
      console.log("❌ No file in request");
      res.status(400).json({ 
        error: "No file uploaded",
        message: "Please select a CSV file to preview"
      });
      return;
    }

    // Read file content
    const csvContent = req.file.buffer.toString("utf-8");
    console.log("📄 CSV content length:", csvContent.length, "characters");
    console.log("📄 First 200 chars:", csvContent.substring(0, 200));

    // Parse CSV
    const { rows, format, errors } = await parseCSV(csvContent);
    console.log("✅ Preview parsed:", rows.length, "rows, format:", format);
    
    if (errors.length > 0) {
      console.log("⚠️ Preview found errors:", errors.length);
    }

    res.json({
      format,
      totalRows: rows.length,
      preview: rows.slice(0, 10), // Show first 10 rows
      errors: errors.slice(0, 10), // Show first 10 errors
      totalErrors: errors.length,
    });
  } catch (error: any) {
    console.error("❌ CSV preview error:", error);
    res.status(500).json({
      error: "Failed to preview CSV",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
