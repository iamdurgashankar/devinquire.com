const axios = require('axios');

// Firebase Functions emulator endpoint
const FUNCTIONS_EMULATOR_URL = 'http://127.0.0.1:5005/devinquirecom/us-central1';

async function createAdminUser() {
  try {
    console.log('Calling createAdminUser Cloud Function...');
    
    const response = await axios.post(`${FUNCTIONS_EMULATOR_URL}/createAdminUser`, {
      email: 'admin@devinquire.com',
      password: '8763155488SIpu@'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error creating admin user:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the function
createAdminUser();