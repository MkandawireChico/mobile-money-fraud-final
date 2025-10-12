import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp as TrendIcon,
  PieChart as DistributionIcon,
  MapPin,
  BarChart3,
  Loader2,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.tsx';
import { useHistory } from 'react-router-dom';

const RECHARTS_COLORS = [
  '#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e', '#8b5cf6', '#ec4899', '#6b7280',
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

interface LocationData {
  location: string;
  transaction_count: number;
  total_amount: number;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const isAdmin = user?.role === 'admin';

  const [transactionVolumeData, setTransactionVolumeData] = useState<any[]>([]);
  const [anomalyRateTrendData, setAnomalyRateTrendData] = useState<any[]>([]);
  const [transactionTypeDistributionData, setTransactionTypeDistributionData] = useState<any[]>([]);
  const [topLocationsData, setTopLocationsData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [trendInterval, setTrendInterval] = useState<'day' | 'week' | 'month'>('day');
  const [locationType, setLocationType] = useState<'city' | 'country'>('country');
  const [locationOrderBy, setLocationOrderBy] = useState<'count' | 'amount'>('count');

  const isDarkMode = document.documentElement.classList.contains('dark');
  const textColor = isDarkMode ? '#e5e7eb' : '#1f2937';
  const gridColor = isDarkMode ? '#374151' : '#e0e0e0';
  const tooltipBg = isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const tooltipBorder = isDarkMode ? '#4b5563' : '#e5e7eb';

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const dateRange = getDateRange(timeRange);

      const [
        volumeRes,
        anomalyRateTrendRes,
        transactionTypeDistRes,
        topLocationsRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/transactions/volume`, { params: dateRange, ...config }),
        axios.get(`${API_BASE_URL}/api/anomalies/rate-trends`, { params: { interval: trendInterval, period: 365 }, ...config }),
        axios.get(`${API_BASE_URL}/api/transactions/types`, { params: { period: 365 }, ...config }),
        axios.get(`${API_BASE_URL}/api/dashboard/top-locations`, { params: { type: locationType, orderBy: locationOrderBy, limit: 10, period: 365 }, ...config }).catch(() => ({ data: [] }))
      ]);

      setTransactionVolumeData(volumeRes.data);
      setAnomalyRateTrendData(anomalyRateTrendRes.data);
      setTransactionTypeDistributionData(transactionTypeDistRes.data);
      setTopLocationsData(topLocationsRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, trendInterval, locationType, locationOrderBy]);

  const refreshAnalytics = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  }, [fetchAnalyticsData]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date(end);
    switch (range) {
      case '24h': start.setHours(end.getHours() - 24); break;
      case '7d': start.setDate(end.getDate() - 7); break;
      case '30d': start.setDate(end.getDate() - 30); break;
      case '90d': start.setDate(end.getDate() - 90); break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const renderCustomPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill={textColor} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-medium">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  const renderLegendContent = useCallback((props: any) => {
    const { payload } = props;
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-sm font-medium">
        {payload.map((entry: any, index: number) => {
          const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
          return (
            <li key={`item-${index}`} className="flex items-center" style={{ color: entry.color || textColor }}>
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
              {`${entry.payload.name || entry.payload.transaction_type || entry.payload.risk_level} (${percentage}%)`}
            </li>
          );
        })}
      </ul>
    );
  }, [textColor]);

  if (loading && !transactionVolumeData.length) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 size={60} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700 dark:text-gray-300">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-center">
          <h2 className="text-xl font-semibold mb-2">Analytics Error</h2>
          <p>{error}</p>
          <button onClick={refreshAnalytics} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen font-inter antialiased">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center">
            <button
              onClick={() => history.push('/dashboard')}
              className="mr-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <BarChart3 size={36} className="mr-4 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Detailed charts and transaction analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={refreshAnalytics}
              disabled={refreshing}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Transaction Volume */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-yellow-600" /> Transaction Volume
            </h2>
            <button className="text-gray-400 hover:text-blue-600 transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={transactionVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="timestamp" tick={{ fill: textColor }} />
              <YAxis tick={{ fill: textColor }} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} />
              <Legend />
              <Area type="monotone" dataKey="volume" stackId="1" stroke={RECHARTS_COLORS[2]} fill={RECHARTS_COLORS[2]} name="Volume" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Anomaly Rate Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <TrendIcon className="h-5 w-5 mr-2 text-red-600" /> Anomaly Rate Trend
            </h2>
            <div className="flex items-center space-x-2">
              <select
                value={trendInterval}
                onChange={(e) => setTrendInterval(e.target.value as any)}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
              <button className="text-gray-400 hover:text-blue-600 transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={anomalyRateTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: textColor }} />
              <YAxis tick={{ fill: textColor }} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} />
              <Legend />
              <Line type="monotone" dataKey="anomaly_rate" stroke={RECHARTS_COLORS[4]} activeDot={{ r: 6 }} name="Rate" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction Types Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <DistributionIcon className="h-5 w-5 mr-2 text-pink-600" /> Transaction Types
            </h2>
            <button className="text-gray-400 hover:text-blue-600 transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={transactionTypeDistributionData} dataKey="count" nameKey="transaction_type" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" label={renderCustomPieLabel}>
                {transactionTypeDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={RECHARTS_COLORS[index % RECHARTS_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => `${value} transactions`} contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} />
              <Legend content={renderLegendContent} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Locations */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-teal-600" /> Top Locations
            </h2>
            <div className="flex items-center space-x-2">
              <select value={locationType} onChange={(e) => setLocationType(e.target.value as any)} className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option value="city">City</option>
                <option value="country">Country</option>
              </select>
              <select value={locationOrderBy} onChange={(e) => setLocationOrderBy(e.target.value as any)} className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm">
                <option value="count">Count</option>
                <option value="amount">Amount</option>
              </select>
              <button className="text-gray-400 hover:text-blue-600 transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={topLocationsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="location" tick={{ fill: textColor }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fill: textColor }} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} />
              <Legend />
              {locationOrderBy === 'count' && <Bar dataKey="transaction_count" fill={RECHARTS_COLORS[2]} name="Count" />}
              {locationOrderBy === 'amount' && <Bar dataKey="total_amount" fill={RECHARTS_COLORS[0]} name="Amount" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Insights */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Transaction Patterns</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">Peak activity during business hours with 23% increase in mobile payments</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Anomaly Trends</h3>
            <p className="text-sm text-red-700 dark:text-red-300">Fraud attempts spike during weekends, requiring enhanced monitoring</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Geographic Distribution</h3>
            <p className="text-sm text-green-700 dark:text-green-300">Lilongwe and Blantyre account for 67% of all transactions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
