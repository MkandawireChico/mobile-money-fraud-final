import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Activity, Clock, TrendingUp, Eye } from 'lucide-react';
import api from '../../api/axios.ts';

interface UserActivityData {
    totalUsers: number;
    activeUsers: number;
    activityRate: number;
    avgTransactionsPerUser: number;
    usersByRole: Array<{
        role: string;
        count: number;
        percentage: number;
    }>;
    dailyActivity: Array<{
        date: string;
        activeUsers: number;
        transactions: number;
    }>;
    topUsers: Array<{
        id: string;
        username: string;
        role: string;
        transactionCount: number;
        lastActivity: string;
        riskScore: number;
    }>;
}

interface UserActivityReportProps {
    startDate?: string;
    endDate?: string;
    limit?: number;
}

const UserActivityReport: React.FC<UserActivityReportProps> = ({ startDate, endDate, limit = 50 }) => {
    const [data, setData] = useState<UserActivityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate, limit]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const timestamp = Date.now();
            console.log('[UserActivity] Making API call with timestamp:', timestamp);
            const response = await api.get('/reports/user-activity', { 
                params: { 
                    startDate, 
                    endDate, 
                    limit, 
                    _t: timestamp,
                    _cache: Math.random().toString(36).substring(7)
                },
                headers: { 
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'If-None-Match': '*'
                },
                timeout: 10000
            });
            console.log('[UserActivity] API Response:', response.data);
            setData(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch user activity data');
            console.error('Error fetching user activity:', err);
        } finally {
            setLoading(false);
        }
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
        if (riskScore >= 0.8) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
        if (riskScore >= 0.6) return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900';
        if (riskScore >= 0.4) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading user activity...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600 dark:text-red-400 p-6">
                <Users className="w-12 h-12 mx-auto mb-4" />
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
        console.log('[UserActivity] No data available, data state:', data);
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 p-6">
                <p>No user activity data available for the selected date range.</p>
                <p className="text-xs mt-2">Debug: data = {JSON.stringify(data)}</p>
            </div>
        );
    }
    
    console.log('[UserActivity] Rendering with data:', {
        totalUsers: data.totalUsers,
        activeUsers: data.activeUsers,
        topUsersCount: data.topUsers?.length,
        usersByRoleCount: data.usersByRole?.length
    });

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {data?.totalUsers?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {data?.activeUsers?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <Activity className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activity Rate</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {data?.activityRate?.toFixed(1) || '0.0'}%
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-orange-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Transactions</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {data?.avgTransactionsPerUser?.toFixed(1) || '0.0'}
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users by Role */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Users by Role
                    </h3>
                    {data?.usersByRole && data.usersByRole.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data?.usersByRole || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="role" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => [value, 'Users']} />
                                <Bar dataKey="count" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            No role distribution data available
                        </div>
                    )}
                </div>

                {/* Daily Activity Trend */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Daily Activity Trend
                    </h3>
                    {data?.dailyActivity && data.dailyActivity.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data?.dailyActivity || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line 
                                    type="monotone" 
                                    dataKey="activeUsers" 
                                    stroke="#10b981" 
                                    strokeWidth={2}
                                    name="Active Users"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="transactions" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                    name="Transactions"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            No daily activity data available
                        </div>
                    )}
                </div>
            </div>

            {/* Top Users Table */}
            {data?.topUsers && data.topUsers.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Top Active Users
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Transactions
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Risk Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Last Activity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data?.topUsers?.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {user.username}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    ID: {user.id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {user?.transactionCount?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(user.riskScore)}`}>
                                                {Number(user.riskScore || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {formatDateTime(user.lastActivity)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedUser(user)}
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
            )}

            {/* User Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                User Details: {selectedUser.username}
                            </h3>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID</label>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {selectedUser.id}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</label>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {selectedUser.role}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction Count</label>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {selectedUser.transactionCount?.toLocaleString() || '0'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Score</label>
                                    <p className={`text-sm font-semibold ${getRiskColor(selectedUser.riskScore)}`}>
                                        {Number(selectedUser.riskScore || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Activity</label>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {formatDateTime(selectedUser.lastActivity)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserActivityReport;
