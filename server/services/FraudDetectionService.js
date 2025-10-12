const axios = require('axios');
// Remove direct io import, rely on anomalyService for emissions
const { pgPool } = require('../config/db'); // Keep for potential future use, but avoid direct queries

class FraudDetectionService {
    constructor(anomalyService) {
        // API base URL for the FastAPI service (use env with sensible default)
        this.apiBaseUrl = process.env.ML_PREDICTION_SERVICE_URL || 'http://localhost:8000';
        this.anomalyService = anomalyService; // Inject anomalyService for integration
    }

    async checkTransaction(transactionData, createAnomaly = false) {
        try {
            // Step 1: Get an anomaly assessment from the ML API
            const assessment = await this.getMLAssessment(transactionData);

            // Step 2: Determine if the transaction is an anomaly based on the API threshold
            const isAnomaly = assessment.is_anomaly;

            // Step 3: Define the action based on the anomaly status
            const action = isAnomaly ? 'block' : 'allow';

            // Step 4: Optionally create anomaly if requested and anomaly is detected
            let createdAnomaly = null;
            if (isAnomaly && createAnomaly && this.anomalyService) {
                try {
                    const assessmentResult = {
                        risk_score: assessment.anomaly_score,
                        is_anomaly: isAnomaly,
                        timestamp: new Date().toISOString(),
                        model_version: assessment.model_version || '1.0',
                        action
                    };
                    createdAnomaly = await this.anomalyService.createAnomalyFromTransaction(
                        { ...transactionData, action },
                        assessmentResult
                    );
                    if (createdAnomaly) {
                        console.log(`Fraud alert created for transaction: ${transactionData.transaction_id}`);
                    }
                } catch (anomalyError) {
                    console.error('Error creating anomaly:', anomalyError.message);
                    // Don't fail the assessment if anomaly creation fails
                }
            }

            // Convert anomaly score to a proper probability (0-1 range)
            let probability = 0.0;
            if (assessment.confidence !== undefined) {
                // Use the confidence from ML API if available (already 0-1 range)
                probability = Math.min(1.0, Math.max(0.0, assessment.confidence));
            } else if (assessment.anomaly_score !== undefined) {
                // Convert anomaly score to probability
                // Anomaly scores are typically negative, more negative = higher anomaly probability
                const normalizedScore = Math.abs(assessment.anomaly_score);
                if (normalizedScore > 100) {
                    // Very large scores, normalize to 0-1 range
                    probability = Math.min(1.0, normalizedScore / 1000);
                } else {
                    // Smaller scores, use direct conversion
                    probability = Math.min(1.0, normalizedScore);
                }
            }
            
            // Ensure probability is in valid range
            probability = Math.min(1.0, Math.max(0.0, probability));

            // Return the assessment result
            return {
                is_anomaly: isAnomaly,
                risk_score: probability, // Now a proper probability (0-1)
                action,
                model_name: assessment.model_name || 'isolation_forest',
                model_version: assessment.model_version || '1.0',
                model_description: assessment.model_description || 'Isolation Forest - Isolates anomalies by randomly selecting features and split values',
                reason: isAnomaly ?
                    `${assessment.model_version === 'fallback_rules_v1.0' ? 'Rule-based' : 'ML model'} detected anomaly with probability ${(probability * 100).toFixed(1)}%` :
                    'Normal transaction',
                anomaly_score: assessment.anomaly_score,
                created_anomaly: createdAnomaly,
                risk_factors: assessment.risk_factors || []
            };
        } catch (error) {
            console.error('Error in checkTransaction:', error.message);
            throw new Error(`Fraud detection failed: ${error.message}`);
        }
    }

    async getMLAssessment(transaction) {
        try {

            console.log(`[FraudDetectionService] Transaction data:`, JSON.stringify(transaction, null, 2));

            const response = await axios.post(`${this.apiBaseUrl}/predict`, transaction, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000 // 10 second timeout
            });

            console.log(`[FraudDetectionService] ML API Response:`, JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error) {
            console.error('ML API Error Details:');
            console.error('- URL:', `${this.apiBaseUrl}/predict`);
            console.error('- Status:', error.response?.status);
            console.error('- Data:', error.response?.data);
            console.error('- Message:', error.message);

            // Fallback to rule-based assessment if ML API fails

            return this.getFallbackAssessment(transaction);
        }
    }

