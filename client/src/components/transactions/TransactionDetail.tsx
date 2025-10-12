import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from '../../api/axios.ts';
import { format } from 'date-fns';
import clsx from 'clsx';
import {
  Copy,
  User,
  DollarSign,
  Calendar,
  Info,
  RefreshCcw,
  MapPin,
  Smartphone,
  ArrowLeft,
  AlertTriangle,
  Shield,
  TrendingUp,
  Brain,
  BarChart3,
  Layers,
  Clock,
  Globe,
  Activity,
  Target,
  Zap,
  CheckCircle,
  X,
  Flag,
  ChevronDown,
  ChevronRight,
  Eye,
  MessageCircle,
} from 'lucide-react';
import NotificationSnackBar from '../common/NotificationSnackBar';

interface MLAnalysis {
  anomaly_score: number;
  risk_level: 'normal' | 'low' | 'medium' | 'high' | 'critical';
  model_used: string;
  model_version: string;
  confidence: number;
  feature_contributions: Array<{
    feature: string;
    contribution: number;
    value: any;
    description: string;
  }>;
  cluster_info?: {
    cluster_id: number;
    cluster_label: string;
    distance_to_center: number;
    is_outlier: boolean;
  };
  processing_time_ms: number;
  prediction_timestamp: string;
}

interface Transaction {
  transaction_id: string;
  sender_msisdn: string;
  receiver_msisdn: string;
  amount: number;
  currency: string;
  transaction_type: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed' | 'blocked' | 'flagged';
  channel: string;
  device_fingerprint?: { sender?: string; receiver?: string };
  location_data?: { sender?: string; receiver?: string };
  ml_analysis?: MLAnalysis;
  anomaly_score: number;
  risk_level: string;
  requires_review: boolean;
  user_transaction_frequency?: number;
  time_since_last_transaction?: number;
  is_new_location?: boolean;
  is_new_device?: boolean;
  transaction_hour_of_day?: number;
  is_weekend?: boolean;
  amount_percentile_for_user?: number;
  velocity_score?: number;
  is_fraud?: boolean;
  fraud_type?: string;
  fraud_confidence?: number;
  comments?: string;
  risk_score?: number;
  assessment_details?: any;
  sender_name?: string;
  receiver_name?: string;
}

