# AES-256 Encryption Implementation

This document explains how to use the AES-256 encryption system implemented in the API.

## Overview

All API responses are now encrypted using AES-256-CBC encryption with permanent keys configured in the .env file.

## Configuration

The encryption keys are permanently set in your .env file:

```env
ENABLE_ENCRYPTION=true
ENCRYPTION_KEY=MySecureEncryptionKey32CharLong
ENCRYPTION_IV=MySecureIV16Char
```

## How It Works

### Response Encryption

When `ENABLE_ENCRYPTION=true`, all API responses are automatically encrypted:

**Original Response:**
```json
{
  "message": "Success",
  "data": { "id": 1, "name": "John" }
}
```

**Encrypted Response:**
```json
{
  "encrypted": true,
  "data": "a1b2c3d4e5f6...", // encrypted hex string
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Request Decryption

The API can also decrypt incoming encrypted requests:

**Encrypted Request:**
```json
{
  "encrypted": true,
  "data": "a1b2c3d4e5f6...", // encrypted hex string
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Testing the Implementation

### 1. Test Encryption Status

```bash
GET /api/encryption-test/status
```

### 2. Test Echo Endpoint

```bash
POST /api/encryption-test/echo
Content-Type: application/json

{
  "message": "Hello World",
  "data": { "test": true }
}
```

### 3. Run Encryption Test

```bash
npm run test-encryption
```

## Frontend Integration

### Using the Client Utilities

```typescript
import { handleEncryptedResponse, createEncryptedRequest } from './utils/client-encryption';

const ENCRYPTION_KEY = 'MySecureEncryptionKey32CharLong';
const ENCRYPTION_IV = 'MySecureIV16Char';

// Decrypting API responses
const response = await fetch('/api/some-endpoint');
const data = await response.json();
const decryptedData = handleEncryptedResponse(data, ENCRYPTION_KEY, ENCRYPTION_IV);

// Creating encrypted requests
const requestData = { username: 'john', password: 'secret' };
const encryptedRequest = createEncryptedRequest(requestData, ENCRYPTION_KEY, ENCRYPTION_IV);

await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(encryptedRequest)
});
```

## Disabling Encryption

To disable encryption temporarily:

```env
ENABLE_ENCRYPTION=false
```

The API will continue to work normally without encryption when disabled.