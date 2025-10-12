import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  Target, 
  Brain,
  BarChart3,
  Download,
  Eye,
  Settings
} from 'lucide-react';

interface Algorithm {
  algorithm: string;
  description: string;
  silhouette_score: number;
  separation_quality: number;
  anomaly_percentage: number;
  composite_score: number;
  best_params: Record<string, any>;
  status: 'success' | 'failed';
  error?: string;
}

interface ComparisonData {
  algorithms: Algorithm[];
  best_algorithm: string | null;
  training_completed: boolean;
  total_algorithms: number;
  message?: string;
}

const AlgorithmComparison: React.FC = () => {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/algorithm-comparison');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch algorithm comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading Algorithm Comparison...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-red-600 mb-4">
          <XCircle className="h-5 w-5" />
          Error Loading Comparison
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button 
          onClick={fetchComparison}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!data?.training_completed) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 text-lg font-semibold mb-4">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Model Training Required
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {data?.message || 'No algorithm comparison data available. Please train the ML model first.'}
        </p>
        <button 
          onClick={fetchComparison}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-emerald-100 dark:border-gray-600 p-6">
        <div className="flex items-center gap-3 text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
            <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          ML Algorithm Comparison Results
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-300">Best Algorithm:</span>
            <strong className="text-green-600 dark:text-green-400 font-semibold">{data.best_algorithm}</strong>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-500" />
            <span className="text-gray-600 dark:text-gray-300">Total Algorithms:</span>
            <strong className="text-teal-600 dark:text-teal-400 font-semibold">{data.total_algorithms}</strong>
          </div>
        </div>
      </div>

      {/* Algorithm Cards - Enhanced Styling */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.algorithms.map((algorithm, index) => (
          <div key={algorithm.algorithm} className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl hover:scale-105 p-5 ${
            index === 0 
              ? 'ring-2 ring-emerald-400 border-emerald-200 dark:border-emerald-600 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700' 
              : 'border-gray-200 dark:border-gray-600 hover:border-emerald-200 dark:hover:border-emerald-600'
          }`}>
            {index === 0 && (
              <div className="absolute -top-2 -right-2">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <Trophy className="h-3 w-3" />
                  Best
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{algorithm.algorithm}</span>
                </div>
                {getStatusIcon(algorithm.status)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {algorithm.description}
              </p>
            </div>
            
            <div>
              {algorithm.status === 'success' ? (
                <div className="space-y-2">
                  {/* Performance Metrics - Enhanced Grid */}
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Composite Score</span>
                        </div>
                        <div className={`text-sm font-bold ${getScoreColor(algorithm.composite_score)}`}>
                          {algorithm.composite_score.toFixed(3)}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full transition-all duration-300" 
                          style={{width: `${Math.min(algorithm.composite_score * 100, 100)}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-cyan-500" />
                          <span className="font-medium text-gray-600 dark:text-gray-300">Anomaly Detection</span>
                        </div>
                        <div className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                          {algorithm.anomaly_percentage}%
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-teal-500" />
                          <span className="font-medium text-gray-600 dark:text-gray-300">Silhouette</span>
                        </div>
                        <div className={`text-sm font-semibold ${getScoreColor(algorithm.silhouette_score)}`}>
                          {algorithm.silhouette_score.toFixed(3)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3 text-emerald-500" />
                          <span className="font-medium text-gray-600 dark:text-gray-300">Separation</span>
                        </div>
                        <div className={`text-sm font-semibold ${getScoreColor(algorithm.separation_quality)}`}>
                          {algorithm.separation_quality.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Best Parameters - Enhanced Collapsible */}
                  {Object.keys(algorithm.best_params).length > 0 && (
                    <details className="mt-3 group">
                      <summary className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Settings className="h-3 w-3" />
                        <span>Parameters ({Object.keys(algorithm.best_params).length})</span>
                        <Clock className="h-3 w-3 ml-auto group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="mt-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-xs space-y-2 max-h-24 overflow-y-auto">
                          {Object.entries(algorithm.best_params).slice(0, 4).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center p-1.5 bg-white dark:bg-gray-800 rounded border">
                              <span className="text-gray-600 dark:text-gray-300 font-medium truncate">{key}:</span>
                              <span className="font-mono text-xs ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                                {String(value).length > 10 ? String(value).substring(0, 10) + '...' : String(value)}
                              </span>
                            </div>
                          ))}
                          {Object.keys(algorithm.best_params).length > 4 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 text-xs font-medium">
                              +{Object.keys(algorithm.best_params).length - 4} more parameters
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">
                  <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <p className="text-xs text-red-600 dark:text-red-400">Training Failed</p>
                  {algorithm.error && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{algorithm.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button 
          onClick={fetchComparison}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Results
        </button>
      </div>
    </div>
  );
};

export default AlgorithmComparison;
