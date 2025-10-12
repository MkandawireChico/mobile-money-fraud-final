const express = require('express');
const router = express.Router();

module.exports = (models, services, middleware) => {
    const { Transaction, AuditLog, User } = models;
    const { auditService } = services;
    const { authenticateToken, requireRole } = middleware;

    router.post('/:transactionId/decision', authenticateToken, requireRole(['admin', 'analyst']), async (req, res) => {
        const { transactionId } = req.params;
        const { decision, notes, analyst_id } = req.body;

        try {

            // Validate decision type
            const validDecisions = ['confirm_fraud', 'mark_legitimate', 'needs_review'];
            if (!validDecisions.includes(decision)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid decision type. Must be one of: confirm_fraud, mark_legitimate, needs_review'
                });
            }

            // Get transaction details
            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            // Update transaction based on decision
            let updateData = {
                case_status: decision,
                reviewed_by: req.user.id,
                reviewed_at: new Date().toISOString(),
                investigation_notes: notes || null
            };

            // Set fraud status based on decision
            if (decision === 'confirm_fraud') {
                updateData.is_fraud = true;
                updateData.fraud_confirmed_at = new Date().toISOString();
            } else if (decision === 'mark_legitimate') {
                updateData.is_fraud = false;
                updateData.fraud_cleared_at = new Date().toISOString();
            }

            // Update the transaction
            await Transaction.update(transactionId, updateData);

            // Create audit log entry
            await auditService.logAction({
                user_id: req.user.id,
                username: req.user.name || req.user.username || req.user.email,
                action: `case_decision_${decision}`,
                entity_type: 'transaction',
                entity_id: transactionId,
                details: {
                    decision: decision,
                    notes: notes,
                    previous_fraud_status: transaction.is_fraud,
                    new_fraud_status: updateData.is_fraud,
                    risk_score: transaction.risk_score,
                    amount: transaction.amount
                },
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });

            // If confirming fraud, create additional security actions
            if (decision === 'confirm_fraud') {
                // Log fraud confirmation
                await auditService.logAction({
                    user_id: req.user.id,
                    username: req.user.name || req.user.username || req.user.email,
                    action: 'fraud_confirmed',
                    entity_type: 'transaction',
                    entity_id: transactionId,
                    details: {
                        amount: transaction.amount,
                        sender: transaction.sender_account,
                        receiver: transaction.receiver_account,
                        analyst: req.user.username || req.user.email
                    },
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                });

                // - Block accounts if needed
                // - Send notifications
                // - Update user risk profiles
            }

            res.json({
                success: true,
                message: `Case ${decision.replace('_', ' ')} successfully`,
                data: {
                    transaction_id: transactionId,
                    decision: decision,
                    reviewed_by: req.user.id,
                    reviewed_at: updateData.reviewed_at
                }
            });

        } catch (error) {
            console.error(`[CaseReview] Error processing decision for transaction ${transactionId}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to process case decision',
                error: error.message
            });
        }
    });

    router.post('/:transactionId/notes', authenticateToken, requireRole(['admin', 'analyst']), async (req, res) => {
        const { transactionId } = req.params;
        const { notes } = req.body;

        try {

            // Check if transaction exists
            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            // Update investigation notes
            await Transaction.update(transactionId, {
                investigation_notes: notes,
                notes_updated_by: req.user.id,
                notes_updated_at: new Date().toISOString()
            });

            // Create audit log entry
            await auditService.logAction({
                user_id: req.user.id,
                username: req.user.name || req.user.username || req.user.email,
                action: 'investigation_notes_updated',
                entity_type: 'transaction',
                entity_id: transactionId,
                details: {
                    notes_length: notes ? notes.length : 0,
                    has_notes: !!notes
                },
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });

            res.json({
                success: true,
                message: 'Investigation notes saved successfully',
                data: {
                    transaction_id: transactionId,
                    notes_updated_at: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error(`[CaseReview] Error saving notes for transaction ${transactionId}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to save investigation notes',
                error: error.message
            });
        }
    });

    router.get('/:transactionId/timeline', authenticateToken, requireRole(['admin', 'analyst']), async (req, res) => {
        const { transactionId } = req.params;

        try {

            // Get audit logs for this transaction
            const auditLogsResult = await AuditLog.findAll({
                entity_type: 'transaction',
                entity_id: transactionId
            });

            // Extract the rows array from the result
            const auditLogs = auditLogsResult.rows || [];

            // Debug: Log the first audit log entry to see the structure
            if (auditLogs.length > 0) {
                console.log('[CaseReview] Sample audit log:', JSON.stringify(auditLogs[0], null, 2));
            }

            // Format timeline events - fetch usernames for logs that don't have them
            const timeline = await Promise.all(auditLogs.map(async (log) => {
                let displayName = log.username;
                
                // If no username in audit log, try to fetch it from user table
                if (!displayName && log.user_id && log.user_id !== 'system') {
                    try {
                        const user = await User.findById(log.user_id);
                        // Prioritize actual name, then username, then email
                        displayName = user?.name || user?.username || user?.email || log.user_id;
                    } catch (error) {
                        console.warn('[CaseReview] Could not fetch username for user_id:', log.user_id);
                        displayName = log.user_id;
                    }
                } else if (!displayName) {
                    displayName = log.user_id || 'System';
                }

                return {
                    id: log.id,
                    title: formatActionTitle(log.action_type || log.action, displayName),
                    description: formatActionDescription(log.action_type || log.action, log.details, displayName),
                    timestamp: log.timestamp,
                    user: displayName,
                    type: getEventType(log.action_type || log.action),
                    details: log.details
                };
            }));

            // Sort by timestamp (newest first)
            timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            res.json({
                success: true,
                data: timeline
            });

        } catch (error) {
            console.error(`[CaseReview] Error fetching timeline for transaction ${transactionId}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch case timeline',
                error: error.message
            });
        }
    });

    router.get('/:transactionId/risk-analysis', authenticateToken, requireRole(['admin', 'analyst']), async (req, res) => {
        const { transactionId } = req.params;

        try {

            // Get transaction details
            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            // Generate risk factors
            const riskFactors = generateRiskFactors(transaction);

            // Generate evidence
            const evidence = generateEvidence(transaction);

            res.json({
                success: true,
                data: {
                    risk_factors: riskFactors,
                    evidence: evidence,
                    overall_risk_score: transaction.risk_score,
                    risk_level: getRiskLevel(transaction.risk_score)
                }
            });

        } catch (error) {
            console.error(`[CaseReview] Error generating risk analysis for transaction ${transactionId}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate risk analysis',
                error: error.message
            });
        }
    });
    // Helper functions
    function formatActionTitle(action, username) {

        if (!action || typeof action !== 'string') {
            return 'System Action';
        }

        const displayName = username || 'Unknown User';
        const actionTitles = {
            'case_decision_confirm_fraud': 'Fraud Confirmed',
            'case_decision_mark_legitimate': 'Marked as Legitimate',
            'case_decision_needs_review': 'Flagged for Review',
            'investigation_notes_updated': 'Investigation Notes Updated',
            'fraud_confirmed': `Fraud Confirmed by ${displayName}`
        };
        return actionTitles[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    function formatActionDescription(action, details, username) {
        if (!details) return 'No additional details';
        if (!action || typeof action !== 'string') return 'System action performed';

        const displayName = username || 'Unknown User';
        switch (action) {
            case 'case_decision_confirm_fraud':
                return `${displayName} confirmed fraudulent activity. Amount: ${details.amount || 'N/A'}`;
            case 'case_decision_mark_legitimate':
                return `${displayName} verified transaction as legitimate. Amount: ${details.amount || 'N/A'}`;
            case 'case_decision_needs_review':
                return `${displayName} flagged for further investigation. Amount: ${details.amount || 'N/A'}`;
            case 'fraud_detected':
                return `ML model detected potential fraud with ${((details.risk_score || 0) * 100).toFixed(1)}% confidence`;
            case 'investigation_notes_updated':
                return `Investigation notes ${details.has_notes ? 'added' : 'cleared'} by ${displayName} (${details.notes_length || 0} characters)`;
            default:
                return details.message || 'System action performed';
        }
    }

    function getEventType(action) {
        if (!action || typeof action !== 'string') return 'system';
        if (action.includes('ml_') || action.includes('fraud_detected')) return 'ml';
        if (action.includes('case_decision') || action.includes('notes_updated')) return 'analyst';
        return 'system';
    }

    function generateRiskFactors(transaction) {
        const factors = [];

        // High amount risk
        if (transaction.amount > 100000) {
            factors.push({
                id: 'high-amount',
                title: 'Unusually High Amount',
                description: `Amount of ${Number(transaction.amount).toLocaleString()} MWK is significantly above average`,
                level: 'high',
                score: Math.min(95, 60 + (transaction.amount / 10000))
            });
        }

        // New location risk
        if (transaction.is_new_location) {
            factors.push({
                id: 'new-location',
                title: 'New Location Detected',
                description: 'First transaction from this location',
                level: 'medium',
                score: 72
            });
        }

        // New device risk
        if (transaction.is_new_device) {
            factors.push({
                id: 'new-device',
                title: 'New Device',
                description: 'Transaction from previously unseen device',
                level: 'medium',
                score: 68
            });
        }

        // Time pattern risk
        const hour = transaction.transaction_hour_of_day;
        if (hour !== null && (hour < 6 || hour > 22)) {
            factors.push({
                id: 'unusual-time',
                title: 'Unusual Time Pattern',
                description: 'Transaction outside normal business hours',
                level: 'medium',
                score: 65
            });
        }

        // Positive factors
        if (!transaction.is_new_device) {
            factors.push({
                id: 'known-device',
                title: 'Known Device',
                description: 'Transaction from recognized device',
                level: 'low',
                score: 25
            });
        }

        return factors;
    }

    function generateEvidence(transaction) {
        return [
            {
                id: 'ml-prediction',
                type: 'ml',
                title: 'ML Model Prediction',
                description: `Advanced fraud detection model flagged this transaction with ${((transaction.risk_score || 0) * 100).toFixed(1)}% confidence`,
                icon: 'TrendingUp'
            },
            {
                id: 'transaction-history',
                title: 'Transaction History',
                description: `User has completed ${transaction.user_total_transactions || 0} previous transactions`,
                icon: 'Activity',
                type: 'history'
            },
            {
                id: 'behavioral-analysis',
                title: 'Behavioral Analysis',
                description: `Transaction occurred at ${transaction.transaction_hour_of_day || 'unknown'}:00, ${transaction.is_new_location ? 'outside' : 'within'} user's typical activity pattern`,
                icon: 'Clock',
                type: 'behavior'
            },
            {
                id: 'device-analysis',
                title: 'Device Analysis',
                description: `${transaction.device_type || 'Unknown'} device from ${transaction.location_city || 'Unknown location'}`,
                icon: 'Smartphone',
                type: 'device'
            }
        ];
    }

    function getRiskLevel(riskScore) {
        if (riskScore >= 0.8) return 'high';
        if (riskScore >= 0.5) return 'medium';
        return 'low';
    }

    return router;
};
