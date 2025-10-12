import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Users, DollarSign } from 'lucide-react';
import api from '../../api/axios.ts';

interface FraudSummaryData {
    totalTransactions: number;
    fraudulentTransactions: number;
    fraudRate: number;
    totalAmount: number;
    fraudulentAmount: number;
    avgFraudAmount: number;
    topFraudTypes: Array<{
        type: string;
        count: number;
        percentage: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        fraudCount: number;
        totalCount: number;
        fraudRate: number;
    }>;
}

interface FraudSummaryReportProps {
    startDate?: string;
    endDate?: string;
}

const FraudSummaryReport: React.FC<FraudSummaryReportProps> = ({ startDate, endDate }) => {
    const [data, setData] = useState<FraudSummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/reports/fraud-summary', { params: { startDate, endDate } });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch fraud summary data');
            console.error('Error fetching fraud summary:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"></div>
                <span className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading Fraud Summary Report</span>
                <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">Analyzing transaction data...</span>
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

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
                <Shield className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Fraud Data Available</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                    No fraud summary data found for the selected date range. Try adjusting your date filters or check back later as new transactions are processed.
                </p>
            </div>
        );
    }

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

    const formatCurrency = (amount: number) => {
        return 'MWK' + new Intl.NumberFormat('en-MW', {
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercentage = (value: number | undefined | null) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '0.00%';
        }
        return `${Number(value).toFixed(2)}%`;
    };

    return (
        <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {data?.totalTransactions?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fraudulent Transactions</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {data?.fraudulentTransactions?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fraud Rate</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {formatPercentage(data?.fraudRate || 0)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-orange-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(data?.totalAmount || 0)}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fraudulent Amount</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(data?.fraudulentAmount || 0)}
                            </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Fraud Amount</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {formatCurrency(data?.avgFraudAmount || 0)}
                            </p>
                        </div>
                        <Shield className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fraud Types Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Top Fraud Types
                    </h3>
                    {data?.topFraudTypes && data.topFraudTypes.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.topFraudTypes}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ type, percentage }) => `${type}: ${percentage.toFixed(1)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {data?.topFraudTypes?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [value, 'Count']} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            No fraud type data available
                        </div>
                    )}
                </div>

                {/* Monthly Trend */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Monthly Fraud Trend
                    </h3>
                    {data?.monthlyTrend && data.monthlyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data?.monthlyTrend || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip 
                                    formatter={(value: any, name: string) => [
                                        name === 'fraudRate' ? `${value.toFixed(2)}%` : value,
                                        name === 'fraudCount' ? 'Fraud Count' : 
                                        name === 'totalCount' ? 'Total Count' : 'Fraud Rate'
                                    ]}
                                />
                                <Bar dataKey="fraudCount" fill="#ef4444" name="fraudCount" />
                                <Bar dataKey="totalCount" fill="#3b82f6" name="totalCount" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            No trend data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FraudSummaryReport;
