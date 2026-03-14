const API_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  try {
    console.log('Testing Registration...');
    const regRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: email,
        password: password
      })
    });
    const regData = await regRes.json();
    console.log('Registration Status:', regRes.status, regData);

    if (regRes.status !== 200) {
        console.error('Registration failed, skipping login test.');
        return;
    }

    console.log('Testing Login...');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status, loginData);
    
    if (loginData.token) {
        console.log('SUCCESS: Token received.');
    } else {
        console.log('FAILED: No token received.');
    }

  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

testAuth();
