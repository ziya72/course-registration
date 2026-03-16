import { EncryptionService } from './src/utils/encryption';
import { JWTEncryptionService } from './src/utils/jwt-encryption';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test script to verify both API response and JWT payload encryption
 */

async function testEncryption() {
  console.log('🧪 Testing AES-256 Encryption Implementation\n');
  
  try {
    // Test API Response Encryption
    console.log('1. Testing API Response Encryption...');
    if (!EncryptionService.validateConfiguration()) {
      throw new Error('API Response encryption configuration is invalid');
    }
    console.log('✅ API Response encryption configuration valid\n');
    
    // Test JWT Payload Encryption
    console.log('2. Testing JWT Payload Encryption...');
    if (!JWTEncryptionService.validateConfiguration()) {
      throw new Error('JWT Payload encryption configuration is invalid');
    }
    console.log('✅ JWT Payload encryption configuration valid\n');
    
    // Test JWT payload encryption/decryption
    console.log('3. Testing JWT Payload Values...');
    const testEmail = 'student@example.com';
    const testId = 'STU123456';
    
    const encryptedEmail = JWTEncryptionService.encryptPayloadValue(testEmail);
    const encryptedId = JWTEncryptionService.encryptPayloadValue(testId);
    
    console.log(`   Original Email: ${testEmail}`);
    console.log(`   Encrypted Email: ${encryptedEmail.substring(0, 20)}...`);
    
    console.log(`   Original ID: ${testId}`);
    console.log(`   Encrypted ID: ${encryptedId.substring(0, 20)}...`);
    
    const decryptedEmail = JWTEncryptionService.decryptPayloadValue(encryptedEmail);
    const decryptedId = JWTEncryptionService.decryptPayloadValue(encryptedId);
    
    console.log(`   Decrypted Email: ${decryptedEmail}`);
    console.log(`   Decrypted ID: ${decryptedId}`);
    
    const emailMatch = testEmail === decryptedEmail;
    const idMatch = testId === decryptedId;
    
    console.log(`   Email Match: ${emailMatch ? '✅' : '❌'}`);
    console.log(`   ID Match: ${idMatch ? '✅' : '❌'}\n`);
    
    if (!emailMatch || !idMatch) {
      throw new Error('JWT payload encryption/decryption failed');
    }
    
    // Test full JWT payload encryption
    console.log('4. Testing Full JWT Payload...');
    const testPayload = {
      enrollmentNo: 'STU123456',
      role: 'student',
      email: 'student@example.com',
      id: 'STU123456'
    };
    
    const encryptedPayload = JWTEncryptionService.createEncryptedPayload(testPayload);
    const decryptedPayload = JWTEncryptionService.decryptPayload(encryptedPayload);
    
    console.log('   Original Payload:', testPayload);
    console.log('   Encrypted Payload:', {
      ...encryptedPayload,
      email: encryptedPayload.email.substring(0, 20) + '...',
      id: encryptedPayload.id.substring(0, 20) + '...'
    });
    console.log('   Decrypted Payload:', decryptedPayload);
    
    const payloadMatch = JSON.stringify(testPayload) === JSON.stringify(decryptedPayload);
    console.log(`   Payload Match: ${payloadMatch ? '✅' : '❌'}\n`);
    
    if (!payloadMatch) {
      throw new Error('Full JWT payload encryption/decryption failed');
    }
    
    console.log('🎉 All encryption tests passed!');
    console.log('📝 JWT tokens will now have encrypted email and id fields');
    
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    process.exit(1);
  }
}

testEncryption();