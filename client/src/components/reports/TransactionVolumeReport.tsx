import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import api from '../../api/axios.ts';

interface TransactionVolumeData {
    totalTransactions: number;
    totalAmount: number;
    avgTransactionAmount: number;
    dailyVolume: Array<{
        date: string;
        count: number;
        amount: number;
    }>;
    hourlyDistribution: Array<{
        hour: number;
        count: number;
        amount: number;
    }>;
    typeDistribution: Array<{
        type: string;
        count: number;
        amount: number;
        percentage: number;
    }>;
}

interface TransactionVolumeReportProps {
    startDate?: string;
    endDate?: string;
    limit?: number;
}

const TransactionVolumeReport: React.FC<TransactionVolumeReportProps> = ({ 
    startDate, 
    endDate, 
    limit = 100 
}) => {
    const [data, setData] = useState<TransactionVolumeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate, limit]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/reports/transaction-volume', { params: { startDate, endDate, limit } });
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch transaction volume data');
            console.error('Error fetching transaction volume:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 dark:border-gray-600 dark:border-t-green-400"></div>
                <span className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Loading Transaction Volume Report</span>
                <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">Processing transaction analytics...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600 dark:text-red-400 p-6">
                <Activity className="w-12 h-12 mx-auto mb-4" />
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
            <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
                <Activity className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Transaction Data Available</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                    No transaction volume data found for the selected date range. Expand your date range or check back as new transactions are processed by the system.
                </p>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return 'MWK' + new Intl.NumberFormat('en-MW', {
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-MW', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {data?.totalTransactions?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <Activity className="w-8 h-8 text-blue-500" />
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
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Transaction</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {formatCurrency(data?.avgTransactionAmount || 0)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Volume Trend */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Daily Transaction Volume
                    </h3>
                    {data?.dailyVolume && data.dailyVolume.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data?.dailyVolume || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={formatDate}
                                />
                                <YAxis />
                                <Tooltip 
                                    labelFormatter={(value) => `Date: ${formatDate(value)}`}
                                    formatter={(value: any, name: string) => [
                                        name === 'amount' ? formatCurrency(value) : value.toLocaleString(),
                                        name === 'count' ? 'Transactions' : 'Amount'
                                    ]}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                    name="count"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            No daily volume data available
                        </div>
                    )}
                </div>

                {/* Hourly Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Hourly Distribution
                    </h3>
                    {data?.hourlyDistribution && data.hourlyDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data?.hourlyDistribution || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="hour" 
                                    tickFormatter={(value) => `${value}:00`}
                                />
                                <YAxis />
                                <Tooltip 
                                    labelFormatter={(value) => `Hour: ${value}:00`}
                                    formatter={(value: any, name: string) => [
                                        name === 'amount' ? formatCurrency(value) : value.toLocaleString(),
                                        name === 'count' ? 'Transactions' : 'Amount'
                                    ]}
                                />
                                <Bar dataKey="count" fill="#22c55e" name="count" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            No hourly distribution data available
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Types Table */}
            {data?.typeDistribution && data.typeDistribution.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Transaction Types Distribution
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Transaction Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Count
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Total Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Percentage
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data?.typeDistribution?.map((type, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {type.type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {type?.count?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatCurrency(type?.amount || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center">
                                                <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                                                    <div 
                                                        className="bg-blue-600 h-2 rounded-full" 
                                                        style={{ width: `${type?.percentage || 0}%` }}
                                                    ></div>
                                                </div>
                                                {type?.percentage?.toFixed(1) || '0'}%
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionVolumeReport;
