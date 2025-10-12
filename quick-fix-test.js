// Quick test to verify the fix is working
const axios = require('axios');

async function quickTest() {
    console.log('🚀 Quick Feature Importance Test\n');
    
    // Test if servers are running
    const tests = [
        { name: 'ML API', url: 'http://localhost:8000/health' },
        { name: 'Backend', url: 'http://localhost:5000/api/health' },
    ];
    
    for (const test of tests) {
        try {
            const response = await axios.get(test.url, { timeout: 2000 });
            console.log(`✅ ${test.name}: Running (Status: ${response.status})`);
        } catch (error) {
            console.log(`❌ ${test.name}: Not running (${error.message})`);
        }
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Make sure both servers are running');
    console.log('2. Open http://localhost:3000 in browser');
    console.log('3. Login and go to ML Performance page');
    console.log('4. Check browser console for detailed logs');
    console.log('5. Feature chart should show 10 bars with Malawi-specific features');
}

quickTest();
