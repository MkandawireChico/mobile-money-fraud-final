// src/pages/AnomaliesPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { io } from 'socket.io-client'; // Import Socket.IO client

// Import Lucide React icons for a modern look
import {
    Filter as FilterIcon,
    Search as SearchIcon,
    RefreshCw as RefreshIcon,
    Bell as NotificationsIcon,
    UploadCloud as CloudUploadIcon,
    CheckCircle as CheckCircleIcon,
    AlertCircle as AlertCircleIcon, // Used for error and warning snackbars
    Info as InfoIcon,
    X as CloseIcon,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ArrowLeft,
} from 'lucide-react';

import api from '../api/axios.ts';
// Renamed imports for anomaly components
import AnomaliesTable from '../components/anomalies/AnomaliesTable.tsx';
import AnomalyFilter from '../components/anomalies/AnomalyFilter.tsx';
import AnomalyIngestionDialog from '../components/anomalies/AnomalyIngestionDialog.tsx';
import { Anomaly } from '../types/index'; // Renamed Alert type to Anomaly

// Renamed component from AlertsPage to AnomaliesPage
const AnomaliesPage: React.FC = () => {
    const history = useHistory();

    // Renamed state variables from 'alerts' to 'anomalies'
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false);
    const filterButtonRef = useRef<HTMLButtonElement>(null);

    const [filters, setFilters] = useState<any>({
        status: null,
        severity: null,
        rule_name: null,
        algorithm: null,
        minRiskScore: null,
        maxRiskScore: null,
        dateRange: null,
    });
    const [activeFilters, setActiveFilters] = useState<{ key: string; label: string; value: any }[]>([]);
    // Renamed ingestion dialog state
    const [ingestionDialogOpen, setIngestionDialogOpen] = useState<boolean>(false);

    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    // Renamed total alerts to total anomalies
    const [totalAnomalies, setTotalAnomalies] = useState<number>(0);

    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

    // Renamed updating alert ID
    const [updatingAnomalyId, setUpdatingAnomalyId] = useState<string | null>(null);

    const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
        
        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setSnackbarOpen(false);
        }, 4000);
    }, []);

    const handleSnackbarClose = useCallback(() => {
        setSnackbarOpen(false);
    }, []);

    const getSnackbarColorClass = (severity: 'success' | 'error' | 'info' | 'warning') => {
        switch (severity) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-black';
            case 'info':
            default:
                return 'bg-blue-500 text-white';
        }
    };

    const getSnackbarIcon = (severity: 'success' | 'error' | 'info' | 'warning') => {
        switch (severity) {
            case 'success':
                return <CheckCircleIcon size={20} />;
            case 'error':
                return <AlertCircleIcon size={20} />;
            case 'warning':
                return <AlertCircleIcon size={20} />;
            case 'info':
            default:
                return <InfoIcon size={20} />;
        }
    };

    // Defensive useEffect to explicitly declare and manage any potential lingering interval.
    // This helps prevent 'ReferenceError: interval is not defined' if a clearInterval was left behind.
    useEffect(() => {
        let intervalId: number | null = null; // Explicitly declare and initialize to null

        // If you had a setInterval (e.g., for polling data), it would be set here:
        // intervalId = setInterval(() => {
        //     console.log('[AnomaliesPage] Polling for updates...');
        //     fetchAnomalies(); // Example: Re-fetch anomalies periodically
        // }, 30000); // Polling every 30 seconds

        return () => {
            // Ensure intervalId is not null before attempting to clear it
            if (intervalId !== null) {
                window.clearInterval(intervalId);
                console.log('[AnomaliesPage] Cleared a potential background interval.');
            }
        };
    }, []); // Empty dependency array: runs once on mount, cleanup on unmount


    // Renamed fetchAlerts to fetchAnomalies
    const fetchAnomalies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();

            if (filters.status) params.append('status', filters.status);
            if (filters.severity) params.append('severity', filters.severity);
            if (filters.rule_name) params.append('rule_name', filters.rule_name);
            if (filters.algorithm) params.append('algorithm', filters.algorithm);
            if (filters.minRiskScore !== null && filters.minRiskScore !== '') params.append('min_risk_score', filters.minRiskScore.toString());
            if (filters.maxRiskScore !== null && filters.maxRiskScore !== '') params.append('max_risk_score', filters.maxRiskScore.toString());
            if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
                params.append('start_date', filters.dateRange[0].toISOString());
                params.append('end_date', filters.dateRange[1].toISOString());
            }
            if (searchQuery) params.append('search', searchQuery);

            params.append('limit', rowsPerPage.toString());
            params.append('offset', (page * rowsPerPage).toString());

            // Try /anomalies first, fallback to /alerts if needed
            const requestUrl = `/anomalies?${params.toString()}`;
            console.log(`[AnomaliesPage] Making API request to relative URL: ${requestUrl}`);
            const response = await api.get<{ anomalies: Anomaly[]; totalCount: number }>(requestUrl); // Updated type

            console.log("[AnomaliesPage] Raw API Response:", response.data);

            const fetchedAnomalies = response.data?.anomalies || []; // Updated variable name
            const fetchedTotalCount = response.data?.totalCount || 0; // Updated variable name
            
            console.log("[AnomaliesPage] Fetched anomalies:", fetchedAnomalies);
            console.log("[AnomaliesPage] Fetched total count:", fetchedTotalCount);

            setAnomalies(fetchedAnomalies); // Updated state setter
            setTotalAnomalies(fetchedTotalCount); // Updated state setter

            console.log(`[AnomaliesPage] Fetched ${fetchedAnomalies.length} anomalies. Total count: ${fetchedTotalCount}`); // Updated log
        } catch (err: any) {
            console.error('[AnomaliesPage] Error fetching anomalies:', err.response?.data?.message || err.message); // Updated log
            showSnackbar(err.response?.data?.message || 'Failed to fetch anomalies.', 'error'); // Updated snackbar message
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery, page, rowsPerPage, showSnackbar]);

    useEffect(() => {
        fetchAnomalies(); // Called the renamed function
    }, [fetchAnomalies]);

    // Socket.IO Setup for real-time updates
    useEffect(() => {
        const token = localStorage.getItem('token'); // Assuming JWT token is stored in localStorage
        const socket = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000', {
            auth: {
                token: token,
            },
            transports: ['websocket', 'polling'], // Ensure compatibility
        });

        socket.on('connect', () => {
            console.log('[Socket.IO] Connected to server.');
            // Request initial anomalies when connected and authorized
            socket.emit('request_initial_anomalies'); // Changed event name
        });

        socket.on('initial_anomalies', (initialAnomalies: Anomaly[]) => { // Changed event name and type
            console.log('[Socket.IO] Received initial anomalies:', initialAnomalies);
            // This might overwrite or supplement existing data, depending on desired behavior.
            // For simplicity, let's assume we replace the existing list if this is the primary source.
            // Or, if fetchAnomalies() is the primary, we'd only use this for *new* data.
            // For now, if we already have data, we'll merge. If not, we'll set.
            setAnomalies(prevAnomalies => {
                const existingAnomalyIds = new Set(prevAnomalies.map(a => a.id));
                const newAnomalies = initialAnomalies.filter(a => !existingAnomalyIds.has(a.id));
                return [...prevAnomalies, ...newAnomalies].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            });
        });

        socket.on('newAnomaly', (newAnomaly: Anomaly) => { // Changed event name and type
            console.log('[Socket.IO] Received new anomaly:', newAnomaly);
            setAnomalies(prevAnomalies => {
                // Check if anomaly already exists to prevent duplicates
                if (!prevAnomalies.some(a => a.id === newAnomaly.id)) {
                    showSnackbar(`New Anomaly! ${newAnomaly.triggered_by?.algorithm ? newAnomaly.triggered_by.algorithm.replace(/_/g, ' ') : 'N/A'} - ${newAnomaly.severity}`, newAnomaly.severity === 'high' || newAnomaly.severity === 'critical' ? 'error' : 'info');
                    return [newAnomaly, ...prevAnomalies].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                }
                return prevAnomalies;
            });
            setTotalAnomalies(prevCount => prevCount + 1);
        });

        socket.on('anomalyUpdated', (updatedAnomaly: Anomaly) => { // Changed event name and type
            console.log('[Socket.IO] Anomaly updated:', updatedAnomaly);
            setAnomalies(prevAnomalies =>
                prevAnomalies.map(anomaly => (anomaly.id === updatedAnomaly.id ? updatedAnomaly : anomaly))
            );
            showSnackbar(`Anomaly ${updatedAnomaly.id?.substring(0, 7)}... updated to '${updatedAnomaly.status.replace(/_/g, ' ')}'`, 'info');
        });

        socket.on('anomalyDeleted', (anomalyId: string) => { // Changed event name
            console.log('[Socket.IO] Anomaly deleted:', anomalyId);
            setAnomalies(prevAnomalies => prevAnomalies.filter(anomaly => anomaly.id !== anomalyId));
            setTotalAnomalies(prevCount => Math.max(0, prevCount - 1));
            showSnackbar(`Anomaly ${anomalyId?.substring(0, 7)}... deleted.`, 'info');
        });

        socket.on('error', (err: any) => {
            console.error('[Socket.IO] Connection error:', err);
            showSnackbar(`Socket.IO Error: ${err.message}`, 'error');
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket.IO] Disconnected:', reason);
            showSnackbar(`Socket.IO Disconnected: ${reason}`, 'warning');
        });

        return () => {
            console.log('[Socket.IO] Cleaning up socket connection.');
            socket.disconnect();
        };
    }, [showSnackbar]); // Added showSnackbar to dependency array

    useEffect(() => {
        const newActiveFilters: { key: string; label: string; value: any }[] = [];

        if (filters.status) {
            newActiveFilters.push({ key: 'status', label: `Status: ${filters.status.replace(/_/g, ' ')}`, value: filters.status });
        }
        if (filters.severity) {
            newActiveFilters.push({ key: 'severity', label: `Severity: ${filters.severity}`, value: filters.severity });
        }
        if (filters.rule_name) {
            newActiveFilters.push({ key: 'rule_name', label: `Rule: ${filters.rule_name}`, value: filters.rule_name });
        }
        if (filters.algorithm) {
            newActiveFilters.push({ key: 'algorithm', label: `Algorithm: ${filters.algorithm.replace(/_/g, ' ')}`, value: filters.algorithm });
        }
        if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
            const startDate = filters.dateRange[0] instanceof Date ? filters.dateRange[0] : parseISO(filters.dateRange[0]);
            const endDate = filters.dateRange[1] instanceof Date ? filters.dateRange[1] : parseISO(filters.dateRange[1]);
            newActiveFilters.push({ key: 'dateRange', label: `Date: ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`, value: filters.dateRange });
        }
        if (filters.minRiskScore !== null && filters.minRiskScore !== '') {
            newActiveFilters.push({ key: 'minRiskScore', label: `Min Risk: ${filters.minRiskScore.toLocaleString()}`, value: filters.minRiskScore });
        }
        if (filters.maxRiskScore !== null && filters.maxRiskScore !== '') {
            newActiveFilters.push({ key: 'maxRiskScore', label: `Max Risk: ${filters.maxRiskScore.toLocaleString()}`, value: filters.maxRiskScore });
        }
        setActiveFilters(newActiveFilters);
    }, [filters]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchAnomalies(); // Called the renamed function
    };

    const handleFilterOpen = () => setFilterMenuOpen(prev => !prev);

    const handleFilterClose = () => setFilterMenuOpen(false);

    const handleFilterApply = (newFilters: any) => {
        setFilters((prevFilters: any) => ({ ...prevFilters, ...newFilters }));
        setPage(0);
        handleFilterClose();
    };

    const handleFilterRemove = (key: string) => {
        setFilters((prevFilters: any) => ({
            ...prevFilters,
            [key]: null,
        }));
        setPage(0);
    };

    const handleClearAllFilters = () => {
        setFilters({
            status: null,
            severity: null,
            rule_name: null,
            algorithm: null,
            minRiskScore: null,
            maxRiskScore: null,
            dateRange: null,
        });
        setSearchQuery('');
        setPage(0);
    };

    // Renamed handleRowClick to handleAnomalyRowClick
    const handleAnomalyRowClick = (anomalyId: string) => {
        console.log(`Clicked anomaly ID: ${anomalyId}`); // Updated log
        history.push(`/anomalies/${anomalyId}`); // Updated route path
    };

    // Renamed ingestion dialog close handler
    const handleAnomalyIngestionDialogClose = (ingestedSuccessfully?: boolean) => {
        setIngestionDialogOpen(false);
        if (ingestedSuccessfully) {
            setPage(0);
            fetchAnomalies(); // Called the renamed function
            showSnackbar('Anomalies ingested successfully!', 'success'); // Updated snackbar message
        }
    };

    const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Duplicate functions removed - using the ones defined above

    // Renamed handleUpdateAlertStatus to handleUpdateAnomalyStatus
    const handleUpdateAnomalyStatus = useCallback(async (anomalyId: string, newStatus: Anomaly['status']) => {
        setUpdatingAnomalyId(anomalyId); // Renamed state setter
        try {
            const updatePayload: Partial<Anomaly> = { status: newStatus }; // Updated type
            if (newStatus === 'resolved' || newStatus === 'false_positive') {
                updatePayload.resolved_at = new Date().toISOString();
            } else {
                updatePayload.resolved_at = null;
            }

            // Updated API endpoint from /alerts to /anomalies
            const response = await api.put<Anomaly>(`/anomalies/${anomalyId}`, updatePayload); // Updated type
            const updatedAnomaly = response.data; // Updated variable name

            setAnomalies(prevAnomalies => // Updated state setter
                prevAnomalies.map(anomaly => (anomaly.id === anomalyId ? updatedAnomaly : anomaly))
            );

            showSnackbar(`Anomaly ${anomalyId.substring(0, 7)}... updated to '${newStatus.replace(/_/g, ' ')}'`, 'success'); // Updated snackbar message
            console.log(`[AnomaliesPage] Anomaly ${anomalyId} status updated to ${newStatus}`); // Updated log
            
            // Refresh the anomalies list to ensure resolver info is displayed
            setTimeout(() => {
                fetchAnomalies();
            }, 500);
        } catch (err: any) {
            console.error(`[AnomaliesPage] Error updating anomaly ${anomalyId} status:`, err.response?.data?.message || err.message); // Updated log
            showSnackbar(`Failed to update anomaly status: ${err.response?.data?.message || err.message}`, 'error'); // Updated snackbar message
        } finally {
            setUpdatingAnomalyId(null); // Renamed state setter
        }
    }, [showSnackbar, fetchAnomalies]);

    // Conditional rendering for loading state
    if (loading && anomalies.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400" />
                <p className="ml-4 text-gray-700 dark:text-gray-300 text-xl">Loading anomalies...</p> {/* Updated text */}
            </div>
        );
    }

    // Conditional rendering for error state
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold flex items-center">
                    <AlertCircleIcon size={24} className="mr-3" /> Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen font-inter">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <button
                            onClick={() => history.push('/dashboard')}
                            className="mr-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <NotificationsIcon size={32} className="mr-3 text-blue-600 dark:text-blue-400" />
                        Anomalies {/* Updated text */}
                    </h1>

                    <div className="flex flex-wrap items-center space-x-2 sm:space-x-3">
                        <form onSubmit={handleSearchSubmit} className="flex-grow sm:flex-grow-0 min-w-[200px] sm:min-w-[280px]">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                                    <SearchIcon size={20} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search anomalies by ID, transaction, rule..." // Corrected: Removed embedded comment
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                                />
                            </div>
                        </form>

                        <div className="relative">
                            <button
                                ref={filterButtonRef}
                                onClick={handleFilterOpen}
                                className="flex items-center px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                                aria-haspopup="true"
                                aria-expanded={filterMenuOpen ? 'true' : 'false'}
                                aria-label="Open filter menu"
                            >
                                <FilterIcon size={18} className="mr-2" /> Filters
                                <ChevronDown size={16} className="ml-1" />
                            </button>
                            {filterMenuOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-72 origin-top-right rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20 dark:bg-gray-800 dark:ring-gray-700"
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="filters-button"
                                >
                                    <div className="fixed inset-0 z-10" onClick={handleFilterClose}></div>
                                    <div className="relative z-20">
                                        <AnomalyFilter // Renamed component
                                            currentFilters={filters}
                                            onApply={handleFilterApply}
                                            onClose={handleFilterClose}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIngestionDialogOpen(true)}
                            className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                            aria-label="Ingest anomalies from CSV" // Updated text
                        >
                            <CloudUploadIcon size={18} className="mr-2" /> Ingest CSV
                        </button>

                        <button
                            onClick={fetchAnomalies} // Called the renamed function
                            disabled={loading}
                            className="p-2.5 rounded-full text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 dark:text-blue-400 dark:hover:bg-blue-900 disabled:opacity-50"
                            aria-label="Refresh anomalies" // Updated text
                        >
                            <RefreshIcon size={24} className={clsx({ 'animate-spin': loading })} />
                        </button>
                    </div>
                </div>

                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap items-center mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Active Filters:</span>
                        {activeFilters.map(filter => (
                            <span
                                key={filter.key}
                                className="flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full mr-2 mb-1 dark:bg-blue-900 dark:text-blue-100"
                            >
                                {filter.label}
                                <button
                                    onClick={() => handleFilterRemove(filter.key)}
                                    className="ml-1 p-0.5 rounded-full hover:bg-blue-200 hover:text-blue-900 dark:hover:bg-blue-800 dark:hover:text-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label={`Remove filter: ${filter.label}`}
                                >
                                    <CloseIcon size={12} />
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={handleClearAllFilters}
                            className="text-blue-600 dark:text-blue-400 text-sm hover:underline ml-2 mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Clear all filters"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Anomalies Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700 overflow-hidden">
                <>
                    {console.log('[AnomaliesPage] Rendering anomalies table with', anomalies.length, 'anomalies')}
                    <AnomaliesTable // Renamed component
                        anomalies={anomalies} // Renamed prop
                        loading={loading}
                        onRowClick={handleAnomalyRowClick} // Renamed handler
                        onStatusChange={handleUpdateAnomalyStatus} // Renamed handler
                        updatingAnomalyId={updatingAnomalyId} // Renamed prop
                    />
                </>

                {!loading && anomalies.length === 0 && !error && (
                    <div className="flex justify-center p-8 text-gray-500 dark:text-gray-400 text-lg">
                        <p>No anomalies found matching your criteria.</p> {/* Updated text */}
                    </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-wrap gap-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <span>Rows per page:</span>
                        <div className="relative">
                            <select
                                value={rowsPerPage}
                                onChange={handleChangeRowsPerPage}
                                className="block appearance-none w-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 py-1.5 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                                aria-label="Rows per page"
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
                        {totalAnomalies > 0 ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, totalAnomalies)} of ${totalAnomalies}` : `0-0 of 0`} {/* Updated total */}
                    </span>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={(e) => handleChangePage(e, page - 1)}
                            disabled={page === 0}
                            className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={(e) => handleChangePage(e, page + 1)}
                            disabled={(page + 1) * rowsPerPage >= totalAnomalies} 
                            className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            aria-label="Next page"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Anomaly Ingestion Dialog */}
            <AnomalyIngestionDialog // Renamed component
                open={ingestionDialogOpen}
                onClose={handleAnomalyIngestionDialogClose} // Renamed handler
                onIngestionSuccess={fetchAnomalies} // Called the renamed function
            />

            {/* Custom Snackbar for feedback */}
            {snackbarOpen && (
                <div
                    className={clsx(
                        "fixed bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-xl flex items-center space-x-3 z-50 transition-all duration-300 transform-gpu",
                        getSnackbarColorClass(snackbarSeverity)
                    )}
                    role="alert"
                >
                    {getSnackbarIcon(snackbarSeverity)}
                    <p className="text-base font-medium">{snackbarMessage}</p>
                    <button
                        onClick={handleSnackbarClose}
                        className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Close notification"
                    >
                        <CloseIcon size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AnomaliesPage;
