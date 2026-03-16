import crypto from 'crypto';

export class JWTEncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly ENCODING = 'hex';
  
  private static getKey(): Buffer {
    const key = process.env.JWT_PAYLOAD_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('JWT_PAYLOAD_ENCRYPTION_KEY environment variable is required');
    }
    if (key.length !== 32) {
      throw new Error(`JWT_PAYLOAD_ENCRYPTION_KEY must be exactly 32 characters long, got ${key.length}`);
    }
    return Buffer.from(key, 'utf8');
  }
  
  private static getIV(): Buffer {
    const iv = process.env.JWT_PAYLOAD_ENCRYPTION_IV;
    if (!iv) {
      throw new Error('JWT_PAYLOAD_ENCRYPTION_IV environment variable is required');
    }
    if (iv.length !== 16) {
      throw new Error(`JWT_PAYLOAD_ENCRYPTION_IV must be exactly 16 characters long, got ${iv.length}`);
    }
    return Buffer.from(iv, 'utf8');
  }
  
  /**
   * Encrypts JWT payload values using AES-256-CBC
   * @param data - The data to encrypt (string)
   * @returns Encrypted string in hex format
   */
  static encryptPayloadValue(data: string): string {
    try {
      const key = this.getKey();
      const iv = this.getIV();
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', this.ENCODING);
      encrypted += cipher.final(this.ENCODING);
      
      return encrypted;
    } catch (error) {
      console.error('JWT payload encryption error:', error);
      throw new Error('Failed to encrypt JWT payload value');
    }
  }
  
  /**
   * Decrypts JWT payload values using AES-256-CBC
   * @param encryptedData - The encrypted string in hex format
   * @returns Decrypted string
   */
  static decryptPayloadValue(encryptedData: string): string {
    try {
      const key = this.getKey();
      const iv = this.getIV();
      
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      
      let decrypted = decipher.update(encryptedData, this.ENCODING, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('JWT payload decryption error:', error);
      throw new Error('Failed to decrypt JWT payload value');
    }
  }
  
  /**
   * Validates that JWT encryption keys are properly configured
   * @returns boolean indicating if JWT encryption is properly configured
   */
  static validateConfiguration(): boolean {
    try {
      this.getKey();
      this.getIV();
      return true;
    } catch (error) {
      console.error('JWT encryption configuration validation failed:', error);
      return false;
    }
  }
  
  /**
   * Creates encrypted JWT payload with email and id fields encrypted
   * @param payload - The JWT payload object
   * @returns JWT payload with encrypted email and id fields
   */
  static createEncryptedPayload(payload: any): any {
    const encryptedPayload = { ...payload };
    
    // Encrypt email if present
    if (payload.email) {
      encryptedPayload.email = this.encryptPayloadValue(payload.email);
    }
    
    // Encrypt id if present (enrollment number)
    if (payload.id) {
      encryptedPayload.id = this.encryptPayloadValue(payload.id);
    }
    
    return encryptedPayload;
  }
  
  /**
   * Decrypts JWT payload values
   * @param payload - The JWT payload with encrypted fields
   * @returns JWT payload with decrypted email and id fields
   */
  static decryptPayload(payload: any): any {
    const decryptedPayload = { ...payload };
    
    // Decrypt email if present
    if (payload.email) {
      try {
        decryptedPayload.email = this.decryptPayloadValue(payload.email);
      } catch (error) {
        console.error('Failed to decrypt email in JWT payload');
      }
    }
    
    // Decrypt id if present
    if (payload.id) {
      try {
        decryptedPayload.id = this.decryptPayloadValue(payload.id);
      } catch (error) {
        console.error('Failed to decrypt id in JWT payload');
      }
    }
    
    return decryptedPayload;
  }
}