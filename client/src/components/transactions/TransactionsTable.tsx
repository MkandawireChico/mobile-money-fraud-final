
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Transaction } from '../../types/index.ts';
import {
  PlayCircle as PlayIcon,
  AlertTriangle,
  Shield,
  TrendingUp,
  Info,
  Loader2,
  ArrowUpDown,
  Eye,
  FileSearch,
} from 'lucide-react';
import clsx from 'clsx';

interface TransactionsTableProps {
  transactions: Transaction[];
  loading: boolean;
  onRowClick: (transactionId: string) => void;
  defaultCurrency: string;
  onPredictFraud: (transactionId: string) => Promise<void>;
  onReviewCase?: (transactionId: string) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  loading,
  onRowClick,
  defaultCurrency,
  onPredictFraud,
  onReviewCase,
}) => {
  const [predictingId, setPredictingId] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Transaction | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Debug logging for user_id
  useEffect(() => {
    if (transactions.length > 0) {
      console.log(
        '[TransactionsTable] Sample transaction user_ids:',
        transactions.slice(0, 5).map((tx) => ({
          transaction_id: tx.transaction_id,
          user_id: tx.user_id || 'Missing',
        }))
      );
    }
  }, [transactions]);

  const getStatusChipClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'failed':
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'flagged':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRiskLevelInfo = (riskLevel: Transaction['risk_level']) => {
    switch (riskLevel) {
      case 'critical':
        return {
          level: 'Critical',
          color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100',
          icon: AlertTriangle,
          description: 'Highly anomalous transaction - immediate review required',
        };
      case 'high':
        return {
          level: 'High',
          color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-100',
          icon: AlertTriangle,
          description: 'Suspicious transaction pattern detected',
        };
      case 'medium':
        return {
          level: 'Medium',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100',
          icon: TrendingUp,
          description: 'Moderately unusual transaction',
        };
      case 'low':
        return {
          level: 'Low',
          color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100',
          icon: Info,
          description: 'Slightly unusual but likely normal',
        };
      case 'normal':
      default:
        return {
          level: 'Normal',
          color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100',
          icon: Shield,
          description: 'Transaction follows normal patterns',
        };
    }
  };

  const renderRiskLevel = (riskLevel: Transaction['risk_level']) => {
    const riskInfo = getRiskLevelInfo(riskLevel);
    const IconComponent = riskInfo.icon;

    return (
      <div className="flex flex-col items-center space-y-1">
        <div className="flex items-center space-x-1">
          <IconComponent
            size={14}
            className={clsx(
              riskLevel === 'critical' || riskLevel === 'high' ? 'text-red-500' :
              riskLevel === 'medium' ? 'text-orange-500' :
              riskLevel === 'low' ? 'text-yellow-500' : 'text-green-500',
              'dark:text-opacity-80'
            )}
          />
          <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
            {(riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : 'N/A')}
          </span>
        </div>
        <span
          className={clsx(
            'inline-flex items-center px-3 py-1 rounded text-xs font-medium border shadow-md',
            riskInfo.color
          )}
          title={riskInfo.description}
        >
          {riskInfo.level}
        </span>
      </div>
    );
  };


  const formatTransactionType = (type: Transaction['transaction_type']) => {
    if (!type) return 'N/A';
    switch (type) {
      case 'airtime_topup': return 'Airtime Top-up';
      case 'bill_payment': return 'Bill Payment';
      case 'cash_in': return 'Cash In';
      case 'cash_out': return 'Cash Out';
      case 'transfer': return 'Transfer';
      default: return String(type).replace(/_/g, ' ');
    }
  };

  const handlePredictClick = async (event: React.MouseEvent, transactionId: string) => {
    event.stopPropagation();
    if (predictingId === transactionId) return;

    console.warn(`Running anomaly detection for transaction ${transactionId}`);

    setPredictingId(transactionId);
    try {
      await onPredictFraud(transactionId);
    } catch (error) {
      console.error('Error running anomaly detection:', error);
    } finally {
      setPredictingId(null);
    }
  };

  const handleRowClick = (transactionId: string) => {
    setSelectedRow(selectedRow === transactionId ? null : transactionId);
    onRowClick(transactionId);
  };

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField] ?? '';
    const bValue = b[sortField] ?? '';
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
      {loading && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex justify-center items-center z-30 backdrop-blur-sm rounded-lg">
          <Loader2 size={40} className="animate-spin text-blue-500 dark:text-blue-400" />
          <span className="ml-3 text-lg font-medium text-gray-700 dark:text-gray-300">
            Analyzing transactions...
          </span>
        </div>
      )}

      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
        <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          <tr>
            <th scope="col" className="px-6 py-4 font-medium">
              <button onClick={() => handleSort('transaction_id')} className="flex items-center" aria-label="Sort by Transaction ID">
                Transaction ID
                {sortField === 'transaction_id' && <ArrowUpDown size={16} className="ml-1" />}
              </button>
            </th>
            <th scope="col" className="px-6 py-4 font-medium">
              <button onClick={() => handleSort('user_id')} className="flex items-center" aria-label="Sort by User ID">
                User ID
                {sortField === 'user_id' && <ArrowUpDown size={16} className="ml-1" />}
              </button>
            </th>
            <th scope="col" className="px-6 py-4 font-medium">
              <button onClick={() => handleSort('amount')} className="flex items-center" aria-label="Sort by Amount">
                Amount
                {sortField === 'amount' && <ArrowUpDown size={16} className="ml-1" />}
              </button>
            </th>
            <th scope="col" className="px-6 py-4 font-medium">
              <button onClick={() => handleSort('transaction_type')} className="flex items-center" aria-label="Sort by Type">
                Type
                {sortField === 'transaction_type' && <ArrowUpDown size={16} className="ml-1" />}
              </button>
            </th>
            <th scope="col" className="px-6 py-4 font-medium">
              <button onClick={() => handleSort('status')} className="flex items-center" aria-label="Sort by Status">
                Status
                {sortField === 'status' && <ArrowUpDown size={16} className="ml-1" />}
              </button>
            </th>
            <th scope="col" className="px-6 py-4 font-medium">
              <button onClick={() => handleSort('timestamp')} className="flex items-center" aria-label="Sort by Date">
                Date
                {sortField === 'timestamp' && <ArrowUpDown size={16} className="ml-1" />}
              </button>
            </th>
            <th scope="col" className="px-6 py-4 font-medium">Description</th>
            <th scope="col" className="px-6 py-4 font-medium">
              <button onClick={() => handleSort('merchant_category')} className="flex items-center" aria-label="Sort by Merchant Category">
                Merchant Category
                {sortField === 'merchant_category' && <ArrowUpDown size={16} className="ml-1" />}
              </button>
            </th>
            <th scope="col" className="px-6 py-4 font-medium">
              <button onClick={() => handleSort('sender_msisdn')} className="flex items-center" aria-label="Sort by Sender Phone">
                Sender Phone
                {sortField === 'sender_msisdn' && <ArrowUpDown size={16} className="ml-1" />}
              </button>
            </th>
            <th scope="col" className="px-6 py-4 font-medium text-center">
              <div className="flex flex-col items-center">
                <span>Risk Level</span>
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(ML Analysis)</span>
              </div>
            </th>
            <th scope="col" className="px-6 py-4 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.length === 0 && !loading ? (
            <tr>
              <td colSpan={11} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                <p className="text-base font-medium">No transactions to display.</p>
              </td>
            </tr>
          ) : (
            sortedTransactions.map((transaction) => {
              // Determine risk level from risk_score
              let riskLevel = transaction.risk_level || 'normal';
              if (!transaction.risk_level && transaction.risk_score !== null && transaction.risk_score !== undefined) {
                const score = parseFloat(String(transaction.risk_score));
                if (score >= 0.9) riskLevel = 'critical';
                else if (score >= 0.7) riskLevel = 'high';
                else if (score >= 0.5) riskLevel = 'medium';
                else riskLevel = 'low';
              }
              
              // Debug logging for high-risk transactions only
              if (transaction.transaction_id && (riskLevel === 'high' || riskLevel === 'critical')) {
                console.log(`[TransactionsTable] High-risk transaction ${transaction.transaction_id}: risk_score=${transaction.risk_score}, risk_level=${riskLevel}, is_fraud=${transaction.is_fraud}`);
              }
              
              const riskInfo = getRiskLevelInfo(riskLevel);

              return (
                <tr
                  key={transaction.transaction_id}
                  className={clsx(
                    'bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer',
                    { 'bg-blue-50 dark:bg-blue-900': selectedRow === transaction.transaction_id },
                    {
                      'border-l-8 border-red-400 bg-red-100 bg-opacity-10 dark:bg-red-900 dark:bg-opacity-10':
                        riskLevel === 'critical',
                      'border-l-8 border-orange-400 bg-orange-100 bg-opacity-10 dark:bg-orange-900 dark:bg-opacity-10':
                        riskLevel === 'high',
                      'border-l-8 border-yellow-400 bg-yellow-100 bg-opacity-10 dark:bg-yellow-900 dark:bg-opacity-10':
                        riskLevel === 'medium',
                    }
                  )}
                  onClick={() => handleRowClick(transaction.transaction_id)}
                  aria-label={`View transaction details for ID ${transaction.transaction_id}`}
                >
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {transaction.transaction_id}
                  </td>
                  <td
                    className="px-6 py-4"
                    title={transaction.user_id || 'Missing'}
                    aria-label={`User ID: ${transaction.user_id || 'Not available'}`}
                  >
                    {transaction.user_id || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {defaultCurrency}{transaction.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatTransactionType(transaction.transaction_type)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-colors',
                        getStatusChipClass(transaction.status)
                      )}
                    >
                      {transaction.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate" title={transaction.description || 'N/A'}>
                    {transaction.description || 'N/A'}
                  </td>
                  <td className="px-6 py-4">{transaction.merchant_category || 'N/A'}</td>
                  <td className="px-6 py-4 max-w-[120px] truncate" title={transaction.sender_msisdn || 'N/A'}>
                    {transaction.sender_msisdn ? `...${transaction.sender_msisdn.slice(-4)}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {renderRiskLevel(riskLevel)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(event) => handlePredictClick(event, transaction.transaction_id)}
                        disabled={predictingId === transaction.transaction_id}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        title="Run Anomaly Detection"
                        aria-label={`Run anomaly detection for transaction ${transaction.transaction_id}`}
                      >
                        {predictingId === transaction.transaction_id ? (
                          <>
                            <Loader2 size={16} className="animate-spin mr-2" /> Analyzing...
                          </>
                        ) : (
                          <>
                            <PlayIcon size={16} className="mr-2" /> Analyze
                          </>
                        )}
                      </button>
                      {(riskLevel === 'high' || riskLevel === 'critical' || transaction.is_fraud || (transaction.risk_score && transaction.risk_score >= 0.7)) && onReviewCase && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onReviewCase(transaction.transaction_id);
                          }}
                          className={`inline-flex items-center px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors duration-200 text-sm font-medium shadow-sm ${
                            transaction.case_status === 'confirm_fraud' || transaction.case_status === 'mark_legitimate'
                              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                              : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                          }`}
                          title={
                            transaction.case_status === 'confirm_fraud' 
                              ? 'Case Resolved - Fraud Confirmed' 
                              : transaction.case_status === 'mark_legitimate'
                              ? 'Case Resolved - Marked Legitimate'
                              : 'Review Fraud Case'
                          }
                          aria-label={`${
                            transaction.case_status === 'confirm_fraud' || transaction.case_status === 'mark_legitimate'
                              ? 'View resolved case'
                              : 'Review fraud case'
                          } for transaction ${transaction.transaction_id}`}
                        >
                          <FileSearch size={16} className="mr-2" />
                          {transaction.case_status === 'confirm_fraud' 
                            ? 'Case Resolved (Fraud)' 
                            : transaction.case_status === 'mark_legitimate'
                            ? 'Case Resolved (Legitimate)'
                            : 'Review Case'
                          }
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;