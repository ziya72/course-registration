// Script to get auth token for testing
const fetch = require('node-fetch');

async function getAuthToken() {
  try {
    console.log('🔐 Getting auth token...\n');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@myamu.ac.in',
        password: 'admin123'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log(`🎫 Auth Token: ${result.token}`);
      console.log(`👤 User: ${result.user.name}`);
      console.log(`📧 Email: ${result.user.email}`);
      console.log(`🔑 Role: ${result.user.role}\n`);
      
      console.log('📋 Copy this token for testing:');
      console.log(`"${result.token}"`);
      
      return result.token;
    } else {
      console.error('❌ Login failed:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error getting token:', error.message);
    return null;
  }
}

getAuthToken();