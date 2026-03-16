/**
 * Client-side encryption utilities
 * This file can be used by frontend applications to decrypt API responses
 * Note: In a real-world scenario, you might want to implement this in your frontend framework
 */

import crypto from 'crypto';

export class ClientEncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly ENCODING = 'hex';
  
  /**
   * Decrypts API response data
   * @param encryptedData - The encrypted string from API response
   * @param key - The encryption key (32 characters)
   * @param iv - The initialization vector (16 characters)
   * @returns Decrypted data
   */
  static decrypt(encryptedData: string, key: string, iv: string): any {
    try {
      if (key.length !== 32) {
        throw new Error('Encryption key must be exactly 32 characters long');
      }
      if (iv.length !== 16) {
        throw new Error('Encryption IV must be exactly 16 characters long');
      }
      
      const keyBuffer = Buffer.from(key, 'utf8');
      const ivBuffer = Buffer.from(iv, 'utf8');
      const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, ivBuffer);
      
      let decrypted = decipher.update(encryptedData, this.ENCODING, 'utf8');
      decrypted += decipher.final('utf8');
      
      // Try to parse as JSON
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Client decryption error:', error);
      throw new Error('Failed to decrypt response data');
    }
  }
  
  /**
   * Encrypts data for API requests
   * @param data - The data to encrypt
   * @param key - The encryption key (32 characters)
   * @param iv - The initialization vector (16 characters)
   * @returns Encrypted string
   */
  static encrypt(data: any, key: string, iv: string): string {
    try {
      if (key.length !== 32) {
        throw new Error('Encryption key must be exactly 32 characters long');
      }
      if (iv.length !== 16) {
        throw new Error('Encryption IV must be exactly 16 characters long');
      }
      
      const keyBuffer = Buffer.from(key, 'utf8');
      const ivBuffer = Buffer.from(iv, 'utf8');
      const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, ivBuffer);
      
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      let encrypted = cipher.update(dataString, 'utf8', this.ENCODING);
      encrypted += cipher.final(this.ENCODING);
      
      return encrypted;
    } catch (error) {
      console.error('Client encryption error:', error);
      throw new Error('Failed to encrypt request data');
    }
  }
}

/**
 * Helper function to handle encrypted API responses
 * @param response - The API response object
 * @param key - The encryption key
 * @param iv - The initialization vector
 * @returns Decrypted response data or original data if not encrypted
 */
export function handleEncryptedResponse(response: any, key: string, iv: string): any {
  if (response && response.encrypted === true && response.data) {
    return ClientEncryptionService.decrypt(response.data, key, iv);
  }
  return response;
}

/**
 * Helper function to create encrypted request payload
 * @param data - The data to encrypt
 * @param key - The encryption key
 * @param iv - The initialization vector
 * @returns Encrypted request payload
 */
export function createEncryptedRequest(data: any, key: string, iv: string): any {
  const encryptedData = ClientEncryptionService.encrypt(data, key, iv);
  return {
    encrypted: true,
    data: encryptedData,
    timestamp: new Date().toISOString()
  };
}