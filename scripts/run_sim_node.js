const axios = require('axios');

(async () => {
  try {
    const loginResp = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'localadmin@example.com',
      password: 'Admin123!'
    }, { timeout: 10000 });

    const token = loginResp.data.token;
    console.log('Logged in, token length:', token ? token.length : 'none');

    const simResp = await axios.post('http://localhost:5001/api/transactions/simulate', { count: 3 }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 20000
    });

    console.log('Simulation response:');
    console.log(JSON.stringify(simResp.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('Error response:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
})();
