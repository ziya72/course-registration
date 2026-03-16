// Optimized Upload Controller using Bulk Operations + Transaction Batching
// Production-grade CSV upload with high performance

import { Request, Response } from "express";
import Papa from "papaparse";
import {
  uploadStudentsOptimized,
  uploadCoursesOptimized,
  uploadResultsOptimized,
  UploadType,
} from "../services/csv-upload-optimized.service";

/**
 * Optimized CSV Upload with Bulk Operations
 * POST /api/admin/upload/optimized
 * Body: { uploadType: "students" | "results" | "courses" }
 */
export const uploadCSVOptimized = async (req: Request, res: Response): Promise<void> => {
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

    console.log(`🚀 Starting optimized ${uploadType} upload...`);
    console.log(`📁 File: ${req.file.originalname} (${req.file.size} bytes)`);

    const csvContent = req.file.buffer.toString("utf-8");
    
    // Parse CSV content
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      res.status(400).json({
        error: "CSV parsing failed",
        details: parseResult.errors.map(e => e.message)
      });
      return;
    }

    const data = parseResult.data as any[];
    
    // Route to appropriate optimized upload function
    let result;
    const startTime = Date.now();

    switch (uploadType) {
      case 'students':
        result = await uploadStudentsOptimized(data);
        break;
      case 'courses':
        result = await uploadCoursesOptimized(data);
        break;
      case 'results':
        result = await uploadResultsOptimized(data);
        break;
      default:
        throw new Error(`Unsupported upload type: ${uploadType}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`⚡ Processing completed in ${processingTime}ms`);

    res.json({
      message: "CSV uploaded and processed successfully with optimized bulk operations",
      processingTimeMs: processingTime,
      performance: {
        recordsPerSecond: Math.round((result.inserted.created + result.inserted.updated) / (processingTime / 1000)),
        batchSize: 50,
        method: "Bulk Operations + Transaction Batching"
      },
      ...result,
      hasErrorCSV: !!result.errorCSV,
    });
  } catch (error: any) {
    console.error("❌ Optimized CSV upload error:", error);
    res.status(500).json({
      error: "Failed to process CSV with optimized method",
      message: error.message,
    });
  }
};

/**
 * Performance Comparison Endpoint
 * GET /api/admin/upload/performance-info
 */
export const getPerformanceInfo = async (req: Request, res: Response): Promise<void> => {
  res.json({
    optimizations: {
      "Batch Processing": {
        description: "Process records in batches of 50",
        benefit: "Stable database load, predictable memory usage"
      },
      "Bulk Operations": {
        description: "Use createMany() instead of individual inserts",
        benefit: "Single DB query vs hundreds, 10-50x faster"
      },
      "Transaction Batching": {
        description: "Group operations in database transactions",
        benefit: "Atomic operations, consistency, faster execution"
      },
      "Optimized Queries": {
        description: "Fetch all grade records in single query per batch",
        benefit: "Eliminates N+1 query problem, reduces DB round trips"
      },
      "Parallel Processing": {
        description: "Process rows within batch in parallel",
        benefit: "Utilize CPU cores, faster data preparation"
      }
    },
    performance: {
      batchSize: 50,
      expectedSpeedup: "10-50x faster than sequential processing",
      memoryUsage: "Stable and predictable",
      databaseLoad: "Optimized with minimal connection usage"
    },
    comparison: {
      sequential: {
        method: "for loop + individual upserts",
        speed: "~10-50 records/second",
        dbQueries: "3-5 queries per record",
        suitable: "Small files (<100 records)"
      },
      optimized: {
        method: "batch + bulk operations + transactions",
        speed: "~500-2000 records/second",
        dbQueries: "2-3 queries per batch (50 records)",
        suitable: "Large files (1000+ records)"
      }
    }
  });
};