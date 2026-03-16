// Test utility for encryption/decryption functionality
import { decryptData, processApiResponse, isEncryptionEnabled } from './encryption';

/**
 * Test the decryption functionality with sample data
 */
export const testDecryption = () => {
  console.log('🧪 Testing encryption functionality...');
  
  // Check if encryption is enabled
  console.log('Encryption enabled:', isEncryptionEnabled());
  
  // Test with sample encrypted response format
  const sampleEncryptedResponse = {
    encrypted: true,
    data: "c15e53949904089b15579cdbb0f22964b345ddf763e5db8affdfe0abc3e5bef443e6f0930b7848da3f7f3e42992d04b4",
    timestamp: "2026-03-14T16:26:12.077Z"
  };
  
  // Test with unencrypted response
  const sampleUnencryptedResponse = {
    message: "Login successful",
    user: { name: "Test User", email: "test@example.com" }
  };
  
  try {
    // Test processing encrypted response
    console.log('Testing encrypted response processing...');
    const decryptedResult = processApiResponse(sampleEncryptedResponse);
    console.log('Decrypted result:', decryptedResult);
  } catch (error) {
    console.log('Expected error for sample data:', error);
  }
  
  try {
    // Test processing unencrypted response
    console.log('Testing unencrypted response processing...');
    const unencryptedResult = processApiResponse(sampleUnencryptedResponse);
    console.log('Unencrypted result:', unencryptedResult);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};