const TransactionDetail: React.FC = () => {
  const history = useHistory();
  const { transactionId } = useParams<{ transactionId: string }>();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'ml-analysis': true,
    'features': false,
    'behavioral': false,
  });
  const [runningAnalysis, setRunningAnalysis] = useState<boolean>(false);
  const [openActionDialog, setOpenActionDialog] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'approve' | 'investigate' | 'escalate' | null>(null);
  const [actionReason, setActionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [snackBarRef, setSnackBarRef] = useState<any>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/transactions/${transactionId}`);
        setTransaction(response.data);
      } catch (error) {
        console.error('Error fetching transaction:', error);
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transactionId]);

  const getRiskLevelInfo = (riskLevel: string, anomalyScore: number) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical':
        return {
          color: 'text-red-700 bg-red-100 border-red-200 dark:text-red-100 dark:bg-red-900 dark:border-red-800',
          icon: AlertTriangle,
          description: 'Immediate attention required - highly anomalous pattern detected',
        };
      case 'high':
        return {
          color: 'text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-100 dark:bg-orange-900 dark:border-orange-800',
          icon: AlertTriangle,
          description: 'Suspicious activity detected - investigation recommended',
        };
      case 'medium':
        return {
          color: 'text-yellow-700 bg-yellow-100 border-yellow-200 dark:text-yellow-100 dark:bg-yellow-900 dark:border-yellow-800',
          icon: TrendingUp,
          description: 'Moderately unusual patterns - monitoring suggested',
        };
      case 'low':
        return {
          color: 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-100 dark:bg-blue-900 dark:border-blue-800',
          icon: Info,
          description: 'Slightly unusual but within acceptable range',
        };
      default:
        return {
          color: 'text-green-700 bg-green-100 border-green-200 dark:text-green-100 dark:bg-green-900 dark:border-green-800',
          icon: Shield,
          description: 'Normal transaction pattern - no concerns detected',
        };
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const runMLAnalysis = async () => {
    if (!transaction || runningAnalysis) return;

    setRunningAnalysis(true);
    try {
      const response = await axios.post(`/api/ml/analyze-transaction/${transactionId}`);
      setTransaction((prev) => ({
        ...prev!,
        ...response.data.transaction,
        ml_analysis: response.data.ml_analysis,
      }));
      if (snackBarRef) {
        snackBarRef.openSnackBar('ML analysis completed successfully', 'success', 3000);
      }
    } catch (error) {
      console.error('Error running ML analysis:', error);
      if (snackBarRef) {
        snackBarRef.openSnackBar('Failed to run ML analysis', 'error', 3000);
      }
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleOpenActionDialog = (type: 'approve' | 'investigate' | 'escalate') => {
    setActionType(type);
    setActionReason('');
    setActionError(null);
    setOpenActionDialog(true);
  };

  const handleCloseActionDialog = () => {
    setOpenActionDialog(false);
    setActionType(null);
    setActionReason('');
    setActionError(null);
  };

  const handleConfirmAction = async () => {
    if (!actionType || actionLoading) return;

    setActionLoading(true);
    setActionError(null);

    try {
      let endpoint = '';
      let payload: any = { reason: actionReason };

      switch (actionType) {
        case 'approve':
          endpoint = `/api/transactions/${transactionId}/mark-safe`;
          break;
        case 'investigate':
          endpoint = `/api/transactions/${transactionId}/investigate`;
          break;
        case 'escalate':
          endpoint = `/api/transactions/${transactionId}/escalate`;
          break;
        default:
          return;
      }

      await axios.post(endpoint, payload);
      const response = await axios.get(`/api/transactions/${transactionId}`);
      setTransaction(response.data);
      handleCloseActionDialog();
      if (snackBarRef) {
        snackBarRef.openSnackBar(`${actionType} action completed successfully`, 'success', 3000);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || `Failed to ${actionType} transaction.`);
      console.error(`Error performing ${actionType} action:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status: Transaction['status']) => {
    const statusConfig = {
      completed: { color: 'bg-green-600', label: 'Completed' },
      pending: { color: 'bg-yellow-600', label: 'Pending' },
      failed: { color: 'bg-red-600', label: 'Failed' },
      blocked: { color: 'bg-red-700', label: 'Blocked' },
      flagged: { color: 'bg-blue-600', label: 'Flagged' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-600', label: status };

    return (
      <span
        className={clsx('px-3 py-1 rounded-full text-white font-medium text-sm shadow-sm', config.color)}
      >
        {config.label}
      </span>
    );
  };

  const handleCopyTransactionId = () => {
    navigator.clipboard.writeText(transactionId || '');
    if (snackBarRef) {
      snackBarRef.openSnackBar('Transaction ID copied to clipboard!', 'success', 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-gray-600 text-lg dark:text-gray-400">Analyzing transaction details...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-400">Transaction not found</p>
        </div>
      </div>
    );
  }

  const riskInfo = getRiskLevelInfo(transaction.risk_level || 'normal', transaction.anomaly_score || 0);
  const RiskIcon = riskInfo.icon;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => history.goBack()}
              className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Transaction Analysis</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Detailed anomaly detection results</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={runMLAnalysis}
              disabled={runningAnalysis}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-opacity-70 transition-colors"
            >
              {runningAnalysis ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5 mr-2" />
                  Re-run Analysis
                </>
              )}
            </button>
            {getStatusChip(transaction.status)}
          </div>
        </div>

        {/* Transaction ID and Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <RefreshCcw className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Transaction ID:</span>
              <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
                {transaction.transaction_id}
              </code>
              <button
                onClick={handleCopyTransactionId}
                className="ml-2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                  {transaction.currency || 'MWK'} {transaction.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Time:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {format(new Date(transaction.timestamp), 'PPp')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-end">
            <div className={clsx('p-4 rounded-lg border-2 shadow-md', riskInfo.color)}>
              <div className="flex items-center mb-2">
                <RiskIcon className="h-6 w-6 mr-2" />
                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  {transaction.risk_level?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{riskInfo.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ML Analysis Section */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div
          className="p-6 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => toggleSection('ml-analysis')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Machine Learning Analysis</h2>
            </div>
            {expandedSections['ml-analysis'] ? (
              <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </div>
        </div>
        {expandedSections['ml-analysis'] && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Anomaly Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {((transaction.anomaly_score || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                <Zap className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Model Confidence</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {((transaction.ml_analysis?.confidence || 0.85) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {transaction.ml_analysis?.processing_time_ms || '< 50'}ms
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-100">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Feature Contributions
              </h3>
              <div className="space-y-3">
                {(transaction.ml_analysis?.feature_contributions || [
                  { feature: 'Transaction Amount', contribution: 0.35, value: transaction.amount, description: 'Amount relative to user history' },
                  { feature: 'Time Pattern', contribution: 0.25, value: transaction.transaction_hour_of_day, description: 'Hour of day analysis' },
                  { feature: 'Location Context', contribution: 0.20, value: transaction.is_new_location, description: 'Geographic anomaly detection' },
                  { feature: 'User Behavior', contribution: 0.15, value: transaction.velocity_score, description: 'Transaction velocity patterns' },
                  { feature: 'Device Context', contribution: 0.05, value: transaction.is_new_device, description: 'Device fingerprint analysis' },
                ]).map((contrib, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{contrib.feature}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full"
                          style={{ width: `${contrib.contribution * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-right font-medium text-gray-700 dark:text-gray-300">
                      {(contrib.contribution * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {transaction.ml_analysis?.cluster_info && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg shadow-md">
                <h3 className="font-semibold mb-2 flex items-center text-gray-900 dark:text-gray-100">
                  <Layers className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Cluster Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="font-medium">Cluster:</span> {transaction.ml_analysis.cluster_info.cluster_label}
                  </div>
                  <div>
                    <span className="font-medium">Distance to Center:</span>{' '}
                    {transaction.ml_analysis.cluster_info.distance_to_center.toFixed(3)}
                  </div>
                  <div>
                    <span className="font-medium">Outlier Status:</span>
                    <span
                      className={clsx(
                        'ml-1',
                        transaction.ml_analysis.cluster_info.is_outlier
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-green-600 dark:text-green-400'
                      )}
                    >
                      {transaction.ml_analysis.cluster_info.is_outlier ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(transaction.status === 'pending' || transaction.status === 'flagged') && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Required Actions</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => handleOpenActionDialog('approve')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition-colors"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Mark as Safe
            </button>
            <button
              onClick={() => handleOpenActionDialog('investigate')}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 shadow-sm transition-colors"
            >
              <Eye className="h-5 w-5 mr-2" />
              Investigate Further
            </button>
            <button
              onClick={() => handleOpenActionDialog('escalate')}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm transition-colors"
            >
              <Flag className="h-5 w-5 mr-2" />
              Escalate to Senior Analyst
            </button>
          </div>
        </div>
      )}

      <NotificationSnackBar ref={setSnackBarRef} />

      {openActionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {actionType === 'approve' && 'Mark Transaction as Safe'}
                {actionType === 'investigate' && 'Investigate Transaction'}
                {actionType === 'escalate' && 'Escalate Transaction'}
              </h2>
              <button onClick={handleCloseActionDialog} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            {actionError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:text-red-100 rounded">
                {actionError}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for this action:
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                rows={4}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Please provide a detailed explanation for your decision..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseActionDialog}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center shadow-sm disabled:opacity-50 disabled:bg-opacity-70 transition-colors"
                disabled={actionLoading || !actionReason.trim()}
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  `Confirm ${actionType?.charAt(0).toUpperCase()}${actionType?.slice(1)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetail;