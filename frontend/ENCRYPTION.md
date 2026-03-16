# Frontend Encryption Implementation

This document explains the encryption/decryption implementation for API responses in the frontend.

## Overview

The frontend now supports automatic decryption of encrypted API responses using AES-256-CBC encryption.

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# AES-256 Encryption Configuration
VITE_ENABLE_ENCRYPTION=true
VITE_ENCRYPTION_KEY=MySecureEncryptionKey32CharLongX
VITE_ENCRYPTION_IV=MySecureIV16Char
```

**Important Notes:**
- `VITE_ENCRYPTION_KEY` must be exactly 32 characters long
- `VITE_ENCRYPTION_IV` must be exactly 16 characters long
- Set `VITE_ENABLE_ENCRYPTION=false` to disable encryption processing

## API Response Format

### Encrypted Response
```json
{
  "encrypted": true,
  "data": "c15e53949904089b15579cdbb0f22964b345ddf763e5db8affdfe0abc3e5bef443e6f0930b7848da3f7f3e42992d04b4",
  "timestamp": "2026-03-14T16:26:12.077Z"
}
```

### Unencrypted Response
```json
{
  "message": "Login successful",
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## How It Works

1. **Automatic Detection**: The response interceptor automatically detects encrypted responses by checking for `encrypted: true`
2. **Decryption**: If encrypted, the `data` field is decrypted using AES-256-CBC
3. **Fallback**: If decryption fails or encryption is disabled, the original response is returned
4. **Transparency**: All existing API functions work without modification

## Files Modified

- `src/utils/encryption.ts` - Core encryption utilities
- `src/services/api.ts` - Updated response interceptor
- `.env` - Added encryption configuration
- `.env.example` - Added encryption template
- `.env.production` - Added production encryption config

## Security Considerations

- Encryption keys should be different for each environment
- Keys should be stored securely (environment variables, not in code)
- The IV (Initialization Vector) should ideally be unique per message (backend responsibility)
- Consider key rotation policies for production environments

## Testing

Use `src/utils/encryptionTest.ts` to test the encryption functionality:

```typescript
import { testDecryption } from './utils/encryptionTest';
testDecryption(); // Run in browser console
```