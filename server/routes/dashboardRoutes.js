const express = require('express');

module.exports = (dashboardController, protect, authorize) => {
    const router = express.Router();

    const checkAdminAnalystRole = authorize(['admin', 'analyst']);
    const checkAllRoles = authorize(['admin', 'analyst', 'viewer']);

    router.use(protect);

    router.get(
        '/summary',
        checkAllRoles,
        dashboardController.getDashboardSummary
    );

    router.get(
        '/transactions-trend',
        checkAllRoles,
        dashboardController.getTransactionsTrend
    );

    router.get(
        '/anomaly-rate-trend',
        checkAllRoles,
        dashboardController.getAnomalyRateTrend
    );

    router.get(
        '/transaction-type-distribution',
        checkAllRoles,
        dashboardController.getTransactionTypeDistribution
    );

    router.get(
        '/anomaly-severity-distribution',
        checkAllRoles,
        dashboardController.getAnomalySeverityDistribution
    );

    router.get(
        '/top-locations',
        checkAllRoles,
        dashboardController.getTopLocations
    );

    router.get(
        '/transactions-anomaly-count-trend',
        checkAllRoles,
        dashboardController.getTransactionsAndAnomalyCountTrend
    );

    router.get(
        '/transactions-anomaly-count-trend/export-csv',
        checkAdminAnalystRole,
        dashboardController.exportTransactionsAndAnomalyCountTrendCSV
    );

    router.get(
        '/settings/rules',
        authorize(['admin']),
        dashboardController.getRulesSettings
    );


    router.get(
        '/metrics',
        checkAllRoles,
        dashboardController.getDashboardMetrics
    );

    router.get(
        '/realtime-metrics',
        checkAllRoles,
        dashboardController.getRealTimeMetrics
    );

    router.get(
        '/model-performance',
        checkAllRoles,
        dashboardController.getModelPerformanceHistory
    );

    router.get(
        '/detection-trends',
        checkAllRoles,
        dashboardController.getDetectionRateTrends
    );

    router.get(
        '/top-risk-factors',
        checkAllRoles,
        dashboardController.getTopRiskFactors
    );


    router.get(
        '/ml-metrics',
        checkAllRoles,
        dashboardController.getMLMetrics
    );

    router.get(
        '/ml-features',
        checkAllRoles,
        dashboardController.getMLFeatures
    );


    return router;
};