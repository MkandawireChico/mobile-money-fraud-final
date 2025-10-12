import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, DollarSign, Clock, MapPin, User, Shield } from 'lucide-react';
import api from '../../api/axios.ts';

interface HighRiskTransaction {
    id: string;
    transaction_id: string;
    amount: number;
    transaction_type: string;
    sender_id: string;
    receiver_id: string;
    timestamp: string;
    location: string;
    risk_score: number;
    fraud_probability: number;
    risk_factors: string[];
    status: string;
}

interface HighRiskTransactionsData {
    transactions: HighRiskTransaction[];
    totalCount: number;
    avgRiskScore: number;
    highestRiskScore: number;
    riskDistribution: Array<{
        range: string;
        count: number;
        percentage: number;
    }>;
}

interface HighRiskTransactionsReportProps {
    startDate?: string;
    endDate?: string;
    limit?: number;
}

const HighRiskTransactionsReport: React.FC<HighRiskTransactionsReportProps> = ({ 
    startDate, 
    endDate, 
    limit = 50 
}) => {
    const [data, setData] = useState<HighRiskTransactionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<HighRiskTransaction | null>(null);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate, limit]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/reports/high-risk-transactions', { params: { startDate, endDate, limit } });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch high-risk transactions data');
            console.error('Error fetching high-risk transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600 dark:border-gray-600 dark:border-t-red-400"></div>
                <span className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading High-Risk Transactions</span>
                <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">Analyzing risk patterns...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600 dark:text-red-400 p-6">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-semibold">Error Loading Report</p>
                <p className="text-sm mt-2">{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!data || !data.transactions || data.transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
                <Shield className="w-16 h-16 text-green-500 dark:text-green-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">All Clear! No High-Risk Transactions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                    Great news! No high-risk transactions detected for the selected date range. Your fraud detection system is working effectively to keep transactions secure.
                </p>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return 'MWK' + new Intl.NumberFormat('en-MW', {
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDateTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('en-MW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRiskColor = (riskScore: number) => {
        // Convert decimal risk score (0-1) to percentage (0-100) for comparison
        const scorePercent = riskScore * 100;
        if (scorePercent >= 80) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
        if (scorePercent >= 60) return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900';
        if (scorePercent >= 40) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
    };

    const getRiskLabel = (riskScore: number) => {
        // Convert decimal risk score (0-1) to percentage (0-100) for comparison
        const scorePercent = riskScore * 100;
        if (scorePercent >= 80) return 'Critical';
        if (scorePercent >= 60) return 'High';
        if (scorePercent >= 40) return 'Medium';
        return 'Low';
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total High-Risk</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {data?.totalCount?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Risk Score</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {data?.avgRiskScore?.toFixed(1) || '0.0'}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-orange-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Highest Risk</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {data?.highestRiskScore?.toFixed(1) || '0.0'}
                            </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Showing</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {Math.min(limit, data?.transactions?.length || 0)}
                            </p>
                        </div>
                        <Eye className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
            </div>

            {/* Risk Distribution */}
            {data?.riskDistribution && data.riskDistribution.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Risk Score Distribution
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {data?.riskDistribution?.map((dist, index) => (
                            <div key={index} className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {dist.count}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{dist.range}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                    {dist.percentage.toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        High-Risk Transactions
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Transaction
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Risk Score
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {data?.transactions?.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {transaction.transaction_id}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {transaction.transaction_type}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {formatCurrency(transaction.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(transaction.risk_score)}`}>
                                            {getRiskLabel(transaction.risk_score)} ({Number(transaction.risk_score || 0).toFixed(1)})
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {formatDateTime(transaction.timestamp)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            {transaction.location || 'Unknown'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => setSelectedTransaction(transaction)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction Details Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Transaction Details
                            </h3>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction ID</label>
                                    <p className="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                        {selectedTransaction.transaction_id}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</label>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(selectedTransaction.amount)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Score</label>
                                    <p className={`text-sm font-semibold ${getRiskColor(selectedTransaction.risk_score)}`}>
                                        {Number(selectedTransaction.risk_score || 0).toFixed(1)} ({getRiskLabel(selectedTransaction.risk_score)})
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Fraud Probability</label>
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                        {(Number(selectedTransaction.fraud_probability || 0) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            {selectedTransaction.risk_factors && selectedTransaction.risk_factors.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Factors</label>
                                    <div className="mt-2 space-y-1">
                                        {selectedTransaction.risk_factors.map((factor, index) => (
                                            <span key={index} className="inline-block bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded mr-2 mb-1">
                                                {factor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Sender</label>
                                    <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                        {selectedTransaction.sender_id}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Receiver</label>
                                    <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                        {selectedTransaction.receiver_id}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HighRiskTransactionsReport;
