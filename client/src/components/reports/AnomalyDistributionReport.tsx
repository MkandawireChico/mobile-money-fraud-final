import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, MapPin, Clock, TrendingUp } from 'lucide-react';
import api from '../../api/axios.ts';

interface AnomalyDistributionData {
    totalAnomalies: number;
    anomalyRate: number;
    typeDistribution: Array<{
        type: string;
        count: number;
        percentage: number;
    }>;
    locationDistribution: Array<{
        location: string;
        count: number;
        percentage: number;
    }>;
    timeDistribution: Array<{
        hour: number;
        count: number;
    }>;
    severityDistribution: Array<{
        severity: string;
        count: number;
        percentage: number;
    }>;
}

interface AnomalyDistributionReportProps {
    startDate?: string;
    endDate?: string;
}

const AnomalyDistributionReport: React.FC<AnomalyDistributionReportProps> = ({ startDate, endDate }) => {
    console.log('[AnomalyDistribution] Component rendered with props:', { startDate, endDate });
    
    const [data, setData] = useState<AnomalyDistributionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    console.log('[AnomalyDistribution] Current state:', { data, loading, error });

    // Clear data and fetch when props change
    useEffect(() => {
        console.log('[AnomalyDistribution] Props changed, clearing data and fetching fresh');
        setData(null);
        setLoading(true);
        setError(null);
        fetchData();
    }, [startDate, endDate]);
    
    // Force initial load
    useEffect(() => {
        console.log('[AnomalyDistribution] Component mounted, forcing initial fetch');
        setData(null);
        setLoading(true);
        setError(null);
        fetchData();
    }, []);

    const fetchData = async () => {
        console.log('[AnomalyDistribution] Starting fetchData with params:', { startDate, endDate });
        try {
            setLoading(true);
            setError(null);
            const timestamp = Date.now();
            console.log('[AnomalyDistribution] Making API call with timestamp:', timestamp);
            const response = await api.get('/reports/anomaly-distribution', { 
                params: { 
                    startDate, 
                    endDate, 
                    _t: timestamp,
                    _cache: Math.random().toString(36).substring(7) // Additional cache buster
                },
                headers: { 
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'If-None-Match': '*' // Force no conditional requests
                },
                timeout: 10000 // 10 second timeout
            });
            console.log('[AnomalyDistribution] API Response:', response.data);
            console.log('[AnomalyDistribution] API Response keys:', Object.keys(response.data));
            console.log('[AnomalyDistribution] typeDistribution:', response.data.typeDistribution);
            console.log('[AnomalyDistribution] locationDistribution:', response.data.locationDistribution);
            
            // Handle the actual response structure
            const responseData = response.data;
            if (responseData.distribution) {
                // If data is wrapped in distribution object, extract it
                console.log('[AnomalyDistribution] Distribution object found:', responseData.distribution);
                const distributionData = responseData.distribution;
                const processedData = {
                    totalAnomalies: responseData.totalAnomalies || 0,
                    anomalyRate: distributionData.anomalyRate || 0,
                    typeDistribution: distributionData.typeDistribution || [],
                    locationDistribution: distributionData.locationDistribution || [],
                    timeDistribution: distributionData.timeDistribution || [],
                    severityDistribution: distributionData.severityDistribution || [],
                    dateRange: responseData.dateRange
                };
                console.log('[AnomalyDistribution] Processed data:', processedData);
                setData(processedData);
            } else {
                // Use response as-is if it has the expected structure
                setData(responseData);
            }
        } catch (err: any) {
            console.error('[AnomalyDistribution] Error in fetchData:', err);
            console.error('[AnomalyDistribution] Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            setError(err.response?.data?.error || err.message || 'Failed to fetch anomaly distribution data');
        } finally {
            console.log('[AnomalyDistribution] Setting loading to false');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading anomaly distribution...</span>
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
        console.log('[AnomalyDistribution] No data available, data state:', data);
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 p-6">
                <p>No anomaly distribution data available for the selected date range.</p>
                <p className="text-xs mt-2">Debug: data = {JSON.stringify(data)}</p>
            </div>
        );
    }
    
    console.log('[AnomalyDistribution] Rendering with data:', {
        totalAnomalies: data.totalAnomalies,
        typeDistributionLength: data.typeDistribution?.length,
        locationDistributionLength: data.locationDistribution?.length
    });

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Anomalies</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {data?.totalAnomalies?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Anomaly Rate</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {data?.anomalyRate?.toFixed(2) || '0.00'}%
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Anomaly Types */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Anomaly Types Distribution
                    </h3>
                    {data?.typeDistribution && data.typeDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data?.typeDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ type, percentage }) => `${type}: ${percentage.toFixed(1)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {data?.typeDistribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [value, 'Count']} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            No anomaly type data available
                        </div>
                    )}
                </div>

                {/* Location Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Location Distribution
                    </h3>
                    {data?.locationDistribution && data.locationDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data?.locationDistribution || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="location" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => [value, 'Anomalies']} />
                                <Bar dataKey="count" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            No location data available
                        </div>
                    )}
                </div>

                {/* Time Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Hourly Distribution
                    </h3>
                    {data?.timeDistribution && data.timeDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data?.timeDistribution || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="hour" 
                                    tickFormatter={(value) => `${value}:00`}
                                />
                                <YAxis />
                                <Tooltip 
                                    labelFormatter={(value) => `Hour: ${value}:00`}
                                    formatter={(value: any) => [value, 'Anomalies']}
                                />
                                <Bar dataKey="count" fill="#f97316" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            No time distribution data available
                        </div>
                    )}
                </div>

                {/* Severity Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Severity Distribution
                    </h3>
                    {data?.severityDistribution && data.severityDistribution.length > 0 ? (
                        <div className="space-y-4">
                            {data?.severityDistribution?.map((severity, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div 
                                            className="w-4 h-4 rounded mr-3"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {severity.severity}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {severity.count}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            ({severity.percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                            No severity data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnomalyDistributionReport;
