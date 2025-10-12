const express = require('express');
const queryCache = require('../utils/queryCache');

module.exports = (authMiddleware) => {
    const router = express.Router();

    // Get query cache statistics
    router.get('/cache-stats', authMiddleware, (req, res) => {
        try {
            const stats = queryCache.getStats();
            res.json({
                cache: stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[Performance] Error getting cache stats:', error.message);
            res.status(500).json({ message: 'Error retrieving cache statistics' });
        }
    });

    // Clear query cache (admin only)
    router.post('/cache-clear', authMiddleware, (req, res) => {
        try {
            if (req.user?.role !== 'admin') {
                return res.status(403).json({ message: 'Admin access required' });
            }

            queryCache.clear();
            res.json({ 
                message: 'Cache cleared successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[Performance] Error clearing cache:', error.message);
            res.status(500).json({ message: 'Error clearing cache' });
        }
    });

    // Get system performance metrics
    router.get('/metrics', authMiddleware, (req, res) => {
        try {
            const memUsage = process.memoryUsage();
            const uptime = process.uptime();
            
            res.json({
                system: {
                    uptime: uptime,
                    memory: {
                        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
                        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
                        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
                        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
                    }
                },
                cache: queryCache.getStats(),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[Performance] Error getting metrics:', error.message);
            res.status(500).json({ message: 'Error retrieving performance metrics' });
        }
    });

    return router;
};
