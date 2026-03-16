import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly ENCODING = 'hex';
  
  private static getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    if (key.length !== 32) {
      throw new Error(`ENCRYPTION_KEY must be exactly 32 characters long, got ${key.length}`);
    }
    return Buffer.from(key, 'utf8');
  }
  
  private static getIV(): Buffer {
    const iv = process.env.ENCRYPTION_IV;
    if (!iv) {
      throw new Error('ENCRYPTION_IV environment variable is required');
    }
    if (iv.length !== 16) {
      throw new Error(`ENCRYPTION_IV must be exactly 16 characters long, got ${iv.length}`);
    }
    return Buffer.from(iv, 'utf8');
  }
  
  /**
   * Encrypts data using AES-256-CBC
   * @param data - The data to encrypt (will be JSON stringified)
   * @returns Encrypted string in hex format
   */
  static encrypt(data: any): string {
    try {
      const key = this.getKey();
      const iv = this.getIV();
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      
      // Convert data to JSON string if it's not already a string
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      let encrypted = cipher.update(dataString, 'utf8', this.ENCODING);
      encrypted += cipher.final(this.ENCODING);
      
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypts data using AES-256-CBC
   * @param encryptedData - The encrypted string in hex format
   * @returns Decrypted data (parsed as JSON if possible)
   */
  static decrypt(encryptedData: string): any {
    try {
      const key = this.getKey();
      const iv = this.getIV();
      
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      
      let decrypted = decipher.update(encryptedData, this.ENCODING, 'utf8');
      decrypted += decipher.final('utf8');
      
      // Try to parse as JSON, return as string if parsing fails
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Validates that encryption keys are properly configured
   * @returns boolean indicating if encryption is properly configured
   */
  static validateConfiguration(): boolean {
    try {
      this.getKey();
      this.getIV();
      return true;
    } catch (error) {
      console.error('Encryption configuration validation failed:', error);
      return false;
    }
  }
}