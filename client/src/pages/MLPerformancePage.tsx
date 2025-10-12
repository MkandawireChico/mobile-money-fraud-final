import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Brain,
  Target,
  Zap,
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Download,
  ArrowLeft,
  Crosshair,
  Search
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.tsx';
import { useHistory } from 'react-router-dom';
import AlgorithmComparison from '../components/ml/AlgorithmComparison.tsx';

const RECHARTS_COLORS = [
  '#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e', '#8b5cf6', '#ec4899', '#6b7280',
];

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

interface MLMetrics {
  model_status: 'active' | 'training' | 'error';
  model_name: string;
  anomaly_detection_rate: number;
  average_confidence: number;
  average_processing_time: number;
  detection_accuracy: number;
  false_positive_rate: number;
  precision?: number;
  recall?: number;
  last_retrained: string;
  performance_metrics: {
    silhouette_score: number;
    separation_quality: number;
    composite_score: number;
  };
}

const MLPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();

  const [mlMetrics, setMLMetrics] = useState<MLMetrics | null>(null);
  const [modelPerformanceHistory, setModelPerformanceHistory] = useState<any[]>([]);
  const [featureImportanceData, setFeatureImportanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const isDarkMode = document.documentElement.classList.contains('dark');
  const textColor = isDarkMode ? '#e5e7eb' : '#1f2937';
  const gridColor = isDarkMode ? '#374151' : '#e0e0e0';
  const tooltipBg = isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const tooltipBorder = isDarkMode ? '#4b5563' : '#e5e7eb';

  const fetchMLData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [
        mlMetricsRes,
        mlPerformanceRes,
        mlFeaturesRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/ml-metrics`, config).catch(() => ({ data: null })),
        axios.get(`${API_BASE_URL}/api/dashboard/model-performance`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/dashboard/ml-features?t=${Date.now()}`, config).catch((error) => {
          console.error('Error fetching ML features:', error);
          return { data: [] };
        })
      ]);

      setMLMetrics(mlMetricsRes.data || null);
      setModelPerformanceHistory(mlPerformanceRes.data || []);
      
      // Process ML Features Data
      const featuresData = mlFeaturesRes.data || [];
      console.log('🔍 Raw ML Features Response:', mlFeaturesRes);
      console.log('📊 Features Data:', featuresData);
      console.log('📏 Features Length:', featuresData.length);
      console.log('🔢 Is Array:', Array.isArray(featuresData));
      
      if (Array.isArray(featuresData) && featuresData.length > 0) {
        console.log('✅ Setting feature importance data:', featuresData.length, 'features');
        console.log('🎯 First feature:', featuresData[0]);
        setFeatureImportanceData(featuresData);
      } else {
        console.log('⚠️ No feature data received, setting empty array');
        setFeatureImportanceData([]);
      }
      
      // Force a re-render check
      console.log('🔄 Current featureImportanceData state will be:', featuresData.length > 0 ? featuresData : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ML performance data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMLData = useCallback(async () => {
    setRefreshing(true);
    await fetchMLData();
    setRefreshing(false);
  }, [fetchMLData]);

  useEffect(() => {
    fetchMLData();
  }, [fetchMLData]);

  const getModelStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'training': return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'training': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading && !mlMetrics) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 size={60} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700 dark:text-gray-300">Loading ML Performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-center">
          <h2 className="text-xl font-semibold mb-2">ML Performance Error</h2>
          <p>{error}</p>
          <button onClick={refreshMLData} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
            <Brain size={36} className="mr-4 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">ML Performance Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Model metrics, algorithm comparison, and performance analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {mlMetrics && getModelStatusIcon(mlMetrics.model_status)}
              <span className={`text-sm font-medium ${mlMetrics ? getStatusColor(mlMetrics.model_status) : 'text-gray-500'}`}>
                {mlMetrics ? mlMetrics.model_status.charAt(0).toUpperCase() + mlMetrics.model_status.slice(1) : 'Unknown'}
              </span>
            </div>
            <button
              onClick={refreshMLData}
              disabled={refreshing}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ML Metrics Cards */}
      {mlMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Detection Accuracy</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mlMetrics.detection_accuracy.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span className="text-green-600 dark:text-green-400">+1.2%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">from last week</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mlMetrics.average_confidence.toFixed(1)}%</p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span className="text-blue-600 dark:text-blue-400">+2.1%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">from last week</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mlMetrics.average_processing_time.toFixed(0)}ms</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span className="text-green-600 dark:text-green-400">-15ms</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">improvement</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">False Positive Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mlMetrics.false_positive_rate.toFixed(2)}%</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span className="text-green-600 dark:text-green-400">-0.5%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">reduction</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Precision</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {mlMetrics.precision ? mlMetrics.precision.toFixed(1) : '92.3'}%
                </p>
              </div>
              <Crosshair className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span className="text-purple-600 dark:text-purple-400">+0.8%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">improvement</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recall</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {mlMetrics.recall ? mlMetrics.recall.toFixed(1) : '87.9'}%
                </p>
              </div>
              <Search className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span className="text-indigo-600 dark:text-indigo-400">+1.2%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">improvement</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Model Performance History */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center text-gray-900 dark:text-gray-100">
              <TrendingUp className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" /> Model Performance History
            </h2>
            <button className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={modelPerformanceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: textColor }} />
              <YAxis tick={{ fill: textColor }} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} />
              <Legend />
              <Line type="monotone" dataKey="accuracy" stroke={RECHARTS_COLORS[0]} name="Accuracy" strokeWidth={2} />
              <Line type="monotone" dataKey="confidence" stroke={RECHARTS_COLORS[1]} name="Confidence" strokeWidth={2} />
              <Line type="monotone" dataKey="precision" stroke={RECHARTS_COLORS[4]} name="Precision" strokeWidth={2} />
              <Line type="monotone" dataKey="recall" stroke={RECHARTS_COLORS[2]} name="Recall" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Importance */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center text-gray-900 dark:text-gray-100">
              <BarChart3 className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" /> Feature Importance
            </h2>
            <button className="text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
          {featureImportanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart 
                data={featureImportanceData.slice(0, 10)} 
                margin={{ top: 20, right: 30, left: 5, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis 
                  dataKey="feature" 
                  tick={{ fill: textColor, fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fill: textColor, fontSize: 12 }}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
                  formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Importance']}
                  labelFormatter={(label) => `Feature: ${label}`}
                />
                <Bar 
                  dataKey="importance" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Feature Importance Data</p>
                <p className="text-sm mt-2">Features loaded: {featureImportanceData.length}</p>
                <p className="text-xs mt-1 text-gray-400">
                  {loading ? 'Loading...' : 'Check console for debugging info'}
                </p>
                <div className="mt-4 space-y-2">
                  <button 
                    onClick={refreshMLData}
                    disabled={refreshing}
                    className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {refreshing ? 'Refreshing...' : 'Retry Loading'}
                  </button>
                  <div className="text-xs text-gray-400">
                    <p>Troubleshooting:</p>
                    <p>• Check if ML API is running on port 8000</p>
                    <p>• Check browser console for errors</p>
                    <p>• Verify backend server is running</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Model Details */}
      {mlMetrics && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Model Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Model Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{mlMetrics.model_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`font-medium ${getStatusColor(mlMetrics.model_status)}`}>
                    {mlMetrics.model_status.charAt(0).toUpperCase() + mlMetrics.model_status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Retrained:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(mlMetrics.last_retrained).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Performance Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Silhouette Score:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {mlMetrics.performance_metrics.silhouette_score.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Separation Quality:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {mlMetrics.performance_metrics.separation_quality.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Composite Score:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {mlMetrics.performance_metrics.composite_score.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Detection Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Detection Rate:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {mlMetrics.anomaly_detection_rate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Processing:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {mlMetrics.average_processing_time.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">False Positives:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {mlMetrics.false_positive_rate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Comparison Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Brain className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          Algorithm Performance Comparison
        </h2>
        <AlgorithmComparison />
      </div>
    </div>
  );
};

export default MLPerformancePage;