    getFallbackAssessment(transaction) {
        const amount = parseFloat(transaction.amount);
        const userTotalTransactions = parseInt(transaction.user_total_transactions) || 0;
        const userTotalAmountSpent = parseFloat(transaction.user_total_amount_spent) || 0;

        // Simple rule-based scoring
        let riskScore = 0.1; // Base risk
        let riskFactors = [];

        // High amount transactions
        if (amount > 50000) {
            riskScore += 0.3;
            riskFactors.push('High transaction amount');
        }

        // New users with high amounts
        if (userTotalTransactions < 5 && amount > 10000) {
            riskScore += 0.2;
            riskFactors.push('New user with high amount');
        }

        // Unusual amount for user
        if (userTotalTransactions > 0) {
            const avgAmount = userTotalAmountSpent / userTotalTransactions;
            if (amount > avgAmount * 3) {
                riskScore += 0.2;
                riskFactors.push('Amount significantly higher than user average');
            }
        }

        // Night transactions (assuming timestamp is available)
        if (transaction.timestamp) {
            const hour = new Date(transaction.timestamp).getHours();
            if (hour < 6 || hour > 22) {
                riskScore += 0.1;
                riskFactors.push('Transaction outside business hours');
            }
        }

        // New location
        if (transaction.is_new_location) {
            riskScore += 0.15;
            riskFactors.push('Transaction from new location');
        }

        // New device
        if (transaction.is_new_device) {
            riskScore += 0.1;
            riskFactors.push('Transaction from new device');
        }

        // Cap the risk score at 0.95
        riskScore = Math.min(riskScore, 0.95);

        const isAnomaly = riskScore > 0.5;

        return {
            prediction: isAnomaly ? "Anomaly Detected" : "Normal Transaction",
            anomaly_score: -riskScore, // Negative score to match ML API format
            is_anomaly: isAnomaly,
            threshold: -0.5,
            model_version: "fallback_rules_v1.0",
            risk_factors: riskFactors
        };
    }

    async getTransactionTrends(interval = 'day', period = 30) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/transaction-trends/`, {
                params: { interval, period }
            });
            // Ensure data includes anomaly_count for consistency with anomalyService
            const trends = response.data.map(item => ({
                date: item.date,
                count: item.count || 0,
                anomaly_count: item.anomaly_count || 0,
            }));
            return trends;
        } catch (error) {
            console.error('Trend Data API Error:', error.response ? error.response.data : error.message);
            throw new Error('Failed to fetch transaction trends');
        }
    }

    async storeAlert(transaction, riskScore, action) {
        console.warn('[FraudDetectionService] storeAlert is deprecated. Use anomalyService.createAnomalyFromTransaction instead.');
        const query = `
            INSERT INTO alerts (transaction_id, risk_score, action_taken, created_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (transaction_id)
            DO UPDATE SET
                risk_score = EXCLUDED.risk_score,
                action_taken = EXCLUDED.action_taken,
                updated_at = NOW();
        `;
        try {
            await pgPool.query(query, [transaction.transaction_id, riskScore, action]);
            console.log(`Fraud alert stored for transaction: ${transaction.transaction_id}`);
        } catch (error) {
            console.error('Database Error storing fraud alert:', error.message);
            throw new Error(`Error storing fraud alert: ${error.message}`);
        }
    }

    async getModelMetrics() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/metrics`);
            return {
                model_status: response.data.status || 'active',
                model_name: response.data.model_name || 'FraudDetector_v1',
                anomaly_detection_rate: response.data.anomaly_detection_rate || 0.0,
                average_confidence: response.data.average_confidence || 0.0,
                average_processing_time: response.data.average_processing_time || 0.0,
                detection_accuracy: response.data.detection_accuracy || 0.0,
                false_positive_rate: response.data.false_positive_rate || 0.0,
                last_retrained: response.data.last_retrained || new Date().toISOString(),
                performance_metrics: {
                    silhouette_score: response.data.silhouette_score || 0.0,
                    separation_quality: response.data.separation_quality || 0.0,
                    composite_score: response.data.composite_score || 0.0
                }
            };
        } catch (error) {
            console.error('ML Metrics API Error:', error.response ? error.response.data : error.message);
            throw new Error('Failed to fetch ML metrics');
        }
    }

    async getFeatureImportance() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/feature-importance`);
            return response.data.map(item => ({
                feature: item.feature,
                importance: item.importance || 0.0
            }));
        } catch (error) {
            console.error('Feature Importance API Error:', error.response ? error.response.data : error.message);
            throw new Error('Failed to fetch feature importance');
        }
    }

    async getPerformanceHistory() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/performance-history`);
            return response.data.map(item => ({
                date: item.date,
                accuracy: item.accuracy || 0.0,
                confidence: item.confidence || 0.0
            }));
        } catch (error) {
            console.error('Performance History API Error:', error.response ? error.response.data : error.message);
            throw new Error('Failed to fetch performance history');
        }
    }
}

module.exports = (anomalyService) => new FraudDetectionService(anomalyService);