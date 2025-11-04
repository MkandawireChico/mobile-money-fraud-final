
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import clsx from 'clsx';
import { format } from 'date-fns';
import {
    Filter as FilterIcon,
    Search as SearchIcon,
    RefreshCw as RefreshIcon,
    Wallet as AccountBalanceWalletIcon,
    UploadCloud as CloudUploadIcon,
    CheckCircle as CheckCircleIcon,
    AlertCircle as ErrorOutlineIcon,
    Info as InfoIcon,
    AlertTriangle as WarningIcon,
    X as CloseIcon,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ArrowLeft,
} from 'lucide-react';
import api from '../api/axios.ts';
import TransactionsTable from '../components/transactions/TransactionsTable.tsx';
import TransactionFilter from '../components/transactions/TransactionFilter.tsx';
import TransactionIngestionDialog from '../components/transactions/TransactionIngestionDialog.tsx';
import { Transaction } from '../types/index';
import SimulationButton from '../components/SimulationButton';
import { useAuth } from '../context/AuthContext';
import { getSocket, addSocketListeners } from '../utils/socketClient';

const TransactionsPage: React.FC = () => {
    const history = useHistory();
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);
    useEffect(() => {
        console.log('[TransactionsPage] Filter menu open state changed:', filterMenuOpen);
    }, [filterMenuOpen]);
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [filters, setFilters] = useState<{
        status: string | null;
        type: string | null;
        minAmount: number | null;
        maxAmount: number | null;
        dateRange: [Date | null, Date | null] | null;
        isFraud: boolean | null;
        merchantCategory: string | null;
        sender_msisdn: string | null;
    }>({
        status: null,
        type: null,
        minAmount: null,
        maxAmount: null,
        dateRange: null,
        isFraud: null,
        merchantCategory: null,
        sender_msisdn: null,
    });
    const [activeFilters, setActiveFilters] = useState<{ key: string; label: string; value: any }[]>([]);
    const [ingestionDialogOpen, setIngestionDialogOpen] = useState<boolean>(false);
    const [confirmIngestion, setConfirmIngestion] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [totalTransactions, setTotalTransactions] = useState<number>(0);
    const [defaultCurrency, setDefaultCurrency] = useState<string>('MWK');
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

    const { user } = useAuth();

    const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    }, []);

    const fetchTransactions = useCallback(async () => {
        console.log('[TransactionsPage] fetchTransactions called with filters:', filters);
        setLoading(true);
        setError(null);
        try {
            // Try to fetch settings, but fallback to default if access is denied (for analysts)
            let currency = 'MWK'; // Default fallback
            try {
                const settingsResponse = await api.get('/settings/general');
                currency = settingsResponse.data?.default_currency || 'MWK';
                console.log(`[TransactionsPage] Default currency fetched: ${currency}`);
            } catch (settingsError) {
                // If settings access is denied (403), use default currency
                if (settingsError.response?.status === 403) {
                    console.log(`[TransactionsPage] Settings access denied, using default currency: ${currency}`);
                } else {
                    console.warn(`[TransactionsPage] Settings fetch failed:`, settingsError.message);
                }
            }
            setDefaultCurrency(currency);

            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.type) params.append('transaction_type', filters.type);
            if (filters.minAmount !== null) params.append('min_amount', filters.minAmount.toString());
            if (filters.maxAmount !== null) params.append('max_amount', filters.maxAmount.toString());
            if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
                params.append('start_date', filters.dateRange[0].toISOString());
                params.append('end_date', filters.dateRange[1].toISOString());
            }
            if (filters.isFraud !== null && filters.isFraud !== undefined) {
                params.append('is_fraud', filters.isFraud.toString());
            }
            if (filters.merchantCategory) {
                params.append('merchant_category', filters.merchantCategory);
            }
            if (filters.sender_msisdn) {
                params.append('sender_msisdn', filters.sender_msisdn);
            }
            if (searchQuery) params.append('search', searchQuery);
            params.append('limit', rowsPerPage.toString());
            params.append('offset', (page * rowsPerPage).toString());
            // Add timestamp to prevent caching issues
            params.append('_t', Date.now().toString());

            console.log(`[TransactionsPage] Fetching with params: ${params.toString()}`);

            const response = await api.get<{ transactions: Transaction[]; totalCount: number }>(`/transactions?${params.toString()}`);
            console.log("[TransactionsPage] Raw API Response:", response.data);

            const fetchedTransactions: Transaction[] = (response.data?.transactions || []).map((tx: any) => ({
                ...tx,
                amount: parseFloat(tx.amount),
                time_since_last_transaction_seconds: tx.time_since_last_transaction_seconds !== null && tx.time_since_last_transaction_seconds !== undefined ? parseFloat(tx.time_since_last_transaction_seconds) : null,
                transaction_hour_of_day: tx.transaction_hour_of_day !== null && tx.transaction_hour_of_day !== undefined ? parseInt(tx.transaction_hour_of_day, 10) : null,
                transaction_day_of_week: tx.transaction_day_of_week !== null && tx.transaction_day_of_week !== undefined ? parseInt(tx.transaction_day_of_week, 10) : null,
                user_total_transactions: tx.user_total_transactions !== null && tx.user_total_transactions !== undefined ? parseInt(tx.user_total_transactions, 10) : null,
                user_total_amount_spent: tx.user_total_amount_spent !== null && tx.user_total_amount_spent !== undefined ? parseFloat(tx.user_total_amount_spent) : null,
                risk_score: tx.risk_score !== null && tx.risk_score !== undefined ? parseFloat(tx.risk_score) : 0.0,
                is_fraud: Boolean(tx.is_fraud),
            }));

            setTransactions(fetchedTransactions);
            setTotalTransactions(response.data?.totalCount || 0);
            console.log(`[TransactionsPage] Fetched ${fetchedTransactions.length} transactions. Total count: ${response.data?.totalCount || 0}`);
        } catch (err: any) {
            console.error('[TransactionsPage] Error fetching transactions or settings:', err.response?.data?.message || err.message);
            const errorMessage = err.response?.data?.message || 'Failed to fetch transactions or settings.';
            setError(errorMessage);
            setTransactions([]);
            setTotalTransactions(0);
            showSnackbar(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery, page, rowsPerPage, showSnackbar]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Socket listeners: subscribe to new transactions and updates
    useEffect(() => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken') || undefined;
            const socket = getSocket(token as string | undefined);

            const off = addSocketListeners(socket, {
                onNewTransaction: (tx: any) => {
                    try {
                        const parsedTx: any = {
                            ...tx,
                            amount: tx.amount !== undefined ? parseFloat(tx.amount) : 0,
                            risk_score: tx.risk_score !== undefined && tx.risk_score !== null ? parseFloat(tx.risk_score) : 0.0,
                            is_fraud: Boolean(tx.is_fraud),
                        };
                        setTransactions(prev => [parsedTx as any, ...prev]);
                        setTotalTransactions(prev => prev + 1);
                        showSnackbar('New transaction received', 'info');
                    } catch (e) {
                        console.error('Error handling newTransaction socket event', e);
                    }
                },
                onTransactionUpdated: (tx: any) => {
                    try {
                        const parsedTx: any = {
                            ...tx,
                            amount: tx.amount !== undefined ? parseFloat(tx.amount) : 0,
                            risk_score: tx.risk_score !== undefined && tx.risk_score !== null ? parseFloat(tx.risk_score) : 0.0,
                            is_fraud: Boolean(tx.is_fraud),
                        };
                        setTransactions(prev => prev.map(t => (t.transaction_id === parsedTx.transaction_id ? parsedTx : t)));
                        showSnackbar(`Transaction ${parsedTx.transaction_id} updated`, 'info');
                    } catch (e) {
                        console.error('Error handling transactionUpdated socket event', e);
                    }
                },
                onNewAnomaly: (an: any) => {
                    showSnackbar('New anomaly detected', 'warning');
                }
            });

            return () => {
                try { off(); } catch (e) { /* ignore */ }
            };
        } catch (err) {
            console.warn('Socket initialization failed', err);
        }
    }, [showSnackbar]);

    // Handle click outside to close filter dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterMenuOpen && 
                filterDropdownRef.current && 
                !filterDropdownRef.current.contains(event.target as Node) &&
                filterButtonRef.current &&
                !filterButtonRef.current.contains(event.target as Node)) {
                handleFilterClose();
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && filterMenuOpen) {
                handleFilterClose();
            }
        };

        if (filterMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [filterMenuOpen]);

    useEffect(() => {
        const newActiveFilters: { key: string; label: string; value: any }[] = [];
        if (filters.status) {
            newActiveFilters.push({
                key: 'status',
                label: `Status: ${filters.status.replace(/_/g, ' ')}`,
                value: filters.status
            });
        }
        if (filters.type) {
            newActiveFilters.push({
                key: 'type',
                label: `Type: ${filters.type.replace(/_/g, ' ')}`,
                value: filters.type
            });
        }
        if (filters.isFraud !== null && filters.isFraud !== undefined) {
            newActiveFilters.push({
                key: 'isFraud',
                label: `Fraud: ${filters.isFraud ? 'Yes' : 'No'}`,
                value: filters.isFraud
            });
        }
        if (filters.merchantCategory) {
            newActiveFilters.push({
                key: 'merchantCategory',
                label: `Merchant Category: ${filters.merchantCategory}`,
                value: filters.merchantCategory
            });
        }
        if (filters.sender_msisdn) {
            newActiveFilters.push({
                key: 'sender_msisdn',
                label: `Sender Phone: ...${filters.sender_msisdn.slice(-4)}`,
                value: filters.sender_msisdn
            });
        }
        if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
            newActiveFilters.push({
                key: 'dateRange',
                label: `Date: ${format(filters.dateRange[0], 'MMM d')} - ${format(filters.dateRange[1], 'MMM d')}`,
                value: filters.dateRange
            });
        }
        if (filters.minAmount !== null) {
            newActiveFilters.push({
                key: 'minAmount',
                label: `Min Amount: ${defaultCurrency}${filters.minAmount.toLocaleString()}`,
                value: filters.minAmount
            });
        }
        if (filters.maxAmount !== null) {
            newActiveFilters.push({
                key: 'maxAmount',
                label: `Max Amount: ${defaultCurrency}${filters.maxAmount.toLocaleString()}`,
                value: filters.maxAmount
            });
        }
        setActiveFilters(newActiveFilters);
    }, [filters, defaultCurrency]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        // Reset page when search changes
        setPage(0);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        // Force immediate fetch on submit
        fetchTransactions();
    };

    const handleFilterOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        console.log('[TransactionsPage] Filter button clicked');
        console.log('[TransactionsPage] Filter menu open state:', filterMenuOpen);
        console.log('[TransactionsPage] Filter button ref:', filterButtonRef.current);
        setFilterAnchorEl(event.currentTarget);
        setFilterMenuOpen(true);
        console.log('[TransactionsPage] Filter menu open state after setting:', true);
    };

    const handleFilterClose = () => {
        console.log('[TransactionsPage] Closing filter menu');
        setFilterMenuOpen(false);
        setFilterAnchorEl(null);
        console.log('[TransactionsPage] Filter menu open state after closing:', false);
    };

    const handleFilterApply = (newFilters: any) => {
        console.log('[TransactionsPage] Applying filters:', newFilters);
        setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
        setPage(0);
        handleFilterClose();
        // Trigger a new fetch with the updated filters
        setTimeout(() => fetchTransactions(), 0);
    };

    const handleFilterRemove = (key: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [key]: null,
        }));
        setPage(0);
    };

    const handleClearAllFilters = () => {
        setFilters({
            status: null,
            type: null,
            minAmount: null,
            maxAmount: null,
            dateRange: null,
            isFraud: null,
            merchantCategory: null,
            sender_msisdn: null,
        });
        setSearchQuery('');
        setPage(0);
    };

    const handleRowClick = (transactionId: string) => {
        console.log(`Navigating to transaction details for ID: ${transactionId}`);
        history.push(`/transactions/${transactionId}`);
    };

    const handleReviewCase = (transactionId: string) => {
        console.log(`Navigating to fraud case review for ID: ${transactionId}`);
        history.push(`/case-review/${transactionId}`);
    };

    const handleIngestionDialogOpen = () => {
        setConfirmIngestion(true);
    };

    const handleConfirmIngestion = () => {
        setConfirmIngestion(false);
        setIngestionDialogOpen(true);
    };

    const handleIngestionDialogClose = (ingestedSuccessfully?: boolean) => {
        setIngestionDialogOpen(false);
        if (ingestedSuccessfully) {
            setPage(0);
            fetchTransactions();
            showSnackbar('Transactions ingested successfully!', 'success');
        }
    };

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const handlePredictFraud = useCallback(async (transactionId: string) => {
        try {
            console.log(`[TransactionsPage] Triggering fraud prediction for transaction ID: ${transactionId}`);
            const response = await api.post(`/transactions/predict/${transactionId}`);
            const { transaction: updatedTransaction, prediction } = response.data;

            const parsedUpdatedTransaction: Transaction = {
                ...updatedTransaction,
                amount: parseFloat(updatedTransaction.amount),
                time_since_last_transaction_seconds: updatedTransaction.time_since_last_transaction_seconds !== null && updatedTransaction.time_since_last_transaction_seconds !== undefined ? parseFloat(updatedTransaction.time_since_last_transaction_seconds) : null,
                transaction_hour_of_day: updatedTransaction.transaction_hour_of_day !== null && updatedTransaction.transaction_hour_of_day !== undefined ? parseInt(updatedTransaction.transaction_hour_of_day, 10) : null,
                transaction_day_of_week: updatedTransaction.transaction_day_of_week !== null && updatedTransaction.transaction_day_of_week !== undefined ? parseInt(updatedTransaction.transaction_day_of_week, 10) : null,
                user_total_transactions: updatedTransaction.user_total_transactions !== null && updatedTransaction.user_total_transactions !== undefined ? parseInt(updatedTransaction.user_total_transactions, 10) : null,
                user_total_amount_spent: updatedTransaction.user_total_amount_spent !== null && updatedTransaction.user_total_amount_spent !== undefined ? parseFloat(updatedTransaction.user_total_amount_spent) : null,
                risk_score: updatedTransaction.risk_score !== null && updatedTransaction.risk_score !== undefined ? parseFloat(updatedTransaction.risk_score) : 0.0,
                is_fraud: Boolean(updatedTransaction.is_fraud),
            };

            setTransactions(prevTransactions =>
                prevTransactions.map(tx =>
                    tx.transaction_id === parsedUpdatedTransaction.transaction_id ? parsedUpdatedTransaction : tx
                )
            );

            showSnackbar(
                `Prediction for ${transactionId}: Fraud=${prediction.is_fraud_prediction}, Probability=${prediction.fraud_probability.toFixed(2)}`,
                prediction.is_fraud_prediction ? 'warning' : 'success'
            );
            console.log(`[TransactionsPage] Prediction successful for ${transactionId}. Updated transaction in state.`);
        } catch (err: any) {
            console.error(`[TransactionsPage] Error predicting fraud for transaction ${transactionId}:`, err.response?.data?.message || err.message);
            const errorMessage = err.response?.data?.message || `Failed to predict fraud for transaction ${transactionId}.`;
            showSnackbar(errorMessage, 'error');
        }
    }, [showSnackbar]);

    if (loading && transactions.length === 0 && !error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center justify-center">
                    <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
                    <p className="text-xl text-gray-700 dark:text-gray-300">Loading transactions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold flex items-center">
                    <ErrorOutlineIcon size={24} className="mr-3" /> Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
            {/* Premium Header with Glass Effect */}
            <div className="bg-white/90 backdrop-blur-xl dark:bg-gray-800/90 shadow-2xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-24">
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => history.push('/dashboard')}
                                className="group p-3 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 hover:from-emerald-200 hover:to-teal-200 dark:hover:from-emerald-800/70 dark:hover:to-teal-800/70 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-emerald-200/50 dark:border-emerald-700/50"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft size={20} className="text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors" />
                            </button>
                            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl border-2 border-white/20 dark:border-gray-700/20">
                                <AccountBalanceWalletIcon size={36} className="text-white drop-shadow-sm" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 dark:from-gray-100 dark:via-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                                    Transaction Monitoring
                                </h1>
                                <p className="text-base text-gray-600 dark:text-gray-300 mt-2 font-medium">
                                    Advanced financial transaction analysis & fraud detection
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-4">
                            <div className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Live Monitoring</span>
                            </div>
                            <div className="px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{totalTransactions} Total</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Premium Control Panel with Glass Effect */}
                <div className="bg-white/90 backdrop-blur-xl dark:bg-gray-800/90 rounded-3xl shadow-2xl p-8 mb-10 border border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                            <div className="flex items-center space-x-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/20 dark:border-gray-700/20">
                                    <SearchIcon size={24} className="text-white drop-shadow-sm" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-1">Search & Filter</h2>
                                    <p className="text-base text-gray-600 dark:text-gray-300 font-medium">Advanced transaction discovery and analysis tools</p>
                                </div>
                            </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <form onSubmit={handleSearchSubmit} className="flex-grow lg:flex-grow-0 min-w-[300px] lg:min-w-[400px]">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                                        <SearchIcon size={20} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search transactions (ID, User ID, Description)..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="w-full pl-12 pr-4 py-4 border border-gray-300/50 dark:border-gray-600/50 rounded-2xl text-base bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 shadow-lg hover:shadow-xl placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                        aria-label="Search transactions by ID, user ID, or description"
                                    />
                                </div>
                            </form>
                            <div className="relative">
                                <button
                                    ref={filterButtonRef}
                                    onClick={handleFilterOpen}
                                    className={`flex items-center px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 shadow-xl hover:shadow-2xl font-bold transform hover:scale-105 backdrop-blur-sm border border-emerald-400/20 ${filterMenuOpen ? 'ring-2 ring-emerald-400 shadow-2xl scale-105' : ''}`}
                                    aria-haspopup="true"
                                    aria-expanded={filterMenuOpen ? 'true' : 'false'}
                                    aria-label="Open transaction filters"
                                >
                                    <FilterIcon size={20} className="mr-2" /> 
                                    Filters
                                    {activeFilters.length > 0 && (
                                        <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                                            {activeFilters.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={handleIngestionDialogOpen}
                                className="inline-flex items-center px-6 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:via-emerald-600 hover:to-teal-700 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold border border-emerald-400/20 backdrop-blur-sm"
                                aria-label="Open CSV ingestion dialog"
                            >
                                <CloudUploadIcon size={20} className="mr-2" /> Ingest CSV
                            </button>
                            <div className="inline-flex items-center">
                                {user && (user.role === 'admin' || user.role === 'analyst') && (
                                    <SimulationButton onSimulated={(data) => {
                                        // After simulation, refresh the transactions list and show a toast
                                        fetchTransactions();
                                        showSnackbar(`Simulation created ${data.transactions?.length || 0} transaction(s)`, 'success');
                                    }} />
                                )}
                            </div>
                            <button
                                onClick={fetchTransactions}
                                disabled={loading}
                                className="p-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-600 dark:text-emerald-400 hover:from-emerald-200 hover:to-teal-200 dark:hover:from-emerald-800/70 dark:hover:to-teal-800/70 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 border border-emerald-200/50 dark:border-emerald-700/50 backdrop-blur-sm"
                                aria-label="Refresh transactions"
                            >
                                <RefreshIcon size={22} className={clsx({ 'animate-spin': loading })} />
                            </button>
                            </div>
                        </div>
                    </div>
                </div>
                {activeFilters.length > 0 && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 mt-6 border border-emerald-100 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center mb-3">
                            <FilterIcon size={16} className="text-emerald-600 dark:text-emerald-400 mr-2" />
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Active Filters ({activeFilters.length})</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {activeFilters.map(filter => (
                                <span
                                    key={filter.key}
                                    className="flex items-center bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 text-emerald-800 dark:text-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-700 shadow-sm"
                                >
                                    {filter.label}
                                    <button
                                        onClick={() => handleFilterRemove(filter.key)}
                                        className="ml-2 p-0.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors duration-200"
                                        aria-label={`Remove filter: ${filter.label}`}
                                    >
                                        <CloseIcon size={12} />
                                    </button>
                                </span>
                            ))}
                            <button
                                onClick={handleClearAllFilters}
                                className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 px-2 py-1 rounded-lg transition-colors duration-200"
                                aria-label="Clear all active filters"
                            >
                                Clear all
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Premium Transactions Table with Glass Effect */}
                <div className="bg-white/95 backdrop-blur-xl dark:bg-gray-800/95 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/20 dark:from-blue-900/5 dark:to-indigo-900/5 rounded-3xl"></div>
                    <div className="relative z-10">
                {transactions.length > 0 ? (
                    <TransactionsTable
                        transactions={transactions}
                        loading={loading}
                        onRowClick={handleRowClick}
                        defaultCurrency={defaultCurrency}
                        onPredictFraud={handlePredictFraud}
                        onReviewCase={handleReviewCase}
                    />
                ) : (
                    !loading && !error && (
                        <div className="flex flex-col items-center justify-center p-16 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl border-2 border-white/20 dark:border-gray-700/20">
                                <AccountBalanceWalletIcon size={40} className="text-white drop-shadow-sm" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Transactions Found</h3>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">No transactions match your current search criteria. Try adjusting your filters or search terms to discover more data.</p>
                        </div>
                    )
                )}
                
                    {/* Enhanced Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-t border-gray-200 dark:border-gray-600 flex-wrap gap-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <span>Rows per page:</span>
                        <div className="relative">
                            <select
                                value={rowsPerPage}
                                onChange={handleChangeRowsPerPage}
                                className="block appearance-none w-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 py-2 px-3 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                aria-label="Select rows per page"
                            >
                                {[10, 25, 50, 100].map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 my-2 sm:my-0">
                        {totalTransactions > 0 ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, totalTransactions)} of ${totalTransactions}` : `0-0 of 0`}
                    </span>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={(e) => handleChangePage(e, page - 1)}
                            disabled={page === 0}
                            className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
                            Page {page + 1} of {Math.ceil(totalTransactions / rowsPerPage) || 1}
                        </span>
                        <button
                            onClick={(e) => handleChangePage(e, page + 1)}
                            disabled={(page + 1) * rowsPerPage >= totalTransactions}
                            className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                            aria-label="Next page"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    </div>
                    </div>
                </div>
                
                <TransactionIngestionDialog
                open={ingestionDialogOpen}
                onClose={handleIngestionDialogClose}
                onIngestionSuccess={fetchTransactions}
            />
            {confirmIngestion && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Confirm CSV Ingestion
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Uploading a new CSV will replace existing transactions in the database. Are you sure you want to proceed?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setConfirmIngestion(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                                aria-label="Cancel CSV ingestion"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmIngestion}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                                aria-label="Confirm CSV ingestion"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Filter Dropdown Portal - Outside all containers */}
            {filterMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        style={{ zIndex: 99998 }}
                        onClick={handleFilterClose}
                    />
                    {/* Filter Dropdown */}
                    <div
                        ref={filterDropdownRef}
                        className="fixed top-32 right-8 w-[420px] max-w-[95vw] max-h-[85vh] origin-top-right rounded-2xl shadow-2xl bg-white dark:bg-gray-800 ring-1 ring-black/10 dark:ring-white/10 focus:outline-none border border-gray-200/50 dark:border-gray-600/50 overflow-hidden"
                        style={{ zIndex: 99999 }}
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="filters-button"
                    >
                        <TransactionFilter
                            currentFilters={filters}
                            onApply={handleFilterApply}
                            onClose={handleFilterClose}
                        />
                    </div>
                </>
            )}
            {snackbarOpen && (
                <div
                    className={clsx(
                        "fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-xl flex items-center space-x-3 z-50 transition-all duration-300",
                        {
                            'bg-green-500 text-white': snackbarSeverity === 'success',
                            'bg-red-500 text-white': snackbarSeverity === 'error',
                            'bg-blue-500 text-white': snackbarSeverity === 'info',
                            'bg-yellow-500 text-white': snackbarSeverity === 'warning',
                        }
                    )}
                    role="alert"
                >
                    {snackbarSeverity === 'success' && <CheckCircleIcon size={20} />}
                    {snackbarSeverity === 'error' && <ErrorOutlineIcon size={20} />}
                    {snackbarSeverity === 'info' && <InfoIcon size={20} />}
                    {snackbarSeverity === 'warning' && <WarningIcon size={20} />}
                    <p className="text-sm font-medium">{snackbarMessage}</p>
                    <button
                        onClick={handleSnackbarClose}
                        className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
                        aria-label="Close notification"
                    >
                        <CloseIcon size={16} />
                    </button>
                </div>
            )}
            </div>
        </div>
    );
};

export default TransactionsPage;