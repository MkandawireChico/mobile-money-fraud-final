// client/src/pages/TransactionDetailsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
// No Material-UI imports needed for this refactored page

// Import Lucide React icons for a modern and consistent look
// Make sure you have 'lucide-react' installed: npm install lucide-react
import {
    ArrowLeft as ArrowBackIcon, // For back button
    Info as InfoIcon,           // General info icon (replaces InfoOutlinedIcon)
    CreditCard as TransactionIcon, // For transaction details header
    Loader2,                    // For loading spinner
    AlertCircle,                // For error/not found messages
} from 'lucide-react';
import clsx from 'clsx'; // Utility for conditionally joining class names

import api from '../api/axios.ts';
import { Transaction } from '../types/index';
import { format } from 'date-fns';
// theme.ts is not directly used for styling in this page after refactor,
// but might be used by child components or for color constants if needed.
// import theme from '../theme.ts';

// Removed useStyles as all styling is handled by Tailwind CSS classes

const TransactionDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Get transaction ID from URL params
    const history = useHistory();

    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetches transaction details from the API
    const fetchTransactionDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`[TransactionDetailsPage] Fetching transaction details for ID: ${id}`);
            const response = await api.get<Transaction>(`/transactions/${id}`); // Specify Transaction type for response
            console.log("[TransactionDetailsPage] Raw API Response:", response.data);

            // --- START: NUMERICAL PARSING FIX (from original code) ---
            const fetchedTransaction: Transaction = response.data;

            // Convert relevant string numbers to actual numbers, handling nulls
            fetchedTransaction.amount = parseFloat(fetchedTransaction.amount as any);
            if (fetchedTransaction.time_since_last_transaction_seconds !== null && fetchedTransaction.time_since_last_transaction_seconds !== undefined) {
                fetchedTransaction.time_since_last_transaction_seconds = parseFloat(fetchedTransaction.time_since_last_transaction_seconds as any);
            }
            if (fetchedTransaction.transaction_hour_of_day !== null && fetchedTransaction.transaction_hour_of_day !== undefined) {
                fetchedTransaction.transaction_hour_of_day = parseInt(fetchedTransaction.transaction_hour_of_day as any, 10);
            }
            if (fetchedTransaction.transaction_day_of_week !== null && fetchedTransaction.transaction_day_of_week !== undefined) {
                fetchedTransaction.transaction_day_of_week = parseInt(fetchedTransaction.transaction_day_of_week as any, 10);
            }
            if (fetchedTransaction.user_total_transactions !== null && fetchedTransaction.user_total_transactions !== undefined) {
                fetchedTransaction.user_total_transactions = parseInt(fetchedTransaction.user_total_transactions as any, 10);
            }
            if (fetchedTransaction.user_total_amount_spent !== null && fetchedTransaction.user_total_amount_spent !== undefined) {
                fetchedTransaction.user_total_amount_spent = parseFloat(fetchedTransaction.user_total_amount_spent as any);
            }
            // Ensure risk_score is a number
            if (fetchedTransaction.risk_score !== null && fetchedTransaction.risk_score !== undefined) {
                fetchedTransaction.risk_score = parseFloat(fetchedTransaction.risk_score as any);
            }
            // Ensure is_fraud is a boolean
            // API might return 0/1 or 'true'/'false' strings, converting to boolean explicitly
            fetchedTransaction.is_fraud = String(fetchedTransaction.is_fraud).toLowerCase() === 'true' || Number(fetchedTransaction.is_fraud) === 1;

            setTransaction(fetchedTransaction);
            // --- END: NUMERICAL PARSING FIX ---

        } catch (err: any) {
            console.error(`[TransactionDetailsPage] Error fetching transaction details for ID ${id}:`, err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to fetch transaction details.');
        } finally {
            setLoading(false);
        }
    }, [id]); // Dependency on 'id' to re-fetch if URL parameter changes

    useEffect(() => {
        fetchTransactionDetails();
    }, [fetchTransactionDetails]); // Re-fetch when fetchTransactionDetails memoized function changes

    // Handles navigation back to the transactions list page
    const handleBack = () => {
        history.push('/transactions');
    };

    // Helper function to render JSONB data (e.g., device_info) in a readable format
    const renderJsonData = (data: any) => {
        if (data === null || data === undefined || data === '') return 'N/A';
        try {
            const obj = typeof data === 'string' ? JSON.parse(data) : data;
            if (Object.keys(obj).length === 0) return '{}';
            return (
                <pre className="bg-gray-50 dark:bg-gray-700 p-2 rounded-md text-sm whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200 mt-1">
                    {JSON.stringify(obj, null, 2)}
                </pre>
            );
        } catch (e) {
            return String(data); // Return as string if parsing fails
        }
    };

    // Helper to get Tailwind classes for transaction status chip
    const getStatusChipClasses = (status: Transaction['status']) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    // Helper to get Tailwind classes for is_fraud chip
    const getIsFraudChipClasses = (isFraud: boolean) => {
        return isFraud
            ? 'bg-red-600 text-white dark:bg-red-800'
            : 'bg-green-500 text-white dark:bg-green-700';
    };

    // --- Conditional Rendering for Loading, Error, and Not Found states ---

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center justify-center">
                    <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
                    <p className="text-xl text-gray-700 dark:text-gray-300">Loading transaction details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold flex items-center">
                    <AlertCircle size={24} className="mr-3" /> Error: {error}
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-gray-600 dark:text-gray-400 text-lg font-semibold flex items-center">
                    <AlertCircle size={24} className="mr-3" /> Transaction not found.
                </div>
            </div>
        );
    }

    // Simple ISO8601 string to Date parser (replaces the placeholder)
    function parseISO(timestamp: string): Date {
        return new Date(timestamp);
    }
    // --- Main Component Render ---
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Main Content Area (Header and Details) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200 dark:border-gray-700">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center">
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 mr-4"
                        >
                            <ArrowBackIcon size={20} className="mr-2" /> Back to Transactions
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <TransactionIcon size={32} className="mr-4 text-blue-600 dark:text-blue-400" />
                            Transaction Details: <span className="text-blue-600 dark:text-blue-400 ml-2">{transaction.transaction_id}</span>
                        </h1>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Basic Information */}
                    <div className="lg:col-span-1">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                            <InfoIcon size={20} className="mr-2 text-blue-500" /> Basic Information
                        </h2>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Transaction ID:</span> {transaction.transaction_id}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">User ID:</span> {transaction.user_id}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Amount:</span> {(transaction.amount !== null && transaction.amount !== undefined) ? Number(transaction.amount).toFixed(2) : 'N/A'} {transaction.currency || ''}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Timestamp:</span> {transaction.timestamp ? format(parseISO(transaction.timestamp), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base flex items-center">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Status:</span>
                                <span className={clsx("inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium", getStatusChipClasses(transaction.status))}>
                                    {transaction.status?.toUpperCase() || 'N/A'}
                                </span>
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base flex items-center">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Risk Score:</span>
                                {typeof transaction.risk_score === 'number' && !isNaN(transaction.risk_score)
                                    ? <span className="px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">{transaction.risk_score.toFixed(4)}</span>
                                    : 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base flex items-center">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Is Fraud:</span>
                                <span className={clsx("inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium", getIsFraudChipClasses(transaction.is_fraud))}>
                                    {transaction.is_fraud ? 'YES' : 'NO'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Transaction Specifics */}
                    <div className="lg:col-span-1">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                            <TransactionIcon size={20} className="mr-2 text-blue-500" /> Transaction Specifics
                        </h2>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Transaction Type:</span> {transaction.transaction_type || 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Sender Account:</span> {transaction.sender_account || 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Receiver Account:</span> {transaction.receiver_account || 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Description:</span> {transaction.description || 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Merchant ID:</span> {transaction.merchant_id || 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Merchant Category:</span> {transaction.merchant_category || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Location & Device Info and User Behavior Metrics */}
                    <div className="lg:col-span-1">
                        {/* Location & Device Info */}
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                            <InfoIcon size={20} className="mr-2 text-blue-500" /> Location & Device Info
                        </h2>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Location City:</span> {transaction.location_city || 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Location Country:</span> {transaction.location_country || 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Device Type:</span> {transaction.device_type || 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">OS Type:</span> {transaction.os_type || 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">IP Address:</span> {transaction.ip_address || 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Is New Location:</span> {transaction.is_new_location ? 'Yes' : 'No'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Is New Device:</span> {transaction.is_new_device ? 'Yes' : 'No'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Device Info (JSON):</span>
                            {renderJsonData(transaction.device_info)}
                        </div>

                        {/* User Behavior Metrics */}
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center mt-6">
                            <InfoIcon size={20} className="mr-2 text-blue-500" /> User Behavior Metrics
                        </h2>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Time Since Last Transaction (s):</span> {(transaction.time_since_last_transaction_seconds !== null && transaction.time_since_last_transaction_seconds !== undefined) ? Number(transaction.time_since_last_transaction_seconds).toFixed(2) : 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Transaction Hour of Day:</span> {transaction.transaction_hour_of_day !== null ? transaction.transaction_hour_of_day : 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Transaction Day of Week:</span> {transaction.transaction_day_of_week !== null ? transaction.transaction_day_of_week : 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">User Total Transactions:</span> {transaction.user_total_transactions !== null ? transaction.user_total_transactions : 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">User Total Amount Spent:</span> {(transaction.user_total_amount_spent !== null && transaction.user_total_amount_spent !== undefined) ? Number(transaction.user_total_amount_spent).toFixed(2) : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailsPage;
