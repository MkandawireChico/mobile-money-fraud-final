

const axios = require('axios');

module.exports = () => {

    const getSystemHealth = async (req, res, next) => {
        try {

            // Health check for ML API
            let mlServiceStatus = 'unknown';
            try {
                await axios.get('http://localhost:8000/health');
                mlServiceStatus = 'active';
            } catch (error) {
                mlServiceStatus = 'down';
                console.warn('[SystemController] ML API health check failed:', error.message);
            }

            const healthStatus = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                ml_service_status: mlServiceStatus,
                server_uptime: process.uptime(), // Uptime in seconds
                error_rate: 0.005 // Placeholder; could be calculated from logs
            };

            res.status(200).json(healthStatus);
        } catch (error) {
            console.error('[SystemController] Error fetching system health:', error.message, error.stack);
            next(error);
        }
    };

    return {
        getSystemHealth
    };
};