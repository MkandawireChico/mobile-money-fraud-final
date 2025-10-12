import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard as DashboardIcon,
  Users as UsersIcon,
  AlertTriangle as HighRiskIcon,
  Zap,
  Loader2,
  Activity,
  Shield,
  RefreshCw,
  AlertTriangle,
  Target,
  ArrowRight,
  Eye,
  FileText
} from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import MetricCard, {
  AnomalyRateCard,
  ModelConfidenceCard,
  ProcessingTimeCard,
  DetectionAccuracyCard
} from '../components/dashboard/MetricCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useHistory } from 'react-router-dom';
import { User } from '../types/index';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton.tsx';

const RECHARTS_COLORS = [
  '#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e', '#8b5cf6', '#ec4899', '#6b7280',
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

interface DashboardData {
  totalUsers: number;
  totalTransactions: number;
  totalAnomalies: number;
  highRiskAnomalies?: number; // Optional, as it wasn't in the log but was in previous data
  openAnomalies?: number; // Added from log
  // Removed recent data - no longer needed on dashboard
  // recentTransactions: Array<any>;
  // recentAnomalies: Array<any>;
  currency?: string;
}

interface UserData {
  id: string;
  name: string;
  username?: string;
  registrationDate: string;
  totalTransactions: number;
  role?: User['role'];
  status?: User['status'];
}

interface MLMetrics {
  model_status: 'active' | 'training' | 'error';
  model_name: string;
  anomaly_detection_rate: number;
  average_confidence: number;
  average_processing_time: number;
  detection_accuracy: number;
  false_positive_rate: number;
  last_retrained: string;
  performance_metrics: {
    silhouette_score: number;
    separation_quality: number;
    composite_score: number;
  };
}

interface SystemHealth {
  ml_service_status: 'healthy' | 'degraded' | 'down';
  transaction_processing_rate: number;
  anomaly_detection_latency: number;
  queue_length: number;
  error_rate: number;
}

interface LocationData {
  location: string;
  transaction_count: number;
  total_amount: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const isAdmin = user?.role === 'admin';
  const isAnalyst = user?.role === 'analyst';

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [mlMetrics, setMLMetrics] = useState<MLMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [anomalyTrendData, setAnomalyTrendData] = useState<any[]>([]);
  const [riskLevelDistribution, setRiskLevelDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<string>('MWK');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const socket = useRef<Socket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const isDarkMode = document.documentElement.classList.contains('dark');
  const textColor = isDarkMode ? '#e5e7eb' : '#1f2937';
  const gridColor = isDarkMode ? '#374151' : '#e0e0e0';
  const tooltipBg = isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const tooltipBorder = isDarkMode ? '#4b5563' : '#e5e7eb';

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const dateRange = timeRange === '7d' ? { start: '2024-09-30', end: '2025-09-30' } : getDateRange(timeRange);

      // Streamlined API calls - only essential data for dashboard
      const [
        dashboardRes,
        usersRes,
        mlMetricsRes,
        systemHealthRes,
        anomalyTrendsRes,
        riskDistRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/summary`, config),
        Promise.resolve({ data: { users: [] } }), // Users data not needed on dashboard
        axios.get(`${API_BASE_URL}/api/dashboard/ml-metrics`, config).catch(() => ({ data: null })),
        axios.get(`${API_BASE_URL}/api/system/health`, config),
        axios.get(`${API_BASE_URL}/api/anomalies/trends`, { params: dateRange, ...config }),
        axios.get(`${API_BASE_URL}/api/anomalies/distribution`, { params: dateRange, ...config })
      ]);

      setDashboardData({
        totalUsers: dashboardRes.data.totalUsers || 0,
        totalTransactions: dashboardRes.data.totalTransactions || 0,
        totalAnomalies: dashboardRes.data.totalAnomalies || 0,
        openAnomalies: dashboardRes.data.openAnomalies || 0,
        highRiskAnomalies: dashboardRes.data.highRiskAnomalies || 0,
        currency: dashboardRes.data.currency || 'MWK'
      });
      setMLMetrics(mlMetricsRes.data || null);
      setSystemHealth(systemHealthRes.data);
      setAnomalyTrendData(anomalyTrendsRes.data);
      setRiskLevelDistribution(riskDistRes.data);
      setDefaultCurrency(dashboardRes.data.currency || 'MWK');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, isAdmin]);

  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  // Enhanced Socket.IO connection with real-time updates
  useEffect(() => {
    fetchDashboardData();
    
    const connectSocket = () => {
      // Prevent multiple simultaneous connections
      if (isConnecting || (socket.current && socket.current.connected)) {
        console.log('⏳ Socket.IO connection already in progress');
        return;
      }
      
      // Close existing connection if any
      if (socket.current) {
        socket.current.disconnect();
      }
      
      // Clear any pending reconnection
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No authentication token found. Cannot connect to Socket.IO.');
        setIsConnected(false);
        setIsConnecting(false);
        return;
      }
      
      setIsConnecting(true);
      
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 
                       (window.location.protocol === 'https:' ? 'https:' : 'http:') + 
                       '//' + window.location.hostname + ':5000';
      
      console.log('🔌 Connecting to Socket.IO at:', socketUrl);
      socket.current = io(socketUrl, {
        auth: {
          token: token,
        },
        query: {
          token: token, // Fallback for older implementations
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
        timeout: 20000,
        forceNew: true
      });

      socket.current.on('connect', () => {
        console.log('✅ Socket.IO Connected to Dashboard');
        setIsConnected(true);
        setIsConnecting(false);
        setLastUpdate(new Date().toLocaleTimeString());
      });

      socket.current.on('disconnect', (reason) => {
        console.log(`🔌 Socket.IO Disconnected - Reason: ${reason}`);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close') {
          console.log('🔄 Attempting to reconnect in 3 seconds...');
          setTimeout(() => {
            if (socket.current) {
              socket.current.connect();
            }
          }, 3000);
        }
      });

      socket.current.on('connect_error', (error) => {
        console.error('❌ Socket.IO Connection Error:', error.message, error);
        setIsConnected(false);
        setIsConnecting(false);
      });

      socket.current.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Socket.IO Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setIsConnecting(false);
        setLastUpdate(new Date().toLocaleTimeString());
      });

      socket.current.on('reconnect_error', (error) => {
        console.error('🔄 Socket.IO Reconnection Error:', error.message);
      });

      socket.current.on('reconnect_failed', () => {
        console.error('🔄 Socket.IO Reconnection Failed - giving up');
        setIsConnected(false);
        setIsConnecting(false);
      });

      socket.current.on('newAnomaly', (anomaly) => {
        console.log('📡 New anomaly received:', anomaly);
        setLastUpdate(new Date().toLocaleTimeString());
        
        // Update anomaly count and trend data
        setDashboardData(prev => prev ? {
          ...prev,
          totalAnomalies: prev.totalAnomalies + 1,
          openAnomalies: (prev.openAnomalies || 0) + 1
        } : null);
        
        // Update anomaly trend data
        setAnomalyTrendData(prev => {
          const newData = [...prev];
          const lastEntry = newData[newData.length - 1];
          if (lastEntry) {
            lastEntry.anomaly_count = (lastEntry.anomaly_count || 0) + 1;
          }
          return newData;
        });
      });

      socket.current.on('anomalyUpdated', (anomaly) => {
        console.log('📡 Anomaly updated:', anomaly);
        setLastUpdate(new Date().toLocaleTimeString());
      });

      socket.current.on('transactionProcessed', (transaction) => {
        console.log('📡 Transaction processed:', transaction);
        setLastUpdate(new Date().toLocaleTimeString());
        
        // Update transaction count
        setDashboardData(prev => prev ? {
          ...prev,
          totalTransactions: prev.totalTransactions + 1
        } : null);
      });
    };
    
    connectSocket();

    // Keep the polling as fallback
    const intervalId: NodeJS.Timeout = setInterval(fetchDashboardData, 60000); // Reduced to 1 minute since we have real-time updates
    
    return () => {
      clearInterval(intervalId);
      
      // Clear any pending reconnection
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      // Close Socket.IO connection
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [fetchDashboardData]);

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

  const getSystemHealthStatus = () => {
    if (!systemHealth) return 'unknown';
    if (systemHealth.ml_service_status === 'healthy' && systemHealth.error_rate < 0.01) return 'healthy';
    if (systemHealth.ml_service_status === 'degraded' || systemHealth.error_rate < 0.05) return 'warning';
    return 'critical';
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


  if (loading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
          <p>{error}</p>
          <button onClick={refreshDashboard} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen font-inter antialiased">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center">
            <DashboardIcon size={36} className="mr-4 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">ML Fraud Detection Dashboard</h1>
              <div className="flex items-center mt-1 space-x-4">
                <p className="text-gray-600 dark:text-gray-400">Powered by {mlMetrics?.model_name || 'Unknown Model'}</p>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={`text-xs font-medium ${
                    isConnected ? 'text-green-600 dark:text-green-400' : 
                    isConnecting ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Disconnected'}
                  </span>
                  {!isConnected && !isConnecting && (
                    <button
                      onClick={() => {
                        if (socket.current) {
                          socket.current.connect();
                        } else {
                          window.location.reload();
                        }
                      }}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Reconnect
                    </button>
                  )}
                  {lastUpdate && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Last update: {lastUpdate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                getSystemHealthStatus() === 'healthy' ? 'bg-green-500' :
                getSystemHealthStatus() === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">System {getSystemHealthStatus()}</span>
            </div>
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
              onClick={refreshDashboard}
              disabled={refreshing}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 mb-8`}>
        {/* Total Users - Admin Only */}
        {isAdmin && (
          <MetricCard
            title="Total Users"
            value={dashboardData?.totalUsers || 0}
            icon={UsersIcon}
            loading={loading}
            change="+12.5%"
            changeType="increase"
            status="healthy"
          />
        )}
        <AnomalyRateCard
          title="Anomaly Detection Rate"
          value={mlMetrics?.anomaly_detection_rate || 0}
          loading={loading}
          change="-0.3%"
          changeType="decrease"
          status={mlMetrics?.anomaly_detection_rate && mlMetrics.anomaly_detection_rate < 5 ? 'healthy' : 'warning'}
          threshold={{ value: 5, type: 'max', status: 'healthy' }}
        />
        <ModelConfidenceCard
          title="Average Confidence"
          value={mlMetrics?.average_confidence || 0}
          loading={loading}
          change="+2.1%"
          changeType="increase"
          status={mlMetrics?.average_confidence && mlMetrics.average_confidence > 80 ? 'healthy' : 'warning'}
          subMetrics={mlMetrics ? [
            { label: 'Silhouette Score', value: mlMetrics.performance_metrics.silhouette_score.toFixed(3) },
            { label: 'Separation Quality', value: mlMetrics.performance_metrics.separation_quality.toFixed(1) }
          ] : []}
        />
        <ProcessingTimeCard
          title="Avg Processing Time"
          value={mlMetrics?.average_processing_time || 0}
          loading={loading}
          change="-15ms"
          changeType="decrease"
          status={mlMetrics?.average_processing_time && mlMetrics.average_processing_time < 100 ? 'healthy' : 'warning'}
          threshold={{ value: 100, type: 'max', status: 'healthy' }}
        />
      </div>

      {(isAdmin || isAnalyst) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DetectionAccuracyCard
            title="Detection Accuracy"
            value={mlMetrics?.detection_accuracy || 0}
            loading={loading}
            change="+1.2%"
            changeType="increase"
            status="healthy"
            description="Based on analyst feedback"
          />
          <MetricCard
            title="False Positive Rate"
            value={`${(mlMetrics?.false_positive_rate || 0).toFixed(2)}%`}
            icon={Shield}
            loading={loading}
            change="-0.5%"
            changeType="decrease"
            status={mlMetrics?.false_positive_rate && mlMetrics.false_positive_rate < 2 ? 'healthy' : 'warning'}
          />
          <MetricCard
            title="High Risk Anomalies"
            value={dashboardData?.highRiskAnomalies || 0}
            icon={HighRiskIcon}
            loading={loading}
            change="+3"
            changeType="increase"
            status="warning"
            description="Requiring immediate review"
          />
        </div>
      )}
        
      {/* Essential Charts Section - Only Critical Views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {loading && (
          <>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
                <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
                <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          </>
        )}
        {!loading && (
          <>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" /> Real-time Anomaly Trends
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Last 24 hours</span>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={anomalyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="timestamp" tick={{ fill: textColor }} />
              <YAxis tick={{ fill: textColor }} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} labelStyle={{ color: textColor }} />
              <Legend />
              <Area type="monotone" dataKey="anomaly_count" stackId="1" stroke={RECHARTS_COLORS[1]} fill={RECHARTS_COLORS[1]} name="Anomalies" />
              <Area type="monotone" dataKey="total_transactions" stackId="2" stroke={RECHARTS_COLORS[0]} fill={RECHARTS_COLORS[0]} name="Transactions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Target className="h-5 w-5 mr-2 text-orange-600" /> Current Risk Distribution
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Live data</span>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={riskLevelDistribution} dataKey="count" nameKey="risk_level" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" label={renderCustomPieLabel}>
                {riskLevelDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={RECHARTS_COLORS[index % RECHARTS_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} />
              <Legend content={renderLegendContent} />
            </PieChart>
          </ResponsiveContainer>
        </div>
          </>
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-yellow-600" /> Quick Actions
        </h2>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          <button 
            onClick={() => history.push('/transactions')}
            className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors duration-200 group"
          >
            <div className="text-center">
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">View Transactions</span>
            </div>
          </button>
          <button 
            onClick={() => history.push('/alerts')}
            className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors duration-200 group"
          >
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">View All Alerts</span>
            </div>
          </button>
          <button 
            onClick={() => history.push('/analytics')}
            className="flex items-center justify-center p-4 bg-purple-50 dark:bg-purple-900 hover:bg-purple-100 dark:hover:bg-purple-800 rounded-lg transition-colors duration-200 group"
          >
            <div className="text-center">
              <Eye className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">View Analytics</span>
            </div>
          </button>
          {isAdmin && (
            <button 
              onClick={() => history.push('/reports')}
              className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors duration-200 group"
            >
              <div className="text-center">
                <FileText className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Generate Report</span>
              </div>
            </button>
          )}
        </div>
      </div>



      {/* Navigation to Other Sections */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Explore More</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => history.push('/analytics')}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Analytics</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Detailed charts and trends</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </div>
          </div>
          <div 
            onClick={() => history.push('/ml-performance')}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">ML Performance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Model metrics and comparison</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </div>
          </div>
          {isAdmin ? (
            <div 
              onClick={() => history.push('/reports')}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Reports</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Export and generate reports</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          ) : (
            <div 
              onClick={() => history.push('/transactions')}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Case Review</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Review and investigate transactions</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;