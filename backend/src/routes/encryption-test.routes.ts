import express from 'express';
import { EncryptionService } from '../utils/encryption';
import { JWTEncryptionService } from '../utils/jwt-encryption';

const router = express.Router();

/**
 * Test endpoint to verify encryption functionality
 * GET /api/encryption-test/status
 */
router.get('/status', (req, res) => {
  const encryptionEnabled = process.env.ENABLE_ENCRYPTION === 'true';
  const configValid = EncryptionService.validateConfiguration();
  
  res.json({
    encryption: {
      enabled: encryptionEnabled,
      configured: configValid,
      algorithm: 'AES-256-CBC'
    },
    message: 'Encryption test endpoint',
    timestamp: new Date().toISOString(),
    testData: {
      numbers: [1, 2, 3, 4, 5],
      nested: {
        key: 'value',
        boolean: true,
        null: null
      }
    }
  });
});

/**
 * Test endpoint for encrypted request/response
 * POST /api/encryption-test/echo
 */
router.post('/echo', (req, res) => {
  res.json({
    message: 'Echo test successful',
    receivedData: req.body,
    timestamp: new Date().toISOString(),
    encryption: {
      enabled: process.env.ENABLE_ENCRYPTION === 'true',
      configured: EncryptionService.validateConfiguration()
    }
  });
});

/**
 * Manual encryption test endpoint
 * POST /api/encryption-test/manual
 */
router.post('/manual', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: 'Data field is required for manual encryption test'
      });
    }
    
    // Manually encrypt the data
    const encrypted = EncryptionService.encrypt(data);
    const decrypted = EncryptionService.decrypt(encrypted);
    
    res.json({
      message: 'Manual encryption test successful',
      original: data,
      encrypted: encrypted,
      decrypted: decrypted,
      matches: JSON.stringify(data) === JSON.stringify(decrypted),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Manual encryption test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test JWT encryption endpoint
 * GET /api/encryption-test/jwt-status
 */
router.get('/jwt-status', (req, res) => {
  const jwtEncryptionConfigured = JWTEncryptionService.validateConfiguration();
  
  res.json({
    jwtEncryption: {
      configured: jwtEncryptionConfigured,
      algorithm: 'AES-256-CBC'
    },
    message: 'JWT encryption test endpoint',
    timestamp: new Date().toISOString(),
    note: 'JWT payload email and id fields are encrypted'
  });
});

export default router;