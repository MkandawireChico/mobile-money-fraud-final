// client/src/api/axios.ts
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

interface DateRange {
    start: string | Date;
    end: string | Date;
}

interface TransactionParams {
    [key: string]: any;
}

interface Feedback {
    [key: string]: any;
}

interface Thresholds {
    [key: string]: number;
}

const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem('token');
        if (token) {
            if (!config.headers) {
                config.headers = new AxiosHeaders();
            }
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError): Promise<never> => {
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
        return response;
    },
    (error: AxiosError): Promise<never> => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            console.error('Unauthorized request. Redirecting to login.');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const mlApi = {
    analyzeTransaction: (transactionId: string): Promise<AxiosResponse> => 
        instance.post(`/ml/analyze-transaction/${transactionId}`),
    
    getAnomalyExplanation: (transactionId: string): Promise<AxiosResponse> => 
        instance.get(`/ml/explain-anomaly/${transactionId}`),
    
    getModelStatus: (): Promise<AxiosResponse> => 
        instance.get('/ml/model-status'),
    
    getModelMetrics: (): Promise<AxiosResponse> => 
        instance.get('/ml/model-metrics'),
    
    batchAnalyze: (transactionIds: string[]): Promise<AxiosResponse> => 
        instance.post('/ml/batch-analyze', { transaction_ids: transactionIds }),
    
    getFeatureContributions: (transactionId: string): Promise<AxiosResponse> => 
        instance.get(`/ml/feature-contributions/${transactionId}`),
    
    retrainModel: (): Promise<AxiosResponse> => 
        instance.post('/ml/retrain-model'),
    
    getTrainingHistory: (): Promise<AxiosResponse> => 
        instance.get('/ml/training-history'),
    
    updateThresholds: (thresholds: Thresholds): Promise<AxiosResponse> => 
        instance.put('/ml/thresholds', thresholds),
    
    getAnomalyDistribution: (dateRange: DateRange): Promise<AxiosResponse> => 
        instance.get('/ml/anomaly-distribution', { params: dateRange })
};

export const transactionApi = {
    getTransactions: (params: TransactionParams = {}): Promise<AxiosResponse> => 
        instance.get('/transactions', { params }),
    
    getTransactionById: (id: string): Promise<AxiosResponse> => 
        instance.get(`/transactions/${id}`),
    
    predictFraud: (transactionId: string): Promise<AxiosResponse> => 
        instance.post(`/transactions/predict/${transactionId}`),
    
    batchPredict: (transactionIds: string[]): Promise<AxiosResponse> => 
        instance.post('/transactions/predict/batch', { transactionIds }),
    
    updateTransactionStatus: (
        transactionId: string, 
        status: string, 
        reason: string
    ): Promise<AxiosResponse> => 
        instance.put(`/transactions/${transactionId}/status`, { status, reason }),
    
    markAsSafe: (transactionId: string, reason: string): Promise<AxiosResponse> => 
        instance.post(`/transactions/${transactionId}/mark-safe`, { reason }),
    
    escalateTransaction: (transactionId: string, reason: string): Promise<AxiosResponse> => 
        instance.post(`/transactions/${transactionId}/escalate`, { reason })
};

export const anomalyApi = {
    getAnomalies: (params: TransactionParams = {}): Promise<AxiosResponse> => 
        instance.get('/anomalies', { params }),
    
    getAnomalyById: (id: string): Promise<AxiosResponse> => 
        instance.get(`/anomalies/${id}`),
    
    updateAnomalyStatus: (
        anomalyId: string, 
        status: string, 
        resolution_notes: string
    ): Promise<AxiosResponse> => 
        instance.put(`/anomalies/${anomalyId}`, { status, resolution_notes }),
    
    getAnomalyTrends: (dateRange: DateRange): Promise<AxiosResponse> => 
        instance.get('/anomalies/trends', { params: dateRange }),
    
    getAnomalyStatsByModel: (): Promise<AxiosResponse> => 
        instance.get('/anomalies/stats-by-model'),
    
    provideFeedback: (anomalyId: string, feedback: Feedback): Promise<AxiosResponse> => 
        instance.post(`/anomalies/${anomalyId}/feedback`, { feedback })
};

export const dashboardApi = {
    getDashboardMetrics: (dateRange: DateRange): Promise<AxiosResponse> => 
        instance.get('/dashboard/metrics', { params: dateRange }),
    
    getRealTimeMetrics: (): Promise<AxiosResponse> => 
        instance.get('/dashboard/realtime-metrics'),
    
    getModelPerformanceHistory: (dateRange: DateRange): Promise<AxiosResponse> => 
        instance.get('/dashboard/model-performance', { params: dateRange }),
    
    getTopRiskFactors: (): Promise<AxiosResponse> => 
        instance.get('/dashboard/top-risk-factors'),
    
    getDetectionRateTrends: (dateRange: DateRange): Promise<AxiosResponse> => 
        instance.get('/dashboard/detection-trends', { params: dateRange })
};

export const systemApi = {
    getSystemHealth: (): Promise<AxiosResponse> => 
        instance.get('/system/health'),
    
    getQueueStatus: (): Promise<AxiosResponse> => 
        instance.get('/system/queue-status'),
    
    getPerformanceMetrics: (): Promise<AxiosResponse> => 
        instance.get('/system/performance'),

    getFraudSummaryReport: (startDate?: string, endDate?: string): Promise<AxiosResponse> => 
        instance.get('/reports/fraud-summary', { params: { startDate, endDate } }),
    
    getTransactionVolumeReport: (
        startDate?: string, 
        endDate?: string, 
        limit?: number
    ): Promise<AxiosResponse> => 
        instance.get('/reports/transaction-volume', { params: { startDate, endDate, limit } }),
    
    getHighRiskTransactionsReport: (
        startDate?: string, 
        endDate?: string, 
        limit?: number
    ): Promise<AxiosResponse> => 
        instance.get('/reports/high-risk-transactions', { params: { startDate, endDate, limit } }),
    
    getUserActivityReport: (
        startDate?: string, 
        endDate?: string, 
        limit?: number
    ): Promise<AxiosResponse> => 
        instance.get('/reports/user-activity', { params: { startDate, endDate, limit } }),
    
    getAnomalyDistributionReport: (
        startDate?: string, 
        endDate?: string
    ): Promise<AxiosResponse> => 
        instance.get('/reports/anomaly-distribution', { params: { startDate, endDate } })
};

export default instance;