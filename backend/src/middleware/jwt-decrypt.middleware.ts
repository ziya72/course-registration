import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTEncryptionService } from '../utils/jwt-encryption';

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Middleware to decrypt JWT payload values
 * This middleware extracts and decrypts the JWT token payload
 */
export const jwtDecryptMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without decryption
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return next(); // No token, continue
    }
    
    // Verify and decode the JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Decrypt the payload values
    const decryptedPayload = JWTEncryptionService.decryptPayload(decoded);
    
    // Add decrypted payload to request object for use in routes
    (req as any).jwtPayload = decryptedPayload;
    (req as any).originalJwtPayload = decoded; // Keep original for debugging
    
    console.log('🔓 JWT payload decrypted for:', decryptedPayload.email || 'unknown');
    
  } catch (error) {
    console.error('JWT decryption middleware error:', error);
    // Don't block the request, just log the error
  }
  
  next();
};

/**
 * Helper function to get decrypted JWT payload from request
 * @param req - Express request object
 * @returns Decrypted JWT payload or null
 */
export function getDecryptedJWTPayload(req: Request): any | null {
  return (req as any).jwtPayload || null;
}

/**
 * Helper function to get original (encrypted) JWT payload from request
 * @param req - Express request object
 * @returns Original JWT payload or null
 */
export function getOriginalJWTPayload(req: Request): any | null {
  return (req as any).originalJwtPayload || null;
}