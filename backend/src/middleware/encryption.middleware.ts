import { Request, Response, NextFunction } from 'express';
import { EncryptionService } from '../utils/encryption';

/**
 * Middleware to encrypt all API responses
 * This middleware intercepts the response and encrypts the JSON data before sending
 */
export const encryptionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store the original json method
  const originalJson = res.json;
  
  // Override the json method to encrypt data before sending
  res.json = function(data: any) {
    try {
      // Check if encryption is enabled and properly configured
      const encryptionEnabled = process.env.ENABLE_ENCRYPTION === 'true';
      
      if (!encryptionEnabled) {
        // If encryption is disabled, send data as normal
        return originalJson.call(this, data);
      }
      
      // Validate encryption configuration
      if (!EncryptionService.validateConfiguration()) {
        console.error('❌ Encryption configuration invalid, sending unencrypted response');
        return originalJson.call(this, data);
      }
      
      // Encrypt the response data
      const encryptedData = EncryptionService.encrypt(data);
      
      // Send encrypted response with metadata
      const encryptedResponse = {
        encrypted: true,
        data: encryptedData,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🔐 Response encrypted for ${req.method} ${req.path}`);
      return originalJson.call(this, encryptedResponse);
      
    } catch (error) {
      console.error('❌ Encryption middleware error:', error);
      
      // In case of encryption error, send original data with error flag
      const errorResponse = {
        encrypted: false,
        error: 'Encryption failed',
        data: data,
        timestamp: new Date().toISOString()
      };
      
      return originalJson.call(this, errorResponse);
    }
  };
  
  next();
};

/**
 * Middleware to decrypt request body if it's encrypted
 * This middleware checks if the request body contains encrypted data and decrypts it
 */
export const decryptionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if the request body indicates encrypted data
    if (req.body && req.body.encrypted === true && req.body.data) {
      console.log(`🔓 Decrypting request for ${req.method} ${req.path}`);
      
      // Decrypt the request data
      const decryptedData = EncryptionService.decrypt(req.body.data);
      
      // Replace the request body with decrypted data
      req.body = decryptedData;
      
      console.log(`✅ Request decrypted successfully for ${req.method} ${req.path}`);
    }
  } catch (error) {
    console.error('❌ Decryption middleware error:', error);
    return res.status(400).json({
      error: 'Failed to decrypt request data',
      message: 'Invalid encrypted data format'
    });
  }
  
  next();
};