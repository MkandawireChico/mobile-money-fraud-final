import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { 
    Brain, 
    Target, 
    TrendingUp, 
    AlertTriangle, 
    Shield, 
    Info,
    Zap,
    BarChart3,
    RefreshCw,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { mlApi } from '../../api/axios';

// Enhanced interface for comprehensive ML analysis
interface TransactionData {
    // Basic transaction fields
    amount: number;
    timestamp: string;
    transaction_type: string;
    device_type: string;
    os_type: string;
    location_city: string;
    network_operator: string;
    status: string;
    
    // Behavioral features for ML
    user_total_transactions: number;
    time_since_last_transaction_seconds: number;
    account_age_days: number;
    daily_transaction_count: number;
    amount_percentile_for_user: number;
    
    // Context flags
    is_weekend: boolean;
    is_business_hours: boolean;
    is_payday: boolean;
    is_new_device: boolean;
    is_new_location: boolean;
}

// Comprehensive ML response matching your trained model
interface MLAnalysisResponse {
    // Primary results
    anomaly_score: number; // 0-1 score from model
    risk_level: 'normal' | 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    
    // Model information
    model_used: string; // e.g., "elliptic_envelope"
    model_version: string;
    processing_time_ms: number;
    
    // Feature analysis
    feature_contributions: Array<{
        feature: string;
        contribution: number;
        value: any;
        description: string;
    }>;
    
    // Clustering information (for unsupervised learning)
    cluster_info?: {
        cluster_id: number;
        cluster_label: string;
        distance_to_center: number;
        is_outlier: boolean;
    };
    
    // Decision context
    requires_review: boolean;
    recommended_action: 'approve' | 'investigate' | 'escalate';
    explanation: string;
}

interface ModelStatus {
    status: 'active' | 'training' | 'error';
    model_name: string;
    last_trained: string;
    performance_metrics: {
        silhouette_score: number;
        separation_quality: number;
        anomaly_percentage: number;
    };
}

// Realistic initial state based on Malawi mobile money patterns
const initialFormState: TransactionData = {
    amount: 5000.0, // K5,000 typical amount
    timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    transaction_type: 'airtime_purchase', // Most common type
    device_type: 'feature_phone', // 70% of users
    os_type: 'KaiOS',
    location_city: 'Lilongwe',
    network_operator: 'TNM', // 55% market share
    status: 'completed',
    user_total_transactions: 45,
    time_since_last_transaction_seconds: 3600, // 1 hour
    account_age_days: 180, // 6 months old account
    daily_transaction_count: 3,
    amount_percentile_for_user: 65.0,
    is_weekend: false,
    is_business_hours: true,
    is_payday: false,
    is_new_device: false,
    is_new_location: false
};

const FraudDetectionTool: React.FC = () => {
    const [formData, setFormData] = useState<TransactionData>(initialFormState);
    const [analysis, setAnalysis] = useState<MLAnalysisResponse | null>(null);
    const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Load model status on component mount
    useEffect(() => {
        loadModelStatus();
    }, []);

    const loadModelStatus = async () => {
        try {
            const response = await mlApi.getModelStatus();
            setModelStatus(response.data);
        } catch (err) {
            console.warn('Could not load model status:', err);
        }
    };

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : 
                   type === 'number' ? parseFloat(value) || 0 : 
                   value,
        }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            // Create a temporary transaction for analysis
            const transactionPayload = {
                ...formData,
                transaction_id: `temp_${Date.now()}`,
                user_id: `demo_user_${Math.random().toString(36).substr(2, 9)}`,
                currency: 'MWK'
            };

            // Call the comprehensive ML analysis API
            const response = await mlApi.analyzeTransaction(transactionPayload);
            setAnalysis(response.data);

        } catch (err: any) {
            console.error('ML Analysis Error:', err);
            setError(err.response?.data?.message || 'Failed to analyze transaction. Please check if the ML service is running.');
        } finally {
            setLoading(false);
        }
    }, [formData]);

    const getRiskLevelColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'critical': return 'text-red-700 bg-red-100 border-red-200';
            case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
            case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
            case 'low': return 'text-blue-700 bg-blue-100 border-blue-200';
            default: return 'text-green-700 bg-green-100 border-green-200';
        }
    };

    const getRiskIcon = (riskLevel: string) => {
        switch (riskLevel) {
            case 'critical':
            case 'high':
                return AlertTriangle;
            case 'medium':
                return TrendingUp;
            case 'low':
                return Info;
            default:
                return Shield;
        }
    };

    const renderAnalysisResults = () => {
        if (!analysis) return null;

        const RiskIcon = getRiskIcon(analysis.risk_level);
        const riskColorClass = getRiskLevelColor(analysis.risk_level);

        return (
            <div className="mt-8 space-y-6">
                {/* Main Result Card */}
                <div className={`p-6 rounded-lg border-2 ${riskColorClass}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <RiskIcon className="h-8 w-8" />
                            <div>
                                <h3 className="text-xl font-bold capitalize">{analysis.risk_level} Risk</h3>
                                <p className="text-sm opacity-75">{analysis.explanation}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">
                                {(analysis.anomaly_score * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm opacity-75">Anomaly Score</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                        <span>Model: {analysis.model_used}</span>
                        <span>Confidence: {(analysis.confidence * 100).toFixed(1)}%</span>
                        <span>Processed in {analysis.processing_time_ms}ms</span>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
                        <div className="flex items-center space-x-2 mb-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold">Anomaly Score</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                            {(analysis.anomaly_score * 100).toFixed(1)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${analysis.anomaly_score * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
                        <div className="flex items-center space-x-2 mb-2">
                            <Zap className="h-5 w-5 text-green-600" />
                            <span className="font-semibold">Confidence</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                            {(analysis.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Model certainty
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
                        <div className="flex items-center space-x-2 mb-2">
                            <Brain className="h-5 w-5 text-purple-600" />
                            <span className="font-semibold">Action</span>
                        </div>
                        <div className="text-lg font-semibold text-purple-600 capitalize">
                            {analysis.recommended_action}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Recommended
                        </div>
                    </div>
                </div>

                {/* Feature Contributions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
                    <div className="flex items-center space-x-2 mb-4">
                        <BarChart3 className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Top Contributing Factors</h3>
                    </div>
                    <div className="space-y-3">
                        {analysis.feature_contributions.slice(0, 5).map((contrib, index) => (
                            <div key={index} className="flex items-center space-x-4">
                                <div className="w-32 text-sm font-medium truncate">
                                    {contrib.feature}
                                </div>
                                <div className="flex-1">
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div 
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full" 
                                            style={{ width: `${Math.abs(contrib.contribution) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="w-16 text-sm text-right font-mono">
                                    {(contrib.contribution * 100).toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cluster Information (if available) */}
                {analysis.cluster_info && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
                        <h3 className="text-lg font-semibold mb-4">Behavioral Clustering</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Cluster:</span> {analysis.cluster_info.cluster_label}
                            </div>
                            <div>
                                <span className="font-medium">Distance to Center:</span> {analysis.cluster_info.distance_to_center.toFixed(3)}
                            </div>
                            <div>
                                <span className="font-medium">Outlier Status:</span>
                                <span className={`ml-1 ${analysis.cluster_info.is_outlier ? 'text-red-600' : 'text-green-600'}`}>
                                    {analysis.cluster_info.is_outlier ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700 w-full max-w-6xl mx-auto">
            {/* Header with Model Status */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Advanced Fraud Detection System
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Powered by Elliptic Envelope Unsupervised Learning
                    </p>
                </div>
                
                {modelStatus && (
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                            modelStatus.status === 'active' ? 'bg-green-500' : 
                            modelStatus.status === 'training' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Model {modelStatus.status}
                        </span>
                        <button
                            onClick={loadModelStatus}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transaction Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount (MWK)
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Transaction Type
                        </label>
                        <select
                            name="transaction_type"
                            value={formData.transaction_type}
                            onChange={handleInputChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                        >
                            <option value="airtime_purchase">Airtime Purchase</option>
                            <option value="p2p_transfer">P2P Transfer</option>
                            <option value="cash_out">Cash Out</option>
                            <option value="cash_in">Cash In</option>
                            <option value="bill_payment">Bill Payment</option>
                            <option value="merchant_payment">Merchant Payment</option>
                            <option value="loan_repayment">Loan Repayment</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Network Operator
                        </label>
                        <select
                            name="network_operator"
                            value={formData.network_operator}
                            onChange={handleInputChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                        >
                            <option value="TNM">TNM</option>
                            <option value="Airtel">Airtel</option>
                        </select>
                    </div>
                </div>

                {/* User Behavior Fields */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            User Total Transactions
                        </label>
                        <input
                            type="number"
                            name="user_total_transactions"
                            value={formData.user_total_transactions}
                            onChange={handleInputChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                            min="0"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Time Since Last Transaction (seconds)
                        </label>
                        <input
                            type="number"
                            name="time_since_last_transaction_seconds"
                            value={formData.time_since_last_transaction_seconds}
                            onChange={handleInputChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                            min="0"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Account Age (days)
                        </label>
                        <input
                            type="number"
                            name="account_age_days"
                            value={formData.account_age_days}
                            onChange={handleInputChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                            min="0"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount Percentile for User
                        </label>
                        <input
                            type="number"
                            name="amount_percentile_for_user"
                            value={formData.amount_percentile_for_user}
                            onChange={handleInputChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                            min="0"
                            max="100"
                            step="0.1"
                        />
                    </div>
                </div>

                {/* Context Flags */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { name: 'is_weekend', label: 'Weekend Transaction' },
                        { name: 'is_business_hours', label: 'Business Hours' },
                        { name: 'is_payday', label: 'Payday' },
                        { name: 'is_new_device', label: 'New Device' },
                        { name: 'is_new_location', label: 'New Location' }
                    ].map((field) => (
                        <div key={field.name} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name={field.name}
                                checked={formData[field.name]}
                                onChange={handleInputChange}
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <label className="text-sm text-gray-700 dark:text-gray-300">
                                {field.label}
                            </label>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                            Analyzing with ML Model...
                        </>
                    ) : (
                        <>
                            <Brain className="h-4 w-4 mr-2" />
                            Run Anomaly Detection
                        </>
                    )}
                </button>
            </form>

            {/* Error Display */}
            {error && (
                <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900 dark:border-red-700 dark:text-red-300">
                    <div className="flex items-center">
                        <XCircle className="h-5 w-5 mr-2" />
                        <div>
                            <p className="font-semibold">Analysis Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Display */}
            {renderAnalysisResults()}
        </div>
    );
};

export default FraudDetectionTool;