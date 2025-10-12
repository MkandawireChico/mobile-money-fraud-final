const express = require('express');
const axios = require('axios');
const { Sequelize, Op } = require('sequelize');

module.exports = (transactionModel, anomalyModel, auditLogModel, anomalyService, protect, authorize) => {
    const router = express.Router();

    // Middleware to protect all ML routes
    // router.use(protect); // Temporarily disabled for batch analysis

    // Read the ML prediction service URL from environment variables
    const ML_PREDICTION_SERVICE_BASE_URL = process.env.ML_PREDICTION_SERVICE_URL || 'http://localhost:8000';
    const fraudDetectionService = require('../services/FraudDetectionService')(anomalyService); // Use factory function with anomalyService

    async function logAudit(action, req, message, metadata, entityType, entityId) {
        try {
            await auditLogModel.create({
                action_type: action,
                user_id: req.user?.id || 'system',
                username: req.user?.name || req.user?.username || req.user?.email || 'System',
                description: message,
                details: metadata,
                entity_type: entityType,
                entity_id: entityId,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('[ML Routes] Failed to log audit:', error.message);
        }
    }

    router.post('/predict-transaction', authorize(['admin', 'analyst']), async (req, res, next) => {
        try {

            const transactionData = req.body;

            if (!transactionData || !transactionData.transaction_id || !transactionData.amount || !transactionData.timestamp) {
                return res.status(400).json({ message: 'Missing essential transaction data for prediction.' });
            }

            // Map incoming transaction data to the format expected by the Python FastAPI service
            const mlInput = {
                amount: transactionData.amount,
                risk_score: transactionData.risk_score || 0.0,
                time_since_last_txn_sec: transactionData.time_since_last_transaction_seconds || 0,
                user_total_transactions: transactionData.user_total_transactions || 1,
                timestamp: transactionData.timestamp,
                location_city: transactionData.location_city || 'Unknown',
                transaction_type: transactionData.transaction_type || 'Unknown',
                device_type: transactionData.device_type || 'Unknown',
                os_type: transactionData.os_type || 'Unknown',
                status: transactionData.status || 'completed',
            };

            const predictionEndpoint = `${ML_PREDICTION_SERVICE_BASE_URL}/predict`;
            console.log(`[ML Routes] Sending data to ML service at ${predictionEndpoint}`, mlInput);
            const mlResponse = await axios.post(predictionEndpoint, mlInput);
            const { prediction, anomaly_score, is_anomaly } = mlResponse.data;

            let savedAnomaly = null;
            if (is_anomaly) {
                // Map anomaly_score to risk_score (0-1 range)
                const minExpectedAnomalyScore = -0.5;
                const maxExpectedAnomalyScore = 0.5;
                let finalRiskScore;

                if (anomaly_score <= minExpectedAnomalyScore) {
                    finalRiskScore = 0.99;
                } else if (anomaly_score >= maxExpectedAnomalyScore) {
                    finalRiskScore = 0.01;
                } else {
                    finalRiskScore = (maxExpectedAnomalyScore - anomaly_score) / (maxExpectedAnomalyScore - minExpectedAnomalyScore);
                    finalRiskScore = Math.max(0.01, Math.min(0.99, finalRiskScore));
                }

                if (finalRiskScore < 0.5) {
                    finalRiskScore = 0.5; // Ensure at least medium risk
                }

                const anomalyEntry = {
                    transaction_id: transactionData.transaction_id,
                    user_id: transactionData.user_id,
                    rule_name: 'ML_IsolationForest',
                    description: `ML model detected an anomaly with score: ${anomaly_score.toFixed(4)}.`,
                    severity: anomalyModel._deriveSeverityFromRisk(finalRiskScore),
                    status: 'open',
                    timestamp: new Date().toISOString(),
                    risk_score: finalRiskScore,
                    transaction_data: transactionData,
                    triggered_by: {
                        type: 'ML Model',
                        model: 'IsolationForest',
                        anomaly_score: anomaly_score,
                    },
                };
                savedAnomaly = await anomalyModel.create(anomalyEntry);

                await logAudit(
                    'ML_ANOMALY_DETECTED',
                    req,
                    `ML Model detected an anomaly for transaction ${transactionData.transaction_id} with score ${anomaly_score.toFixed(4)}.`,
                    { transactionId: transactionData.transaction_id, anomalyScore: anomaly_score, riskScore: finalRiskScore },
                    'Anomaly',
                    savedAnomaly.id
                );
            } else {

                await logAudit(
                    'ML_NORMAL_TRANSACTION',
                    req,
                    `ML Model classified transaction ${transactionData.transaction_id} as normal.`,
                    { transactionId: transactionData.transaction_id, anomalyScore: anomaly_score },
                    'Transaction',
                    transactionData.transaction_id
                );
            }

            res.status(200).json({
                message: 'Prediction successful',
                prediction_result: {
                    prediction_label: prediction,
                    anomaly_score: anomaly_score,
                    is_anomaly: is_anomaly,
                    recorded_anomaly: savedAnomaly ? { id: savedAnomaly.id, risk_score: savedAnomaly.risk_score } : null
                }
            });
        } catch (error) {
            console.error('[ML Routes] Error during ML prediction:', error.message, error.stack);
            if (error.response && error.response.data) {
                return next(new Error(`ML Service Error: ${error.response.data.detail || error.response.data.message}`));
            }
            next(new Error(`Prediction failed: ${error.message}`));
        }
    });

    router.get('/model-metrics', authorize(['admin', 'analyst', 'viewer']), async (req, res, next) => {
        try {
            const response = await axios.get(`${ML_PREDICTION_SERVICE_BASE_URL}/model-metrics`);
            res.status(200).json(response.data);
        } catch (error) {
            next(new Error(`Failed to fetch model metrics: ${error.message}`));
        }
    });

    router.get('/anomaly-distribution', authorize(['admin', 'analyst', 'viewer']), async (req, res, next) => {
        try {
            const { start_date, end_date } = req.query;
            const period = Math.round((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) || 30;
            const trends = await fraudDetectionService.getTransactionTrends('day', period);
            res.status(200).json(trends.map(t => ({ date: t.date, anomaly_count: t.anomaly_count })));
        } catch (error) {
            next(new Error(`Failed to fetch anomaly distribution: ${error.message}`));
        }
    });

    router.get('/feature-contributions/:transactionId', authorize(['admin', 'analyst', 'viewer']), async (req, res, next) => {
        try {
            const { transactionId } = req.params;
            const response = await axios.get(`${ML_PREDICTION_SERVICE_BASE_URL}/feature-contributions/${transactionId}`);
            res.status(200).json(response.data);
        } catch (error) {
            next(new Error(`Failed to fetch feature contributions: ${error.message}`));
        }
    });

    router.post('/batch-analyze', authorize(['admin', 'analyst']), async (req, res, next) => {
        const { start_date, end_date, page_size = 100, max_pages = 1000 } = req.body;

        if (!start_date || !end_date) {
            return res.status(400).json({ message: 'start_date and end_date are required.' });
        }

        // Respond immediately to indicate background processing has started
        res.status(202).json({ message: `Batch analysis started for ${start_date} to ${end_date}. This will run in the background.` });

        // Run batch analysis in the background
        (async () => {
            let currentPage = 0;
            let hasMore = true;
            let anomaliesCreated = 0;
            let transactionsProcessed = 0;

            try {
                while (hasMore && currentPage < max_pages) {

                    const transactions = await transactionModel.findAll({
                        where: {
                            timestamp: {
                                [Op.between]: [new Date(start_date), new Date(end_date)]
                            }
                        },
                        limit: page_size,
                        offset: currentPage * page_size,
                        order: [['timestamp', 'ASC']]
                    });

                    if (transactions.length === 0) {
                        hasMore = false;
                        continue;
                    }

                    for (const t of transactions) {
                        const txForML = {
                            transaction_id: t.transaction_id || t.id,
                            user_id: t.user_id,
                            amount: Number(t.amount),
                            timestamp: t.timestamp,
                            transaction_type: t.transaction_type || 'Unknown',
                            network_operator: t.telco_provider || 'Unknown',
                            device_type: t.device_type || 'Unknown',
                            location_city: t.location_city || 'Unknown',
                            location_country: t.location_country || 'Malawi',
                            transaction_day_of_week: t.transaction_day_of_week ?? null,
                            user_total_transactions: t.user_total_transactions ?? null,
                            user_total_amount_spent: t.user_total_amount_spent ? Number(t.user_total_amount_spent) : null,
                            account_age_days: null,
                            time_since_last_transaction_seconds: t.time_since_last_txn_sec || 0,
                            daily_transaction_count: null,
                            amount_percentile_for_user: null,
                            os_type: t.os_type || 'Unknown',
                            merchant_category: t.merchant_category || null,
                            status: t.status || 'completed',
                            is_weekend: null,
                            is_business_hours: null,
                            is_payday: null,
                            is_new_device: t.is_new_device ?? null,
                            is_new_location: t.is_new_location ?? null,
                        };

                        try {
                            const assessment = await fraudDetectionService.checkTransaction(txForML);
                            transactionsProcessed++;

                            if (assessment && assessment.is_anomaly) {
                                await anomalyModel.create({
                                    transaction_id: t.transaction_id || t.id,
                                    user_id: t.user_id,
                                    reason: assessment.reason || 'High risk score detected by ML model',
                                    risk_score: assessment.anomaly_score,
                                    timestamp: t.timestamp,
                                    details: assessment
                                });
                                anomaliesCreated++;

                                await logAudit(
                                    'ML_BATCH_ANOMALY_DETECTED',
                                    req,
                                    `Batch analysis detected anomaly for transaction ${t.transaction_id || t.id}.`,
                                    { transactionId: t.transaction_id || t.id, anomalyScore: assessment.anomaly_score },
                                    'Anomaly',
                                    t.transaction_id || t.id
                                );
                            }
                        } catch (mlError) {
                            console.error(`[ML Batch] Skipped a transaction due to ML error: ${mlError.message}`);
                        }
                    }
                    currentPage++;
                }

                const summary = `Batch analysis complete. Processed ${transactionsProcessed} transactions, created ${anomaliesCreated} anomalies.`;

                // Optionally log completion to audit log
                await logAudit(
                    'ML_BATCH_COMPLETED',
                    req,
                    summary,
                    { transactionsProcessed, anomaliesCreated, start_date, end_date },
                    'BatchAnalysis',
                    null
                );

            } catch (error) {
                console.error(`[ML Batch] A critical error occurred during background batch analysis: ${error.stack}`);
                await logAudit(
                    'ML_BATCH_ERROR',
                    req,
                    `Batch analysis failed: ${error.message}`,
                    { start_date, end_date, error: error.message },
                    'BatchAnalysis',
                    null
                );
            }
        })();
    });

    router.post('/test-anomaly', /* authorize(['admin', 'analyst']), */ async (req, res, next) => {
        try {
            const { transaction_id, user_id, amount, description } = req.body;

            if (!transaction_id) {
                return res.status(400).json({ message: 'transaction_id is required for testing.' });
            }

            // Create a test transaction object
            const testTransaction = {
                transaction_id: transaction_id || `test_${Date.now()}`,
                user_id: user_id || 'test_user',
                amount: amount || 1000,
                timestamp: new Date().toISOString(),
                transaction_type: 'transfer',
                device_type: 'mobile',
                location_city: 'Lilongwe',
                os_type: 'android',
                status: 'completed'
            };

            // Create anomaly directly using anomalyService
            const anomaly = await anomalyService.createAnomalyFromTransaction(testTransaction);

            if (anomaly) {
                await logAudit(
                    'TEST_ANOMALY_CREATED',
                    req,
                    `Test anomaly created for transaction ${testTransaction.transaction_id}.`,
                    { transactionId: testTransaction.transaction_id, testData: testTransaction },
                    'Anomaly',
                    anomaly.id
                );

                res.status(201).json({
                    message: 'Test anomaly created successfully',
                    anomaly: anomaly,
                    transaction: testTransaction
                });
            } else {
                res.status(200).json({
                    message: 'No anomaly was created (this is normal for the test)',
                    transaction: testTransaction
                });
            }
        } catch (error) {
            console.error('[ML Routes] Error creating test anomaly:', error.message, error.stack);
            next(new Error(`Test anomaly creation failed: ${error.message}`));
        }
    });

    router.post('/test-anomaly-open', async (req, res, next) => {
        try {

            const { transaction_id, user_id, amount, description } = req.body;

            if (!transaction_id) {
                return res.status(400).json({ message: 'transaction_id is required for testing.' });
            }

            // Create a test transaction object
            const testTransaction = {
                transaction_id: transaction_id || `test_${Date.now()}`,
                user_id: user_id || 'test_user',
                amount: amount || 1000,
                timestamp: new Date().toISOString(),
                transaction_type: 'transfer',
                device_type: 'mobile',
                location_city: 'Lilongwe',
                os_type: 'android',
                status: 'completed'
            };

            // Create anomaly directly using anomalyService
            const anomaly = await anomalyService.createAnomalyFromTransaction(testTransaction);

            if (anomaly) {
                // Create a mock request object for audit logging
                const mockReq = {
                    user: { id: 'test_system', username: 'test_system' },
                    ip: req.ip,
                    headers: req.headers
                };

                await logAudit(
                    'TEST_ANOMALY_CREATED_OPEN',
                    mockReq,
                    `Open test anomaly created for transaction ${testTransaction.transaction_id}.`,
                    { transactionId: testTransaction.transaction_id, testData: testTransaction },
                    'Anomaly',
                    anomaly.id
                );

                res.status(201).json({
                    success: true,
                    message: 'Test anomaly created successfully',
                    anomaly: anomaly,
                    transaction: testTransaction
                });
            } else {
                res.status(200).json({
                    success: true,
                    message: 'No anomaly was created (this is normal for the test)',
                    transaction: testTransaction
                });
            }
        } catch (error) {
            console.error('[ML Routes] Error creating open test anomaly:', error.message, error.stack);
            res.status(500).json({
                success: false,
                message: `Test anomaly creation failed: ${error.message}`,
                error: error.message
            });
        }
    });

    router.get('/chart-data', authorize(['admin', 'analyst', 'viewer']), async (req, res, next) => {
        try {

            const { interval = 'day', period = 30 } = req.query;
            const parsedPeriod = parseInt(period, 10);

            if (!['day', 'week', 'month', 'hour'].includes(interval)) {
                return res.status(400).json({ message: 'Invalid interval. Must be "day", "week", "month", or "hour".' });
            }

            // Get transaction trends with anomaly counts
            const transactionTrends = await fraudDetectionService.getTransactionTrends(interval, parsedPeriod);

            // Get recent transactions for volume chart
            const recentTransactions = await transactionModel.findAll({
                limit: 100,
                order: [['timestamp', 'DESC']],
                attributes: ['amount', 'timestamp', 'transaction_type', 'status']
            });

            // Get recent anomalies for anomaly chart
            const recentAnomalies = await anomalyModel.findAll({
                limit: 100,
                order: [['timestamp', 'DESC']],
                attributes: ['risk_score', 'timestamp', 'severity', 'status']
            });

            // Process data for charts
            const chartData = {
                transactionVolume: transactionTrends.map(trend => ({
                    date: trend.date,
                    count: trend.total_transactions,
                    amount: trend.total_amount || 0
                })),
                anomalyTrend: transactionTrends.map(trend => ({
                    date: trend.date,
                    count: trend.anomaly_count,
                    averageRisk: trend.average_risk_score || 0
                })),
                transactionsByType: await transactionModel.getTransactionTypeDistribution(parsedPeriod),
                anomaliesBySeverity: await anomalyModel.getAnomalySeverityDistribution(parsedPeriod),
                recentActivity: {
                    transactions: recentTransactions.slice(0, 10),
                    anomalies: recentAnomalies.slice(0, 10)
                },
                summary: {
                    totalTransactions: await transactionModel.countAll(),
                    totalAnomalies: await anomalyModel.countAllAnomalies(),
                    openAnomalies: await anomalyModel.getOpenAnomaliesCount(),
                    averageRiskScore: recentAnomalies.length > 0
                        ? (recentAnomalies.reduce((sum, a) => sum + a.risk_score, 0) / recentAnomalies.length).toFixed(3)
                        : 0
                }
            };

            await logAudit(
                'ML_CHART_DATA_FETCHED',
                req,
                `Chart data fetched for interval: ${interval}, period: ${parsedPeriod}`,
                { interval, period: parsedPeriod, dataPoints: Object.keys(chartData).length },
                'Dashboard',
                null
            );

            res.status(200).json({
                message: 'Chart data fetched successfully',
                interval,
                period: parsedPeriod,
                data: chartData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('[ML Routes] Error fetching chart data:', error.message, error.stack);
            next(new Error(`Failed to fetch chart data: ${error.message}`));
        }
    });

    return router;
};