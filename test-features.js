const axios = require('axios');

async function testFeatureImportance() {
    try {
        console.log('🧪 Testing Feature Importance Endpoint...\n');
        
        // Test ML API directly first
        console.log('1️⃣ Testing ML API directly...');
        try {
            const mlResponse = await axios.get('http://localhost:8000/feature-importance', { timeout: 3000 });
            console.log('✅ ML API Status:', mlResponse.status);
            console.log('📊 ML API Response Type:', typeof mlResponse.data);
            console.log('🔑 ML API Keys:', Object.keys(mlResponse.data || {}));
            
            if (mlResponse.data && mlResponse.data.feature_importance) {
                console.log('📈 Features Count:', mlResponse.data.feature_importance.length);
                console.log('🎯 Sample Feature:', mlResponse.data.feature_importance[0]);
            }
        } catch (mlError) {
            console.log('❌ ML API Error:', mlError.message);
        }
        
        console.log('\n2️⃣ Testing Backend Dashboard Endpoint...');
        
        // Test backend endpoint without auth (should return fallback data)
        try {
            const backendResponse = await axios.get('http://localhost:5000/api/dashboard/ml-features', { 
                timeout: 5000,
                validateStatus: () => true // Accept all status codes
            });
            
            console.log('📡 Backend Status:', backendResponse.status);
            
            if (backendResponse.status === 401) {
                console.log('🔒 Authentication required (expected)');
                console.log('💡 This means the endpoint is working but needs a valid token');
            } else if (backendResponse.status === 200) {
                console.log('✅ Backend Response Type:', typeof backendResponse.data);
                console.log('📊 Features Count:', backendResponse.data?.length || 0);
                if (backendResponse.data && backendResponse.data.length > 0) {
                    console.log('🎯 Sample Feature:', backendResponse.data[0]);
                }
            } else {
                console.log('⚠️ Unexpected status:', backendResponse.status);
                console.log('📝 Response:', backendResponse.data);
            }
        } catch (backendError) {
            console.log('❌ Backend Error:', backendError.message);
        }
        
        console.log('\n🎯 Summary:');
        console.log('- ML API should be running on port 8000');
        console.log('- Backend should be running on port 5000');
        console.log('- Feature importance endpoint should return fallback data even if ML API fails');
        console.log('- Frontend needs valid authentication token to access the data');
        
    } catch (error) {
        console.error('💥 Test Error:', error.message);
    }
}

testFeatureImportance();
