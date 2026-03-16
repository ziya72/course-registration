import CryptoJS from 'crypto-js';

// =============================================================================
// ENCRYPTION CONFIGURATION
// =============================================================================
const ENCRYPTION_ENABLED = import.meta.env.VITE_ENABLE_ENCRYPTION === 'true';
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || '';
const ENCRYPTION_IV = import.meta.env.VITE_ENCRYPTION_IV || '';

// Debug: Log encryption status (only in development)
if (import.meta.env.MODE === 'development') {
  console.log('🔐 Encryption enabled:', ENCRYPTION_ENABLED);
  console.log('🔐 Encryption key configured:', !!ENCRYPTION_KEY);
  console.log('🔐 Encryption IV configured:', !!ENCRYPTION_IV);
}

// =============================================================================
// ENCRYPTED RESPONSE INTERFACE
// =============================================================================
export interface EncryptedResponse {
  encrypted: boolean;
  data: string;
  timestamp: string;
}

// =============================================================================
// CLIENT ENCRYPTION SERVICE (Browser version of backend ClientEncryptionService)
// =============================================================================
export class ClientEncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly ENCODING = 'hex';

  /**
   * Decrypts API response data (matches backend ClientEncryptionService.decrypt exactly)
   * @param encryptedData - The encrypted string from API response (hex format)
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

      // Convert key and IV to WordArray (equivalent to Buffer.from(key, 'utf8'))
      const keyWordArray = CryptoJS.enc.Utf8.parse(key);
      const ivWordArray = CryptoJS.enc.Utf8.parse(iv);

      // Parse hex encrypted data
      const ciphertext = CryptoJS.enc.Hex.parse(encryptedData);

      // Create cipher params
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext
      });

      // Decrypt using AES-256-CBC
      const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Convert to UTF-8 string (equivalent to decipher.final('utf8'))
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption resulted in empty string');
      }

      // Try to parse as JSON (matches backend logic)
      try {
        const parsed = JSON.parse(decryptedString);
        return parsed;
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.error('❌ Client decryption error:', error);
      throw new Error('Failed to decrypt response data');
    }
  }

  /**
   * Encrypts data for API requests (matches backend ClientEncryptionService.encrypt exactly)
   * @param data - The data to encrypt
   * @param key - The encryption key (32 characters)
   * @param iv - The initialization vector (16 characters)
   * @returns Encrypted string in hex format
   */
  static encrypt(data: any, key: string, iv: string): string {
    try {
      if (key.length !== 32) {
        throw new Error('Encryption key must be exactly 32 characters long');
      }
      if (iv.length !== 16) {
        throw new Error('Encryption IV must be exactly 16 characters long');
      }

      const keyWordArray = CryptoJS.enc.Utf8.parse(key);
      const ivWordArray = CryptoJS.enc.Utf8.parse(iv);

      const dataString = typeof data === 'string' ? data : JSON.stringify(data);

      const encrypted = CryptoJS.AES.encrypt(dataString, keyWordArray, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Return as hex string (matches backend ENCODING = 'hex')
      return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.error('Client encryption error:', error);
      throw new Error('Failed to encrypt request data');
    }
  }
}
// =============================================================================
// HELPER FUNCTIONS (matches backend client encryption helpers)
// =============================================================================

/**
 * Helper function to handle encrypted API responses (matches backend handleEncryptedResponse)
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
 * Helper function to create encrypted request payload (matches backend createEncryptedRequest)
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

// =============================================================================
// LEGACY FUNCTIONS (for backward compatibility)
// =============================================================================

/**
 * Decrypt AES-256 encrypted data from API response (legacy function)
 * @param encryptedData - The encrypted data string from API (hex format)
 * @returns Decrypted data as parsed JSON object
 */
export const decryptData = (encryptedData: string): any => {
  if (!ENCRYPTION_ENABLED) {
    throw new Error('Encryption is not enabled');
  }

  if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
    throw new Error('Encryption key or IV not configured');
  }

  return ClientEncryptionService.decrypt(encryptedData, ENCRYPTION_KEY, ENCRYPTION_IV);
};

// =============================================================================
// RESPONSE PROCESSING FUNCTION
// =============================================================================
/**
 * Process API response - decrypt if encrypted, return as-is if not
 * @param response - Raw API response data
 * @returns Processed response data
 */
export const processApiResponse = (response: any): any => {
  // Skip encryption processing if disabled
  if (!ENCRYPTION_ENABLED) {
    return response;
  }
  
  // Check if response is encrypted
  if (response && typeof response === 'object' && response.encrypted === true) {
    try {
      // Use the ClientEncryptionService to decrypt (matches backend exactly)
      return handleEncryptedResponse(response, ENCRYPTION_KEY, ENCRYPTION_IV);
    } catch (error) {
      console.error('❌ Decryption failed, returning original response:', error);
      // Return original response if decryption fails
      return response;
    }
  }
  
  // Return unencrypted response as-is
  return response;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
/**
 * Check if encryption is enabled
 */
export const isEncryptionEnabled = (): boolean => {
  return ENCRYPTION_ENABLED;
};

/**
 * Validate encryption configuration
 */
export const validateEncryptionConfig = (): boolean => {
  if (!ENCRYPTION_ENABLED) return true;
  
  return !!(ENCRYPTION_KEY && ENCRYPTION_IV && 
           ENCRYPTION_KEY.length === 32 && 
           ENCRYPTION_IV.length === 16);
};

/**
 * Test decryption with sample data to verify configuration
 */
export const testEncryptionSetup = (): void => {
  // Only run tests in development mode
  if (import.meta.env.MODE !== 'development') {
    return;
  }
  
  console.log('🧪 Testing encryption setup...');
  console.log('Encryption enabled:', ENCRYPTION_ENABLED);
  console.log('Key configured:', !!ENCRYPTION_KEY);
  console.log('IV configured:', !!ENCRYPTION_IV);
  console.log('Key length:', ENCRYPTION_KEY.length);
  console.log('IV length:', ENCRYPTION_IV.length);
  console.log('Config valid:', validateEncryptionConfig());
  
  if (ENCRYPTION_ENABLED && validateEncryptionConfig()) {
    console.log('✅ Encryption configuration is valid');
    
    // Test with a simple known value to verify the setup
    try {
      console.log('🔧 Ready to decrypt backend responses using ClientEncryptionService');
    } catch (error) {
      console.error('❌ Test decryption failed:', error);
    }
  } else {
    console.warn('⚠️ Encryption configuration has issues');
  }
};

/**
 * Test with actual encrypted data from login response (development only)
 */
export const testActualData = (): void => {
  // Only run in development mode and don't expose actual encrypted data
  if (import.meta.env.MODE !== 'development') {
    return;
  }
  
  // Test removed for security - actual encrypted data should not be hardcoded
  console.log('🧪 Encryption test available in development mode');
};
/**
 * Create a test encryption function for debugging (matches backend exactly)
 * This is for testing purposes only - normally encryption happens on backend
 */
export const testEncrypt = (data: any): string => {
  if (!ENCRYPTION_ENABLED || !validateEncryptionConfig()) {
    throw new Error('Encryption not properly configured');
  }

  return ClientEncryptionService.encrypt(data, ENCRYPTION_KEY, ENCRYPTION_IV);
};