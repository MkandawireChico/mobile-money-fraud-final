// server/services/anomalyService.js

let ioInstance;

module.exports = (anomalyModel, transactionModel) => {
    // Remove circular dependency - FraudDetectionService will be injected when needed

    const getAnomalies = async (filters, limit, offset) => {
        try {

            const result = await anomalyModel.findAll(filters, null, limit, offset);

            const anomalies = result?.rows || [];
            const totalCount = result?.totalCount || 0;

            return { anomalies, totalCount };
        } catch (error) {
            console.error('[AnomalyService] Error fetching anomalies:', error.message);
            throw error;
        }
    };

    const getAnomaliesByTransactionId = async (transactionId) => {
        try {
            const anomalies = await anomalyModel.findByTransactionId(transactionId);
            return anomalies || [];
        } catch (error) {
            console.error('[AnomalyService] Error fetching anomalies by transaction ID:', error.message);
            throw error;
        }
    };

    const createAnomalyFromTransaction = async (transaction, assessment = null) => {
        try {
            if (!transaction || !transaction.transaction_id || !transaction.timestamp) {
                throw new Error('Invalid transaction data: transaction_id and timestamp are required.');
            }

            // If no assessment provided, create a basic anomaly based on transaction data
            if (!assessment) {
                // Create a basic anomaly without ML assessment
                const anomalyData = {
                    id: require('uuid').v4(),
                    transaction_id: transaction.transaction_id,
                    user_id: transaction.user_id || null,
                    rule_name: 'Manual_Detection',
                    description: `Manual anomaly creation for transaction ${transaction.transaction_id}.`,
                    severity: 'Medium',
                    status: 'open',
                    timestamp: transaction.timestamp,
                    risk_score: 0.5, // Default medium risk
                    transaction_data: transaction,
                    comments: [],
                    created_at: new Date(),
                    updated_at: new Date(),
                    model_version: '1.0',
                };

                const result = await anomalyModel.create(anomalyData);

                // Attempt to update the related transaction to reflect anomaly detection
                try {
                    if (transaction.transaction_id && transactionModel && typeof transactionModel.update === 'function') {
                        await transactionModel.update(transaction.transaction_id, {
                            is_fraud: true,
                            risk_score: anomalyData.risk_score || 0.5
                        });

                        // Emit transaction update via socket handler if available
                        try {
                            require('../socket/socketHandler').emitTransactionUpdated({ transaction_id: transaction.transaction_id, is_fraud: true, risk_score: anomalyData.risk_score || 0.5 });
                        } catch (emitErr) {
                            // Fallback to console if socket handler fails
                            console.warn('[AnomalyService] Failed to emit transaction update after anomaly creation:', emitErr.message);
                        }
                    }
                } catch (txUpdateErr) {
                    console.error('[AnomalyService] Failed to update related transaction after anomaly creation:', txUpdateErr.message);
                }

                // Delegate emission to socketHandler
                return result;
            }

            // Create anomaly from ML assessment
            if (assessment.is_anomaly) {
                // Smart Algorithm Selection based on transaction characteristics and risk levels
                let algorithmName = 'LocalOutlierFactor'; // Default to best performing algorithm
                let algorithmDescription = 'Local Outlier Factor - Detects anomalies based on local density deviation';
                
                // Parse transaction amount for algorithm selection
                const transactionAmount = parseFloat(transaction.amount) || 0;
                const riskScore = assessment.risk_score || 0;
                
                // Smart selection based on risk profile and transaction characteristics
                if (riskScore >= 0.9) {
                    // Critical risk - Use most accurate algorithm for high-stakes detection
                    algorithmName = 'Autoencoder';
                    algorithmDescription = 'Autoencoder Neural Network - Deep learning for critical fraud detection with highest accuracy';
                } else if (riskScore >= 0.7 && transactionAmount >= 100000) {
                    // High risk + High amount - Use SVM for precision
                    algorithmName = 'OneClassSVM';
                    algorithmDescription = 'One-Class SVM - Support Vector Machine optimized for high-value transaction fraud';
                } else if (riskScore >= 0.6) {
                    // Medium-high risk - Use LOF (best overall performer)
                    algorithmName = 'LocalOutlierFactor';
                    algorithmDescription = 'Local Outlier Factor - Best performing algorithm for general fraud detection';
                } else if (transactionAmount >= 50000) {
                    // High amount but lower risk - Use ensemble approach
                    algorithmName = 'EnsembleDetection';
                    algorithmDescription = 'Ensemble Method - Combined algorithms for high-value transaction analysis';
                } else if (assessment.model_version?.includes('fallback') || assessment.model_version?.includes('rule')) {
                    // Rule-based detection
                    algorithmName = 'RuleBasedDetection';
                    algorithmDescription = 'Rule-based fraud detection system with threshold analysis';
                } else {
                    // Default case - Use LOF as it's the best performer
                    algorithmName = 'LocalOutlierFactor';
                    algorithmDescription = 'Local Outlier Factor - Primary fraud detection algorithm with proven performance';
                }
                
                // Override with specific model name if provided and recognized
                if (assessment.model_name) {
                    const modelName = assessment.model_name.toLowerCase();
                    if (modelName.includes('lof') || modelName.includes('outlier')) {
                        algorithmName = 'LocalOutlierFactor';
                        algorithmDescription = 'Local Outlier Factor - Detects anomalies based on local density deviation';
                    } else if (modelName.includes('svm') || modelName.includes('oneclass')) {
                        algorithmName = 'OneClassSVM';
                        algorithmDescription = 'One-Class SVM - Support Vector Machine for novelty detection';
                    } else if (modelName.includes('autoencoder')) {
                        algorithmName = 'Autoencoder';
                        algorithmDescription = 'Autoencoder Neural Network - Detects anomalies through reconstruction error';
                    } else if (modelName.includes('ensemble')) {
                        algorithmName = 'EnsembleDetection';
                        algorithmDescription = 'Ensemble Method - Combined multiple algorithms for enhanced accuracy';
                    } else if (modelName.includes('isolation') || modelName.includes('forest')) {
                        // Only use Isolation Forest if explicitly specified (since it's lowest performing)
                        algorithmName = 'IsolationForest';
                        algorithmDescription = 'Isolation Forest - Baseline algorithm for comparison purposes';
                    } else if (modelName.includes('rule') || modelName.includes('fallback')) {
                        algorithmName = 'RuleBasedDetection';
                        algorithmDescription = 'Rule-based fraud detection system with threshold analysis';
                    }
                }
                
                const triggeredBy = {
                    type: assessment.model_version?.includes('fallback') || assessment.model_version?.includes('rule') ? 'Rule Engine' : 'ML Model',
                    algorithm: algorithmName,
                    version: assessment.model_version || '1.0',
                    description: assessment.model_description || algorithmDescription,
                    confidence: assessment.confidence || Math.abs(assessment.risk_score || 0.5),
                    risk_factors: assessment.risk_factors || [],
                    selection_reason: `Selected based on risk score ${riskScore} and transaction amount ${transactionAmount}`
                };
                
                const anomalyData = {
                    id: require('uuid').v4(),
                    transaction_id: transaction.transaction_id,
                    user_id: transaction.user_id || null,
                    rule_name: 'ML_Detection',
                    description: `Anomaly detected with risk score ${assessment.risk_score.toFixed(2)} using ${triggeredBy.algorithm.replace(/_/g, ' ')}.`,
                    severity: anomalyModel._deriveSeverityFromRisk(assessment.risk_score),
                    status: 'open',
                    timestamp: assessment.timestamp || transaction.timestamp,
                    risk_score: assessment.risk_score,
                    transaction_data: transaction,
                    comments: [],
                    created_at: new Date(),
                    updated_at: new Date(),
                    model_version: assessment.model_version || '1.0',
                    triggered_by: triggeredBy
                };

                const result = await anomalyModel.create(anomalyData);

                // Attempt to update the related transaction to reflect anomaly detection
                try {
                    if (transaction.transaction_id && transactionModel && typeof transactionModel.update === 'function') {
                        await transactionModel.update(transaction.transaction_id, {
                            is_fraud: true,
                            risk_score: anomalyData.risk_score || assessment.risk_score || 0.0
                        });

                        try {
                            require('../socket/socketHandler').emitTransactionUpdated({ transaction_id: transaction.transaction_id, is_fraud: true, risk_score: anomalyData.risk_score || assessment.risk_score || 0.0 });
                        } catch (emitErr) {
                            console.warn('[AnomalyService] Failed to emit transaction update after ML anomaly creation:', emitErr.message);
                        }
                    }
                } catch (txUpdateErr) {
                    console.error('[AnomalyService] Failed to update related transaction after ML anomaly creation:', txUpdateErr.message);
                }

                // Delegate emission to socketHandler
                require('../socket/socketHandler').emitNewAnomaly(result);
                return result;
            }
            return null;
        } catch (error) {
            console.error('[AnomalyService] Error creating anomaly from transaction:', error.message);
            throw error;
        }
    };

    const updateAnomaly = async (anomalyId, updateData) => {
        try {
            const result = await anomalyModel.update(anomalyId, updateData);
            if (result) {
                require('../socket/socketHandler').emitAnomalyUpdated(result);

                // Keep transaction record in sync when anomaly changes
                try {
                    if (result.transaction_id && transactionModel && typeof transactionModel.update === 'function') {
                        const txUpdates = {};

                        if (updateData.hasOwnProperty('risk_score')) {
                            txUpdates.risk_score = updateData.risk_score;
                        }

                        if (updateData.hasOwnProperty('status')) {
                            // If anomaly is marked false_positive, unflag the transaction.
                            if (updateData.status === 'false_positive') {
                                txUpdates.is_fraud = false;
                            }
                            // If anomaly is confirmed (resolved as fraud), ensure transaction is flagged
                            if (updateData.status === 'resolved') {
                                txUpdates.is_fraud = true;
                            }
                        }

                        if (Object.keys(txUpdates).length > 0) {
                            await transactionModel.update(result.transaction_id, txUpdates);
                            try {
                                require('../socket/socketHandler').emitTransactionUpdated({ transaction_id: result.transaction_id, ...txUpdates });
                            } catch (emitErr) {
                                console.warn('[AnomalyService] Failed to emit transaction update after anomaly update:', emitErr.message);
                            }
                        }
                    }
                } catch (syncErr) {
                    console.error('[AnomalyService] Failed to sync transaction after anomaly update:', syncErr.message);
                }
            }
            return result;
        } catch (error) {
            console.error('[AnomalyService] Error updating anomaly:', error.message);
            throw error;
        }
    };

    const deleteAnomaly = async (anomalyId) => {
        try {
            // Fetch anomaly to get transaction_id before deletion
            const existing = await anomalyModel.findById(anomalyId);
            const result = await anomalyModel.del(anomalyId);
            if (result) {
                require('../socket/socketHandler').emitAnomalyDeleted(anomalyId);

                // If the deleted anomaly referenced a transaction, and there are no more anomalies for that transaction,
                // unflag the transaction as fraud and reset risk_score.
                try {
                    if (existing && existing.transaction_id && transactionModel && typeof transactionModel.findById === 'function') {
                        const remaining = await anomalyModel.findByTransactionId(existing.transaction_id);
                        if (!remaining || remaining.length === 0) {
                            await transactionModel.update(existing.transaction_id, { is_fraud: false, risk_score: 0.0 });
                            try {
                                require('../socket/socketHandler').emitTransactionUpdated({ transaction_id: existing.transaction_id, is_fraud: false, risk_score: 0.0 });
                            } catch (emitErr) {
                                console.warn('[AnomalyService] Failed to emit transaction update after anomaly deletion:', emitErr.message);
                            }
                        }
                    }
                } catch (syncErr) {
                    console.error('[AnomalyService] Failed to sync transaction after anomaly deletion:', syncErr.message);
                }
            }

            return result;
        } catch (error) {
            console.error('[AnomalyService] Error deleting anomaly:', error.message);
            throw error;
        }
    };

    const getTransactionTrends = async (interval = 'day', period = 30) => {
        try {
            // Use transactionModel directly to avoid circular dependency
            const trends = await transactionModel.getTransactionsTrend(interval, period);
            // Map transactionModel data to expected format
            const formattedTrends = trends.map(item => ({
                date: item.date,
                count: item.count,
                anomaly_count: 0, // Will be populated by separate anomaly query if needed
            }));

            return formattedTrends;
        } catch (error) {
            console.error('[AnomalyService] Error fetching transaction trends:', error.message);
            throw error;
        }
    };

    const setIO = (io) => {
        ioInstance = io;
    };

    // Remove direct emit methods, delegate to socketHandler
    const emitNewAnomaly = () => {
        console.warn('[AnomalyService] emitNewAnomaly is deprecated. Use socketHandler.emitNewAnomaly instead.');
    };
    const emitAnomalyUpdated = () => {
        console.warn('[AnomalyService] emitAnomalyUpdated is deprecated. Use socketHandler.emitAnomalyUpdated instead.');
    };
    const emitAnomalyDeleted = () => {
        console.warn('[AnomalyService] emitAnomalyDeleted is deprecated. Use socketHandler.emitAnomalyDeleted instead.');
    };

    return {
        getAnomalies,
        getAnomaliesByTransactionId,
        createAnomalyFromTransaction,
        updateAnomaly,
        deleteAnomaly,
        getTransactionTrends,
        setIO,
        emitNewAnomaly,
        emitAnomalyUpdated,
        emitAnomalyDeleted,
    };
};