// client/src/api/axios.js
import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 30000, // Increased timeout for ML operations
    headers: {
        'Content-Type': 'application/json',
    },
});

instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            if (!config.headers) {
                config.headers = {} as import('axios').AxiosRequestHeaders;
            }
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            console.error('Unauthorized request. Redirecting to login.');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ML-specific API endpoints for the comprehensive fraud detection system
export const mlApi = {
    // Analyze single transaction with comprehensive ML model
    analyzeTransaction: (transactionId: string) => 
        instance.post(`/ml/analyze-transaction/${transactionId}`),
    
    // Get detailed anomaly explanation
    getAnomalyExplanation: (transactionId: string) => 
        instance.get(`/ml/explain-anomaly/${transactionId}`),
    
    // Get ML model status and performance metrics
    getModelStatus: () => 
        instance.get('/ml/model-status'),
    
    // Get model performance dashboard data
    getModelMetrics: () => 
        instance.get('/ml/model-metrics'),
    
    // Batch analyze multiple transactions
    batchAnalyze: (transactionIds: string[]) => 
        instance.post('/ml/batch-analyze', { transaction_ids: transactionIds }),
    
    // Get feature importance for a specific transaction
    getFeatureContributions: (transactionId) => 
        instance.get(`/ml/feature-contributions/${transactionId}`),
    
    // Trigger model retraining (admin only)
    retrainModel: () => 
        instance.post('/ml/retrain-model'),
    
    // Get training history and model comparison
    getTrainingHistory: () => 
        instance.get('/ml/training-history'),
    
    // Update anomaly score thresholds
    updateThresholds: (thresholds) => 
        instance.put('/ml/thresholds', thresholds),
    
    // Get anomaly score distribution for dashboard
    getAnomalyDistribution: (dateRange) => 
        instance.get('/ml/anomaly-distribution', { params: dateRange })
};

// Enhanced transaction API with ML integration
export const transactionApi = {
    // Get transactions with ML analysis results
    getTransactions: (params = {}) => 
        instance.get('/transactions', { params }),
    
    // Get single transaction with detailed ML analysis
    getTransactionById: (id) => 
        instance.get(`/transactions/${id}`),
    
    // Trigger ML prediction for existing transaction
    predictFraud: (transactionId) => 
        instance.post(`/transactions/predict/${transactionId}`),
    
    // Batch prediction for multiple transactions
    batchPredict: (transactionIds) => 
        instance.post('/transactions/predict/batch', { transactionIds: transactionIds }),
    
    // Update transaction status after manual review
    updateTransactionStatus: (transactionId, status, reason) => 
        instance.put(`/transactions/${transactionId}/status`, { status, reason }),
    
    // Mark transaction as safe (false positive)
    markAsSafe: (transactionId, reason) => 
        instance.post(`/transactions/${transactionId}/mark-safe`, { reason }),
    
    // Escalate high-risk transaction
    escalateTransaction: (transactionId, reason) => 
        instance.post(`/transactions/${transactionId}/escalate`, { reason })
};

// Enhanced anomaly API with ML context
export const anomalyApi = {
    // Get anomalies with ML model information
    getAnomalies: (params = {}) => 
        instance.get('/anomalies', { params }),
    
    // Get single anomaly with ML explanation
    getAnomalyById: (id) => 
        instance.get(`/anomalies/${id}`),
    
    // Update anomaly status with ML context
    updateAnomalyStatus: (anomalyId, status, resolution_notes) => 
        instance.put(`/anomalies/${anomalyId}`, { status, resolution_notes }),
    
    // Get anomaly trends for dashboard
    getAnomalyTrends: (dateRange) => 
        instance.get('/anomalies/trends', { params: dateRange }),
    
    // Get anomaly statistics by model
    getAnomalyStatsByModel: () => 
        instance.get('/anomalies/stats-by-model'),
    
    // Provide feedback on anomaly accuracy (for model improvement)
    provideFeedback: (anomalyId, feedback) => 
        instance.post(`/anomalies/${anomalyId}/feedback`, { feedback })
};

// Dashboard API with ML metrics
export const dashboardApi = {
    // Get comprehensive dashboard metrics including ML performance
    getDashboardMetrics: (dateRange) => 
        instance.get('/dashboard/metrics', { params: dateRange }),
    
    // Get real-time anomaly detection metrics
    getRealTimeMetrics: () => 
        instance.get('/dashboard/realtime-metrics'),
    
    // Get model performance over time
    getModelPerformanceHistory: (dateRange) => 
        instance.get('/dashboard/model-performance', { params: dateRange }),
    
    // Get top risk factors from current model
    getTopRiskFactors: () => 
        instance.get('/dashboard/top-risk-factors'),
    
    // Get anomaly detection rate trends
    getDetectionRateTrends: (dateRange) => 
        instance.get('/dashboard/detection-trends', { params: dateRange })
};

// System health API
export const systemApi = {
    // Check overall system health including ML service
    getSystemHealth: () => 
        instance.get('/system/health'),
    
    // Get processing queue status
    getQueueStatus: () => 
        instance.get('/system/queue-status'),
    
    // Get system performance metrics
    getPerformanceMetrics: () => 
        instance.get('/system/performance'),

    // Report API functions
    getFraudSummaryReport: (startDate?: string, endDate?: string) => 
        instance.get('/reports/fraud-summary', { params: { startDate, endDate } }),
    
    getTransactionVolumeReport: (startDate?: string, endDate?: string, limit?: number) => 
        instance.get('/reports/transaction-volume', { params: { startDate, endDate, limit } }),
    
    getHighRiskTransactionsReport: (startDate?: string, endDate?: string, limit?: number) => 
        instance.get('/reports/high-risk-transactions', { params: { startDate, endDate, limit } }),
    
    getUserActivityReport: (startDate?: string, endDate?: string, limit?: number) => 
        instance.get('/reports/user-activity', { params: { startDate, endDate, limit } }),
    
    getAnomalyDistributionReport: (startDate?: string, endDate?: string) => 
        instance.get('/reports/anomaly-distribution', { params: { startDate, endDate } })
};

export default instance;