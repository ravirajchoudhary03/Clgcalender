const axios = require('axios');

async function verify() {
  try {
    // Test login
    console.log('Testing login...');
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful, got token');
    
    // Test week classes endpoint
    console.log('\nTesting week classes API...');
    const weekRes = await axios.get('http://localhost:5001/api/attendance/classes/week?weekOffset=0', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Week classes API working: ${weekRes.data.length} classes found`);
    
    if (weekRes.data.length > 0) {
      console.log('\nSample classes:');
      weekRes.data.slice(0, 5).forEach(cls => {
        const date = new Date(cls.date).toDateString();
        console.log(`  ${date}: ${cls.subject?.name} ${cls.startTime}-${cls.endTime}`);
      });
    }
    
    console.log('\n🎉 Everything is working! Open http://localhost:5173 and login.');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Response:', err.response.data);
    }
  }
}

verify();
