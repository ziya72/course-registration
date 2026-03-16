#!/usr/bin/env python3
"""
Test decryption script to verify AES-256-CBC decryption
This matches the backend Node.js implementation exactly
"""

from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import json

# Configuration (same as your .env)
ENCRYPTION_KEY = "MySecureEncryptionKey32CharLongX"  # 32 characters
ENCRYPTION_IV = "MySecureIV16Char"                   # 16 characters

# Test data from your login response
encrypted_data = "5da8515d8038ac80cab66a8ea2e62fcccb9c8a294c8f84a6b34f6a7a80ac5632329d6dc38774c9adf54cd3f1fffb2145902716151c8c9b87769c2a08db43b1b5b8284253fb7bc090d7c695e9815c40d3811a1c508ea47eed88b60224694713bdbdccf45816c9d4dc0ff38f4ffd6384a042c4f590d9b3883757fe667ab16677c607e8cc4360f013c055716175018381de9bec7c6eaddc60a57e583dee6c8db496efe57d7e27c6e4a17e2a0a95ccb042d7bb2de5ba9171e6b1fd6bee44bacdf36221efd84d5e8762d9f7a209c9076036b2ccfa76602acdbb025bc5a1617437e59889856bde2e670001a6df77696277c89a5548615353b62cd8a44fd5d2d2884a20a020a770fea5849f599859b8368cc3f6e7c9bca55ab57a2776a46b2dc1754963"

def test_decryption():
    print("🔧 Testing AES-256-CBC Decryption")
    print(f"Key: {ENCRYPTION_KEY} (length: {len(ENCRYPTION_KEY)})")
    print(f"IV: {ENCRYPTION_IV} (length: {len(ENCRYPTION_IV)})")
    print(f"Encrypted data length: {len(encrypted_data)}")
    print()
    
    try:
        # Convert key and IV to bytes (UTF-8 encoding like Node.js)
        key = ENCRYPTION_KEY.encode('utf-8')
        iv = ENCRYPTION_IV.encode('utf-8')
        
        print(f"Key bytes length: {len(key)}")
        print(f"IV bytes length: {len(iv)}")
        
        # Convert hex string to bytes
        encrypted_bytes = bytes.fromhex(encrypted_data)
        print(f"Encrypted bytes length: {len(encrypted_bytes)}")
        
        # Create AES cipher
        cipher = AES.new(key, AES.MODE_CBC, iv)
        
        # Decrypt
        decrypted_padded = cipher.decrypt(encrypted_bytes)
        print(f"Decrypted padded length: {len(decrypted_padded)}")
        
        # Remove PKCS7 padding
        decrypted = unpad(decrypted_padded, AES.block_size)
        
        # Convert to string
        decrypted_string = decrypted.decode('utf-8')
        print(f"Decrypted string length: {len(decrypted_string)}")
        print()
        
        # Try to parse as JSON
        try:
            decrypted_json = json.loads(decrypted_string)
            print("✅ Decryption successful!")
            print("📄 Decrypted JSON:")
            print(json.dumps(decrypted_json, indent=2))
        except json.JSONDecodeError:
            print("✅ Decryption successful (not JSON)!")
            print("📄 Decrypted string:")
            print(decrypted_string)
            
    except Exception as e:
        print(f"❌ Decryption failed: {e}")
        print(f"Error type: {type(e).__name__}")

if __name__ == "__main__":
    test_decryption()