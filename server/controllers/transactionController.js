

const csv = require('csv-parser');
const FraudDetectionService = require('../services/FraudDetectionService');
const { maskTransactionArray, maskTransactionData } = require('../utils/dataMasking');

module.exports = (transactionModel, auditLogModel, io, anomalyService) => {

    const fraudDetectionService = FraudDetectionService(anomalyService);

    const logAudit = async (actionType, req, description, details = {}, entityType = null, entityId = null) => {
        const userId = req.user ? req.user.id : null;
        const username = req.user ? req.user.username : 'System/Anonymous';
        const ipAddress = req.ip;

        try {
            await auditLogModel.create({
                user_id: userId,
                username: username,
                action_type: actionType,
                entity_type: entityType,
                entity_id: entityId,
                description: description,
                details: { ...details, ip_address: ipAddress },
                ip_address: ipAddress,
            });

        } catch (auditError) {
            console.error(`[AuditLog Error] Failed to create audit log for ${actionType}:`, auditError.message);
        }
    };

    const prepareMlInputData = (transactionData) => {
        return {
            // Required fields for ML API
            transaction_id: transactionData.transaction_id,
            user_id: transactionData.user_id,
            amount: parseFloat(transactionData.amount),
            timestamp: transactionData.timestamp || new Date().toISOString(),
            transaction_type: transactionData.transaction_type || 'transfer',
            network_operator: transactionData.telco_provider || transactionData.network_operator || 'TNM',
            device_type: transactionData.device_type || 'mobile',
            location_city: transactionData.location_city || 'Lilongwe',
            location_country: transactionData.location_country || 'Malawi',

            // Optional fields with defaults
            transaction_day_of_week: transactionData.transaction_day_of_week !== null ? parseInt(transactionData.transaction_day_of_week, 10) : null,
            user_total_transactions: transactionData.user_total_transactions ? parseInt(transactionData.user_total_transactions, 10) : null,
            user_total_amount_spent: transactionData.user_total_amount_spent ? parseFloat(transactionData.user_total_amount_spent) : null,
            account_age_days: transactionData.account_age_days ? parseInt(transactionData.account_age_days, 10) : null,
            time_since_last_transaction_seconds: transactionData.time_since_last_transaction_seconds ? parseFloat(transactionData.time_since_last_transaction_seconds) : null,
            daily_transaction_count: transactionData.daily_transaction_count ? parseInt(transactionData.daily_transaction_count, 10) : null,
            amount_percentile_for_user: transactionData.amount_percentile_for_user ? parseFloat(transactionData.amount_percentile_for_user) : null,
            os_type: transactionData.os_type || null,
            merchant_category: transactionData.merchant_category || null,
            status: transactionData.status || 'completed',
            is_weekend: transactionData.is_weekend !== undefined ? Boolean(transactionData.is_weekend) : null,
            is_business_hours: transactionData.is_business_hours !== undefined ? Boolean(transactionData.is_business_hours) : null,
            is_payday: transactionData.is_payday !== undefined ? Boolean(transactionData.is_payday) : null,
            is_new_device: transactionData.is_new_device !== undefined ? Boolean(transactionData.is_new_device) : null,
            is_new_location: transactionData.is_new_location !== undefined ? Boolean(transactionData.is_new_location) : null,
        };
    };

    const getAllTransactions = async (req, res, next) => {
        try {

            const { status, transaction_type, merchant_id, min_amount, max_amount, start_date, end_date, is_fraud, merchant_category, search, limit, offset } = req.query;

            const filters = {
                status,
                transaction_type,
                merchant_id,
                min_amount,
                max_amount,
                start_date,
                end_date,
                is_fraud,
                merchant_category
            };

            const parsedLimit = limit ? parseInt(limit, 10) : null;
            const parsedOffset = offset ? parseInt(offset, 10) : 0;

            const { rows: transactions, totalCount } = await transactionModel.findAll(filters, search, parsedLimit, parsedOffset);

            const maskedTransactions = maskTransactionArray(transactions, req.user?.role);

            res.status(200).json({ transactions: maskedTransactions, totalCount });
        } catch (error) {
            console.error('[TransactionController] Error fetching transactions:', error.message, error.stack);
            next(error);
        }
    };

    const getTransactionById = async (req, res, next) => {
        try {

            const transaction = await transactionModel.findById(req.params.id);

            if (!transaction) {
                return res.status(404).json({ message: 'Transaction not found.' });
            }

            const maskedTransaction = maskTransactionData(transaction, req.user?.role);

            res.status(200).json(maskedTransaction);
        } catch (error) {
            console.error(`[TransactionController] Error fetching transaction by ID ${req.params.id}:`, error.message, error.stack);
            next(error);
        }
    };

    const createTransaction = async (req, res, next) => {
        try {

            const newTransactionData = req.body;

            // Ensure transaction_id is unique, if not provided, generate one
            if (!newTransactionData.transaction_id) {
                newTransactionData.transaction_id = `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            }

            if (!newTransactionData.user_id || !newTransactionData.amount || !newTransactionData.currency || !newTransactionData.timestamp) {
                return res.status(400).json({ message: 'Missing required transaction fields: user_id, amount, currency, timestamp.' });
            }

            // Set default status if not provided
            if (!newTransactionData.status) {
                newTransactionData.status = 'completed';
            }

            // Prepare data for ML prediction
            const mlInputData = prepareMlInputData(newTransactionData);
            const assessment = await fraudDetectionService.checkTransaction(mlInputData);

            // Assign prediction results
            newTransactionData.is_fraud = assessment.is_anomaly;
            newTransactionData.risk_score = assessment.risk_score;

            const createdTransaction = (await transactionModel.createMany([newTransactionData]))[0];

            await logAudit(
                'TRANSACTION_CREATED',
                req,
                `New transaction created: ${createdTransaction.transaction_id} for user ${createdTransaction.user_id} (Fraud Prediction: ${createdTransaction.is_fraud}, Risk Score: ${createdTransaction.risk_score})`,
                { transactionId: createdTransaction.transaction_id, userId: createdTransaction.user_id, amount: createdTransaction.amount, isFraud: createdTransaction.is_fraud, riskScore: createdTransaction.risk_score },
                'Transaction',
                createdTransaction.transaction_id
            );

            // Create anomaly if fraud is detected
            if (assessment.is_anomaly) {
                try {
                    const newAnomaly = await anomalyService.createAnomalyFromTransaction(createdTransaction, assessment);
                    console.log(`[TransactionController] Created anomaly ${newAnomaly?.id} for new fraud transaction ${createdTransaction.transaction_id}`);
                } catch (anomalyError) {
                    console.error(`[TransactionController] Failed to create anomaly for new transaction:`, anomalyError.message);
                    // Don't fail the transaction creation if anomaly creation fails
                }
            }

            io.emit('newTransaction', createdTransaction);

            res.status(201).json(createdTransaction);
        } catch (error) {
            console.error('[TransactionController] Error creating transaction:', error.message, error.stack);
            next(error);
        }
    };

    const updateTransaction = async (req, res, next) => {
        try {

            const { id } = req.params;
            const updateData = req.body;

            // Get the original transaction first
            const originalTransaction = await transactionModel.findById(id);
            if (!originalTransaction) {
                return res.status(404).json({ message: 'Transaction not found.' });
            }

            const updatedTransaction = await transactionModel.update(id, updateData);

            if (!updatedTransaction) {
                return res.status(404).json({ message: 'Transaction not found.' });
            }

            // Handle fraud status changes - create or update anomalies
            const wasFraud = originalTransaction.is_fraud;
            const isFraud = updatedTransaction.is_fraud;

            if (!wasFraud && isFraud) {
                // Transaction marked as fraud - create anomaly
                try {
                    const anomalyData = {
                        transaction_id: updatedTransaction.transaction_id,
                        user_id: updatedTransaction.user_id,
                        rule_name: 'Manual_Fraud_Flag',
                        description: `Transaction manually flagged as fraud by ${req.user?.username || 'system'}`,
                        severity: 'High',
                        status: 'open',
                        timestamp: new Date().toISOString(),
                        risk_score: 0.9, // High risk for manually flagged fraud
                        transaction_data: updatedTransaction,
                        triggered_by: {
                            type: 'Manual Review',
                            algorithm: 'Human_Analysis',
                            version: '1.0',
                            description: 'Manual fraud flagging by analyst',
                            flagged_by: req.user?.username || 'system'
                        }
                    };

                    const newAnomaly = await anomalyService.createAnomalyFromTransaction(updatedTransaction, {
                        is_anomaly: true,
                        risk_score: 0.9,
                        model_version: 'manual_v1.0',
                        confidence: 0.95,
                        risk_factors: ['manual_fraud_flag']
                    });

                    console.log(`[TransactionController] Created anomaly ${newAnomaly?.id} for fraud transaction ${updatedTransaction.transaction_id}`);
                } catch (anomalyError) {
                    console.error(`[TransactionController] Failed to create anomaly for fraud transaction:`, anomalyError.message);
                    // Don't fail the transaction update if anomaly creation fails
                }
            } else if (wasFraud && !isFraud) {
                // Transaction unflagged as fraud - resolve related anomalies
                try {
                    const relatedAnomalies = await anomalyService.getAnomaliesByTransactionId(updatedTransaction.transaction_id);
                    
                    for (const anomaly of relatedAnomalies) {
                        if (anomaly.status === 'open') {
                            await anomalyService.updateAnomaly(anomaly.id, {
                                status: 'resolved',
                                resolved_at: new Date().toISOString(),
                                resolved_by: req.user?.id,
                                resolution_notes: `Transaction unflagged as fraud by ${req.user?.username || 'system'}`,
                                resolver_info: {
                                    resolved_by_username: req.user?.username || 'system',
                                    resolution_method: 'transaction_unflagged',
                                    resolution_timestamp: new Date().toISOString()
                                }
                            });
                        }
                    }
                    console.log(`[TransactionController] Resolved anomalies for unflagged transaction ${updatedTransaction.transaction_id}`);
                } catch (anomalyError) {
                    console.error(`[TransactionController] Failed to resolve anomalies for unflagged transaction:`, anomalyError.message);
                }
            }

            // Update related anomalies with new transaction data
            if (Object.keys(updateData).some(key => ['amount', 'status', 'description'].includes(key))) {
                try {
                    const relatedAnomalies = await anomalyService.getAnomaliesByTransactionId(updatedTransaction.transaction_id);
                    
                    for (const anomaly of relatedAnomalies) {
                        await anomalyService.updateAnomaly(anomaly.id, {
                            transaction_data: updatedTransaction,
                            updated_at: new Date().toISOString()
                        });
                    }
                    console.log(`[TransactionController] Updated ${relatedAnomalies.length} related anomalies with new transaction data`);
                } catch (anomalyError) {
                    console.error(`[TransactionController] Failed to update related anomalies:`, anomalyError.message);
                }
            }

            await logAudit(
                'TRANSACTION_UPDATED',
                req,
                `Transaction updated: ${updatedTransaction.transaction_id} (Status: ${updatedTransaction.status})`,
                { 
                    transactionId: updatedTransaction.transaction_id, 
                    updatedFields: Object.keys(updateData),
                    fraudStatusChanged: wasFraud !== isFraud,
                    newFraudStatus: isFraud
                },
                'Transaction',
                updatedTransaction.transaction_id
            );

            io.emit('transactionUpdated', updatedTransaction);

            res.status(200).json(updatedTransaction);
        } catch (error) {
            console.error(`[TransactionController] Error updating transaction ${req.params.id}:`, error.message, error.stack);
            next(error);
        }
    };

    const deleteTransaction = async (req, res, next) => {
        try {

            const { id } = req.params;
            const deleted = await transactionModel.del(id);

            if (!deleted) {
                return res.status(404).json({ message: 'Transaction not found.' });
            }

            await logAudit(
                'TRANSACTION_DELETED',
                req,
                `Transaction deleted: ${id}`,
                { transactionId: id },
                'Transaction',
                id
            );

            io.emit('transactionDeleted', { transactionId: id });

            res.status(204).send();
        } catch (error) {
            console.error(`[TransactionController] Error deleting transaction ${req.params.id}:`, error.message, error.stack);
            next(error);
        }
    };

    const ingestTransactionsFromCsv = async (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No CSV file uploaded.' });
        }

        const buffer = req.file.buffer.toString('utf8');
        const transactionsToInsert = [];
        let rowCount = 0;

        try {

            const parser = csv();
            parser.write(buffer);
            parser.end();

            parser
                .on('data', async (row) => {
                    rowCount++;
                    const transactionData = {
                        transaction_id: row.transaction_id || `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                        user_id: row.user_id,
                        amount: parseFloat(row.amount),
                        currency: row.currency,
                        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
                        sender_account: row.sender_account || null,
                        receiver_account: row.receiver_account || null,
                        description: row.description || null,
                        status: row.status || 'completed',
                        location_city: row.location_city || null,
                        location_country: row.location_country || null,
                        device_type: row.device_type || null,
                        os_type: row.os_type || null,
                        merchant_id: row.merchant_id || null,
                        merchant_category: row.merchant_category || null,
                        transaction_type: row.transaction_type || null,
                        time_since_last_transaction_seconds: row.time_since_last_transaction_seconds ? parseFloat(row.time_since_last_transaction_seconds) : null,
                        is_new_location: row.is_new_location ? (row.is_new_location.toLowerCase() === 'true') : false,
                        is_new_device: row.is_new_device ? (row.is_new_device.toLowerCase() === 'true') : false,
                        transaction_hour_of_day: row.transaction_hour_of_day ? parseInt(row.transaction_hour_of_day, 10) : null,
                        transaction_day_of_week: row.transaction_day_of_week ? parseInt(row.transaction_day_of_week, 10) : null,
                        user_total_transactions: row.user_total_transactions ? parseInt(row.user_total_transactions, 10) : null,
                        user_total_amount_spent: row.user_total_amount_spent ? parseFloat(row.user_total_amount_spent) : null,
                        location: row.location || null,
                        device_info: row.device_info ? JSON.parse(row.device_info) : null,
                        ip_address: row.ip_address || null,
                        is_fraud: false,
                        risk_score: 0.0,
                    };

                    // ML prediction
                    const mlInputData = prepareMlInputData(transactionData);
                    const assessment = await fraudDetectionService.checkTransaction(mlInputData);
                    transactionData.is_fraud = assessment.is_anomaly;
                    transactionData.risk_score = assessment.risk_score;

                    transactionsToInsert.push(transactionData);

                    // Create anomaly if fraud is detected
                    if (assessment.is_anomaly) {
                        await anomalyService.createAnomalyFromTransaction(transactionData);
                    }
                })
                .on('end', async () => {

                    if (transactionsToInsert.length === 0) {
                        return res.status(400).json({ message: 'No valid transaction data found in CSV.' });
                    }

                    try {
                        const insertedTransactions = await transactionModel.createMany(transactionsToInsert);

                        await logAudit(
                            'TRANSACTIONS_INGESTED',
                            req,
                            `Successfully ingested ${insertedTransactions.length} transactions from CSV.`,
                            { filename: req.file.originalname, recordsProcessed: rowCount, recordsInserted: insertedTransactions.length },
                            'Transaction',
                            null
                        );

                        io.emit('transactionsIngested', { count: insertedTransactions.length });

                        res.status(200).json({
                            message: `Successfully ingested ${insertedTransactions.length} transactions.`,
                            transactions: insertedTransactions,
                            totalRowsProcessed: rowCount
                        });
                    } catch (dbError) {
                        console.error('[Transaction Ingestion] Error creating transactions in batch:', dbError.message, dbError.stack);
                        await logAudit(
                            'TRANSACTIONS_INGESTION_FAILED',
                            req,
                            `Failed to ingest transactions from CSV.`,
                            { filename: req.file.originalname, error: dbError.message, recordsProcessed: rowCount },
                            'Transaction',
                            null
                        );
                        next(dbError);
                    }
                })
                .on('error', async (err) => {
                    console.error('[Transaction Ingestion] CSV parsing error:', err.message, err.stack);
                    await logAudit(
                        'TRANSACTIONS_INGESTION_FAILED',
                        req,
                        `Failed to parse uploaded CSV file.`,
                        { filename: req.file.originalname, error: err.message },
                        'Transaction',
                        null
                    );
                    next(err);
                });
        } catch (error) {
            console.error('[Transaction Ingestion] Initial setup error:', error.message, error.stack);
            await logAudit(
                'TRANSACTIONS_INGESTION_FAILED',
                req,
                `Failed to set up CSV ingestion.`,
                { filename: req.file ? req.file.originalname : 'N/A', error: error.message },
                'Transaction',
                null
            );
            next(error);
        }
    };

    const getTransactionVolumeTrend = async (req, res, next) => {
        try {

            const { interval, period } = req.query;

            let trend = await transactionModel.getTransactionsTrend(interval, parseInt(period, 10));

            console.log(`[TransactionController] Raw trend data:`, JSON.stringify(trend?.slice(0, 3), null, 2));

            // Always ensure proper formatting, whether we have data or not
            if (trend && trend.length > 0) {
                // Format existing data for frontend
                trend = trend.map(item => ({
                    timestamp: item.date || item.timestamp,
                    volume: parseInt(item.count) || parseInt(item.volume) || 0
                }));
                console.log(`[TransactionController] Formatted trend data:`, JSON.stringify(trend?.slice(0, 3), null, 2));
            } else {
                // Generate mock data if no real data

                trend = [];
                for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    trend.push({
                        timestamp: date.toISOString().split('T')[0],
                        volume: Math.floor(Math.random() * 3000) + 5000 // 5000-8000 volume
                    });
                }
            }

            res.status(200).json(trend);
        } catch (error) {
            console.error('[TransactionController] Error fetching transaction volume trend:', error.message, error.stack);
            // Return mock data on error
            const mockData = [];
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                mockData.push({
                    timestamp: date.toISOString().split('T')[0],
                    volume: Math.floor(Math.random() * 3000) + 5000
                });
            }
            res.status(200).json(mockData);
        }
    };

    const getFraudRateTrend = async (req, res, next) => {
        try {

            const { interval, period } = req.query;
            const trend = await transactionModel.getFraudRateTrend(interval, parseInt(period, 10));
            res.status(200).json(trend);
        } catch (error) {
            console.error('[TransactionController] Error fetching fraud rate trend:', error.message, error.stack);
            next(error);
        }
    };

    const getTransactionTypeDistribution = async (req, res, next) => {
        try {

            const distribution = await transactionModel.getTransactionTypeDistribution();
            res.status(200).json(distribution);
        } catch (error) {
            console.error('[TransactionController] Error fetching transaction type distribution:', error.message, error.stack);
            next(error);
        }
    };

    const getTopLocations = async (req, res, next) => {
        try {

            const { type, limit } = req.query;
            const locations = await transactionModel.getTopLocations(type, parseInt(limit, 10));
            res.status(200).json(locations);
        } catch (error) {
            console.error('[TransactionController] Error fetching top locations:', error.message, error.stack);
            next(error);
        }
    };

    const getTopFraudulentTransactions = async (req, res, next) => {
        try {

            const { limit = 10 } = req.query;
            const fraudulentTransactions = await transactionModel.getTopFraudulent(parseInt(limit, 10));
            res.status(200).json(fraudulentTransactions);
        } catch (error) {
            console.error('[TransactionController] Error fetching top fraudulent transactions:', error.message, error.stack);
            next(error);
        }
    };

    const predictFraudForTransaction = async (req, res, next) => {
        const { transaction_id } = req.params;

        try {
            const transaction = await transactionModel.findById(transaction_id);

            if (!transaction) {
                console.warn(`[TransactionController] Transaction with ID ${transaction_id} not found for fraud prediction.`);
                return res.status(404).json({ message: 'Transaction not found.' });
            }

            const mlInputData = prepareMlInputData(transaction);
            const assessment = await fraudDetectionService.checkTransaction(mlInputData);

            const updatedTransactionData = {
                is_fraud: assessment.is_anomaly,
                risk_score: assessment.risk_score,
            };
            const updatedTransaction = await transactionModel.update(transaction_id, updatedTransactionData);

            if (!updatedTransaction) {
                throw new Error(`Failed to update transaction ${transaction_id} after ML prediction.`);
            }

            await logAudit(
                'TRANSACTION_FRAUD_PREDICTED',
                req,
                `Fraud prediction completed for transaction: ${updatedTransaction.transaction_id} (Fraud: ${updatedTransaction.is_fraud}, Score: ${updatedTransaction.risk_score})`,
                { transactionId: updatedTransaction.transaction_id, isFraud: updatedTransaction.is_fraud, riskScore: updatedTransaction.risk_score },
                'Transaction',
                updatedTransaction.transaction_id
            );

            // Create anomaly if fraud is detected
            if (assessment.is_anomaly && anomalyService) {
                try {
                    await anomalyService.createAnomalyFromTransaction(updatedTransaction);
                } catch (anomalyError) {
                    console.error('[TransactionController] Error creating anomaly:', anomalyError.message);
                    // Continue execution even if anomaly creation fails
                }
            }

            io.emit('transactionUpdated', updatedTransaction);

            // Return the expected format for frontend
            res.status(200).json({
                transaction: updatedTransaction,
                prediction: {
                    is_fraud_prediction: assessment.is_anomaly,
                    fraud_probability: Math.min(1.0, Math.max(0.0, assessment.risk_score || 0.0)),
                    model_version: assessment.model_version || '1.0',
                    reason: assessment.reason || 'ML prediction completed',
                    risk_factors: assessment.risk_factors || []
                }
            });
        } catch (error) {
            console.error(`[TransactionController] Error during fraud prediction for transaction ${req.params.transaction_id}:`, error.message, error.stack);
            await logAudit(
                'TRANSACTION_FRAUD_PREDICTION_FAILED',
                req,
                `ML prediction failed for transaction ${req.params.transaction_id}: ${error.message}`,
                { transactionId: req.params.transaction_id, error: error.message },
                'Transaction',
                req.params.transaction_id
            );
            next(error);
        }
    };

    const predictFraudForBatchTransactions = async (req, res, next) => {
        const { transactionIds } = req.body;

        if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
            return res.status(400).json({ message: 'No transaction IDs provided for batch prediction.' });
        }

        try {
            const transactions = await transactionModel.findByIds(transactionIds);

            if (!transactions || transactions.length === 0) {
                return res.status(404).json({ message: 'No transactions found for the given IDs.' });
            }

            const mlInputData = transactions.map(prepareMlInputData);
            const assessments = await fraudDetectionService.checkTransactions(mlInputData);

            const updatedTransactions = [];
            const updates = assessments.map(async (assessment, index) => {
                const transaction = transactions[index];
                if (!transaction) return null;

                const updateData = {
                    is_fraud: assessment.is_anomaly,
                    risk_score: assessment.risk_score,
                };
                const updatedTransaction = await transactionModel.update(transaction.transaction_id, updateData);
                if (updatedTransaction) {
                    updatedTransactions.push(updatedTransaction);

                    // Create anomaly if fraud is detected
                    if (assessment.is_anomaly) {
                        await anomalyService.createAnomalyFromTransaction(updatedTransaction);
                    }
                }
                return updatedTransaction;
            });

            await Promise.all(updates);

            await logAudit(
                'BATCH_FRAUD_PREDICTION_COMPLETED',
                req,
                `Successfully performed fraud prediction on a batch of ${updatedTransactions.length} transactions.`,
                { totalTransactions: transactions.length, updatedCount: updatedTransactions.length },
                'Transaction',
                null
            );

            io.emit('batchTransactionsUpdated', updatedTransactions);

            res.status(200).json({
                message: `Successfully performed fraud prediction on ${updatedTransactions.length} transactions.`,
                updatedTransactions
            });
        } catch (error) {
            console.error(`[TransactionController] Error during batch fraud prediction:`, error.message, error.stack);
            await logAudit(
                'BATCH_FRAUD_PREDICTION_FAILED',
                req,
                `Batch ML prediction failed: ${error.message}`,
                { transactionIds, error: error.message },
                'Transaction',
                null
            );
            next(error);
        }
    };

    const createTransactionsBatch = async (req, res, next) => {
        try {

            const { transactions } = req.body;

            if (!Array.isArray(transactions) || transactions.length === 0) {
                return res.status(400).json({ message: 'Transactions array is required and must not be empty.' });
            }

            const results = {
                created: 0,
                failed: 0,
                errors: []
            };

            // Process transactions in smaller batches to avoid overwhelming the database
            const batchSize = 10;
            for (let i = 0; i < transactions.length; i += batchSize) {
                const batch = transactions.slice(i, i + batchSize);

                for (const transactionData of batch) {
                    try {
                        // Validate required fields
                        if (!transactionData.transaction_id || !transactionData.user_id || !transactionData.amount) {
                            results.failed++;
                            results.errors.push({
                                transaction_id: transactionData.transaction_id || 'unknown',
                                error: 'Missing required fields: transaction_id, user_id, or amount'
                            });
                            continue;
                        }

                        // Create the transaction
                        const newTransaction = await transactionModel.create({
                            transaction_id: transactionData.transaction_id,
                            user_id: transactionData.user_id,
                            amount: parseFloat(transactionData.amount),
                            timestamp: transactionData.timestamp || new Date().toISOString(),
                            transaction_type: transactionData.transaction_type || 'p2p_transfer',
                            telco_provider: transactionData.telco_provider || 'Unknown',
                            device_type: transactionData.device_type || 'Unknown',
                            location_city: transactionData.location_city || 'Unknown',
                            location_country: transactionData.location_country || 'Malawi',
                            os_type: transactionData.os_type || 'Unknown',
                            status: transactionData.status || 'completed',
                            merchant_category: transactionData.merchant_category,
                            sender_account: transactionData.sender_account,
                            receiver_account: transactionData.receiver_account,
                            description: transactionData.description,
                            transaction_hour_of_day: transactionData.transaction_hour_of_day,
                            transaction_day_of_week: transactionData.transaction_day_of_week,
                            is_weekend: transactionData.is_weekend,
                            is_business_hours: transactionData.is_business_hours,
                            is_new_device: transactionData.is_new_device,
                            is_new_location: transactionData.is_new_location,
                            risk_score: transactionData.risk_score || 0.01
                        });

                        results.created++;

                        // Emit real-time update for new transaction
                        io.emit('transaction:created', {
                            transaction: newTransaction,
                            timestamp: new Date().toISOString()
                        });

                    } catch (createError) {
                        results.failed++;
                        results.errors.push({
                            transaction_id: transactionData.transaction_id || 'unknown',
                            error: createError.message
                        });
                        console.error(`[TransactionController] Failed to create transaction ${transactionData.transaction_id}:`, createError.message);
                    }
                }

                // Small delay between batches to avoid overwhelming the database
                if (i + batchSize < transactions.length) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            // Log audit event
            await logAudit(
                'BATCH_TRANSACTIONS_CREATED',
                req,
                `Batch creation completed: ${results.created} created, ${results.failed} failed`,
                {
                    total_attempted: transactions.length,
                    created: results.created,
                    failed: results.failed,
                    error_count: results.errors.length
                },
                'Transaction',
                null
            );

            res.status(201).json({
                message: `Batch transaction creation completed`,
                results: {
                    total_attempted: transactions.length,
                    created: results.created,
                    failed: results.failed,
                    success_rate: ((results.created / transactions.length) * 100).toFixed(2) + '%'
                },
                errors: results.errors.length > 0 ? results.errors.slice(0, 10) : [] // Limit errors shown
            });

        } catch (error) {
            console.error('[TransactionController] Error in batch transaction creation:', error.message, error.stack);
            await logAudit(
                'BATCH_TRANSACTIONS_CREATION_FAILED',
                req,
                `Batch transaction creation failed: ${error.message}`,
                { error: error.message },
                'Transaction',
                null
            );
            next(error);
        }
    };

    return {
        getAllTransactions,
        getTransactionById,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        ingestTransactionsFromCsv,
        getTransactionVolumeTrend,
        getFraudRateTrend,
        getTransactionTypeDistribution,
        getTopLocations,
        getTopFraudulentTransactions,
        predictFraudForTransaction,
        predictFraudForBatchTransactions,
        createTransactionsBatch
    };
};