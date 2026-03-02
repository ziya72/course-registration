// src/middlewares/auth.middleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole, JwtPayload, AuthUser } from "../auth/auth.types";
import { isTokenBlacklisted } from "../auth/auth.utils";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

/* ================= EXTEND EXPRESS REQUEST ================= */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/* ================= AUTHENTICATION MIDDLEWARE ================= */

/**
 * Verifies JWT token and attaches user info to request
 * Use this for any protected route
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Check if token is blacklisted (logged out)
    if (isTokenBlacklisted(token)) {
      res.status(401).json({ error: "Token has been revoked" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Attach user info to request
    if ("enrollmentNo" in decoded) {
      // Student token
      req.user = {
        enrollmentNo: decoded.enrollmentNo,
        role: "student",
      };
    } else if ("teacherId" in decoded) {
      // Teacher/Admin token
      req.user = {
        teacherId: decoded.teacherId,
        role: decoded.role as UserRole,
      };
    } else {
      res.status(401).json({ error: "Invalid token format" });
      return;
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    res.status(500).json({ error: "Authentication failed" });
  }
}

/* ================= ROLE-BASED AUTHORIZATION ================= */

/**
 * Role hierarchy:
 * - admin: Can access admin, teacher, and student routes (superset)
 * - teacher: Can access teacher and student routes
 * - student: Can only access student routes
 */

/**
 * Checks if user has required role or higher privilege
 */
function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    student: 1,
    teacher: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Middleware factory for role-based access control
 * @param allowedRoles - Array of roles that can access the route
 * 
 * @example
 * // Only students can access
 * router.get('/my-courses', authenticate, authorize(['student']), ...)
 * 
 * // Teachers and admins can access
 * router.get('/all-students', authenticate, authorize(['teacher', 'admin']), ...)
 * 
 * // Only admins can access
 * router.post('/create-teacher', authenticate, authorize(['admin']), ...)
 */
export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const userRole = req.user.role;

    // Check if user has any of the allowed roles (considering hierarchy)
    const hasAccess = allowedRoles.some((role) =>
      hasRequiredRole(userRole, role)
    );

    if (!hasAccess) {
      res.status(403).json({
        error: "Access denied",
        message: `This route requires one of the following roles: ${allowedRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
}

/* ================= CONVENIENCE MIDDLEWARE ================= */

/**
 * Ensures only students can access
 * Admin and teachers are NOT allowed
 */
export function studentOnly(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.user.role !== "student") {
    res.status(403).json({
      error: "Access denied",
      message: "This route is only accessible to students",
    });
    return;
  }

  next();
}

/**
 * Ensures only teachers can access
 * Admins CAN access (admin is superset of teacher)
 */
export function teacherOnly(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!hasRequiredRole(req.user.role, "teacher")) {
    res.status(403).json({
      error: "Access denied",
      message: "This route requires teacher or admin privileges",
    });
    return;
  }

  next();
}

/**
 * Ensures only admins can access
 * Teachers and students are NOT allowed
 */
export function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      error: "Access denied",
      message: "This route is only accessible to administrators",
    });
    return;
  }

  next();
}

/**
 * Ensures user can only access their own resources
 * For students: checks enrollmentNo
 * For teachers/admins: allows access to all
 */
export function ownerOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Admins and teachers can access any resource
  if (req.user.role === "admin" || req.user.role === "teacher") {
    next();
    return;
  }

  // Students can only access their own resources
  const enrollmentNo = req.params.enrollmentNo || req.body.enrollmentNo;

  if (!enrollmentNo) {
    res.status(400).json({
      error: "Enrollment number required",
    });
    return;
  }

  if (req.user.enrollmentNo !== enrollmentNo) {
    res.status(403).json({
      error: "Access denied",
      message: "You can only access your own resources",
    });
    return;
  }

  next();
}
