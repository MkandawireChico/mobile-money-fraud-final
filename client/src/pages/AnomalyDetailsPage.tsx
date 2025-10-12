// client/src/pages/AnomalyDetailsPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useHistory, NavLink } from 'react-router-dom';
import clsx from 'clsx';
import io from 'socket.io-client';
import { format, parseISO } from 'date-fns';

// Import Lucide React icons for a modern and consistent look
import {
    ArrowLeft,
    Edit,
    Save,
    XCircle,
    Trash2,
    MessageSquare,
    Info,
    CheckCircle,
    AlertCircle,
    Hourglass,
    Bug,
    ChevronDown,
    CircleSlash,
    Loader2,
} from 'lucide-react';

// Import the Anomaly type from your types file
import { Anomaly } from '../types/index';
import api from '../api/axios.ts';
import { useAuth } from '../context/AuthContext.tsx';

// No longer need this as we import Anomaly directly
// interface Alert {
//     id: string;
//     transaction_id: string;
//     amount: number;
//     timestamp: string;
//     location_city: string;
//     status: 'open' | 'investigating' | 'resolved' | 'falsePositive';
//     severity: 'low' | 'medium' | 'high' | 'critical';
//     risk_score?: number;
//     comments?: string[];
// }

interface RouteParams {
    id: string;
}

const AnomalyDetailsPage: React.FC = () => { // Renamed component
    const { id } = useParams<RouteParams>();
    const history = useHistory();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    const [anomaly, setAnomaly] = useState<Anomaly | null>(null); // Renamed state variable
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    // Renamed state variables for clarity and consistency
    const [editedAnomalyStatus, setEditedAnomalyStatus] = useState<Anomaly['status'] | undefined>();
    const [editedResolutionNotes, setEditedResolutionNotes] = useState<string>('');
    const [newCommentText, setNewCommentText] = useState<string>('');
    const [resolvedByUsername, setResolvedByUsername] = useState<string | null>(null);

    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    const canManageAnomalies = isAuthenticated && (user?.role === 'admin' || user?.role === 'analyst'); // Renamed permission check
    const isAdmin = isAuthenticated && user?.role === 'admin';

    const getStatusIcon = (status: Anomaly['status'] | undefined) => { // Updated type
        switch (status) {
            case 'open': return <AlertCircle size={16} className="text-red-500" />;
            case 'investigating': return <Hourglass size={16} className="text-yellow-500" />;
            case 'resolved': return <CheckCircle size={16} className="text-green-500" />;
            case 'false_positive': return <Bug size={16} className="text-blue-500" />;
            default: return <CircleSlash size={16} className="text-gray-500" />;
        }
    };

    const getSeverityChipClasses = (severity: Anomaly['severity']) => { // Updated type
        switch (severity.toLowerCase()) {
            case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
            case 'high': return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
            case 'critical': return 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
        }
    };

    const getStatusChipClasses = (status: Anomaly['status']) => { // Updated type
        switch (status.toLowerCase()) {
            case 'open': return 'bg-red-600 text-white';
            case 'investigating': return 'bg-yellow-600 text-white';
            case 'resolved': return 'bg-green-600 text-white';
            case 'false_positive': return 'bg-blue-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    const fetchAnomalyDetails = useCallback(async () => { // Renamed function
        setLoading(true);
        setError(null);
        try {
            // Updated API endpoint from /alerts to /anomalies
            const requestUrl = `/anomalies/${id}`;
            console.log(`[AnomalyDetailsPage] Making API request to relative URL: ${requestUrl}`);
            const response = await api.get<Anomaly>(requestUrl); // Updated type
            console.log("[AnomalyDetailsPage] Raw API Response:", response.data);
            const fetchedAnomaly = response.data; // Renamed variable
            setAnomaly(fetchedAnomaly); // Updated state setter
            setEditedAnomalyStatus(fetchedAnomaly.status); // Updated state setter
            setEditedResolutionNotes(fetchedAnomaly.resolution_notes || '');

            if (fetchedAnomaly.resolved_by) {
                try {
                    const userResponse = await api.get(`/users/${fetchedAnomaly.resolved_by}`);
                    setResolvedByUsername(userResponse.data.username);
                } catch (userErr) {
                    console.warn(`[AnomalyDetailsPage] Could not fetch username for resolved_by ID: ${fetchedAnomaly.resolved_by}`, userErr); // Updated log
                    setResolvedByUsername(fetchedAnomaly.resolved_by);
                }
            } else {
                setResolvedByUsername(null);
            }
        } catch (err: any) {
            console.error(`[AnomalyDetailsPage] Error fetching anomaly details for ID ${id}:`, err.response?.data?.message || err.message); // Updated log
            setError(err.response?.data?.message || 'Failed to fetch anomaly details.'); // Updated error message
            setSnackbarMessage(err.response?.data?.message || 'Failed to fetch anomaly details.'); // Updated snackbar message
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!authLoading) {
            fetchAnomalyDetails(); // Called the renamed function
        }
    }, [fetchAnomalyDetails, authLoading]);

    const socketRef = useRef<any>(null); // Ref to store socket instance
    const intervalRef = useRef<number | null>(null); // Ref to store interval for reconnection

    useEffect(() => {
        if (!isAuthenticated || authLoading) {
            console.log('[Socket.IO] Not authenticated or auth loading, deferring socket connection.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('[Socket.IO] No token found for socket connection despite being authenticated.');
            return;
        }

        const connectSocket = () => {
            socketRef.current = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000', {
                auth: { token },
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            });

            socketRef.current.on('connect', () => {
                console.log('[Socket.IO] Connected to server for AnomalyDetailsPage'); // Updated log
                if (intervalRef.current) {
                    clearInterval(intervalRef.current); // Clear interval on successful connect
                    intervalRef.current = null;
                }
            });

            socketRef.current.on('anomalyUpdated', (updatedAnomaly: Anomaly) => { // Renamed event, updated type
                console.log('[Socket.IO] Received anomalyUpdated event:', updatedAnomaly); // Updated log
                if (anomaly && updatedAnomaly.id === anomaly.id) {
                    setAnomaly(updatedAnomaly);
                    // Only update editable fields if not currently editing to avoid overwriting user input
                    if (!isEditing) {
                        setEditedAnomalyStatus(updatedAnomaly.status);
                        setEditedResolutionNotes(updatedAnomaly.resolution_notes || '');
                    }
                    if (updatedAnomaly.resolved_by && updatedAnomaly.resolved_by !== anomaly.resolved_by) {
                        api.get(`/users/${updatedAnomaly.resolved_by}`)
                            .then(res => setResolvedByUsername(res.data.username))
                            .catch(err => {
                                console.warn(`[AnomalyDetailsPage] Could not fetch username for updated resolved_by ID: ${updatedAnomaly.resolved_by}`, err);
                                setResolvedByUsername(updatedAnomaly.resolved_by.toString());
                            });
                    } else if (!updatedAnomaly.resolved_by) {
                        setResolvedByUsername(null);
                    }
                }
            });

            socketRef.current.on('anomalyDeleted', (deletedAnomaly: { anomalyId: string }) => { // Renamed event, updated type
                console.log('[Socket.IO] Received anomalyDeleted event:', deletedAnomaly); // Updated log
                if (anomaly && deletedAnomaly.anomalyId === anomaly.id) {
                    setSnackbarMessage('This anomaly has been deleted by another user.'); // Updated snackbar message
                    setSnackbarSeverity('info');
                    setSnackbarOpen(true);
                    history.push('/anomalies'); // Updated navigation path
                }
            });

            // Handle new comments in real-time
            socketRef.current.on('anomalyCommentAdded', (data: { anomalyId: string; comment: Anomaly['comments'][0] }) => {
                if (anomaly && data.anomalyId === anomaly.id) {
                    setAnomaly(prevAnomaly => {
                        if (prevAnomaly) {
                            return {
                                ...prevAnomaly,
                                comments: [...(prevAnomaly.comments || []), data.comment]
                            };
                        }
                        return null;
                    });
                    setSnackbarMessage('New comment added to this anomaly.');
                    setSnackbarSeverity('info');
                    setSnackbarOpen(true);
                }
            });


            socketRef.current.on('disconnect', (reason) => {
                console.log('[Socket.IO] Disconnected from server for AnomalyDetailsPage:', reason); // Updated log
                if (reason === 'io server disconnect' && !socketRef.current?.connected) {
                    // Start reconnection interval if not already started
                    if (!intervalRef.current) {
                        intervalRef.current = window.setInterval(() => {
                            if (!socketRef.current?.connected) {
                                console.log('[Socket.IO] Attempting to reconnect...');
                                connectSocket(); // Retry connection
                            }
                        }, 5000); // Retry every 5 seconds
                    }
                }
            });

            socketRef.current.on('connect_error', (err: any) => {
                console.error('[Socket.IO] Connection Error:', err.message);
                setSnackbarMessage(`Socket connection error: ${err.message}`);
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            });
        };

        connectSocket();

        // Cleanup function
        return () => {
            console.log('[Socket.IO] Cleaning up socket connection...');
            if (socketRef.current) {
                socketRef.current.off('connect');
                socketRef.current.off('anomalyUpdated'); // Renamed event
                socketRef.current.off('anomalyDeleted'); // Renamed event
                socketRef.current.off('anomalyCommentAdded'); // New event
                socketRef.current.off('disconnect');
                socketRef.current.off('connect_error');
                socketRef.current.disconnect();
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current); // Clear the reconnection interval
                intervalRef.current = null;
            }
        };
    }, [anomaly, isEditing, history, isAuthenticated, authLoading, id]); // Added 'id' to dependencies

    const handleBackToAnomalies = () => history.push('/anomalies'); // Renamed function, updated path
    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing && anomaly) {
            setEditedAnomalyStatus(anomaly.status);
            setEditedResolutionNotes(anomaly.resolution_notes || '');
        }
    };

    const handleUpdateAnomalyDetails = async () => { // Renamed function
        if (!anomaly || !canManageAnomalies) return;

        setLoading(true);
        try {
            const updateData: Partial<Anomaly> = {
                status: editedAnomalyStatus,
                resolution_notes: editedResolutionNotes.trim() === '' ? null : editedResolutionNotes.trim(),
            };
            // Add resolved_by and resolved_at if status is changed to resolved/false_positive
            if ((editedAnomalyStatus === 'resolved' || editedAnomalyStatus === 'false_positive') && (!anomaly.resolved_by || !anomaly.resolved_at)) {
                updateData.resolved_by = user?.id || 'system'; // Or current user ID
                updateData.resolved_at = new Date().toISOString();
            } else if (!(editedAnomalyStatus === 'resolved' || editedAnomalyStatus === 'false_positive') && anomaly.resolved_at) {
                // If status changes away from resolved/false_positive, clear resolved_by/at
                updateData.resolved_by = null;
                updateData.resolved_at = null;
            }

            const requestUrl = `/anomalies/${id}`; // Updated endpoint
            console.log(`[AnomalyDetailsPage] Updating anomaly ${id} with data to relative URL: ${requestUrl}`, updateData); // Updated log
            const response = await api.put<Anomaly>(requestUrl, updateData); // Updated type
            const updatedAnomaly = response.data;
            setAnomaly(updatedAnomaly);
            setEditedAnomalyStatus(updatedAnomaly.status);
            setEditedResolutionNotes(updatedAnomaly.resolution_notes || '');
            setIsEditing(false);

            if (updatedAnomaly.resolved_by && updatedAnomaly.resolved_by !== anomaly.resolved_by) {
                try {
                    const userResponse = await api.get(`/users/${updatedAnomaly.resolved_by}`);
                    setResolvedByUsername(userResponse.data.username);
                } catch (userErr) {
                    console.warn(`[AnomalyDetailsPage] Could not fetch username for updated resolved_by ID: ${updatedAnomaly.resolved_by}`, userErr);
                    setResolvedByUsername(updatedAnomaly.resolved_by.toString());
                }
            } else if (!updatedAnomaly.resolved_by) {
                setResolvedByUsername(null);
            }

            setSnackbarMessage('Anomaly details updated successfully!'); // Updated snackbar message
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (err: any) {
            console.error(`[AnomalyDetailsPage] Error updating anomaly ${id}:`, err.response?.data?.message || err.message); // Updated log
            setError(err.response?.data?.message || 'Failed to update anomaly details.'); // Updated error message
            setSnackbarMessage(err.response?.data?.message || 'Failed to update anomaly details.'); // Updated snackbar message
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCommentToAnomaly = async () => { // Renamed function
        if (!anomaly || !newCommentText.trim() || !canManageAnomalies) return;

        setLoading(true); // Indicate loading while comment is being added
        try {
            const commentPayload = {
                author: user?.username || 'Anonymous', // Add author username
                author_id: user?.id, // Add author ID
                timestamp: new Date().toISOString(),
                text: newCommentText.trim()
            };

            // Updated API endpoint from /alerts/:id/comments to /anomalies/:id/comments
            const requestUrl = `/anomalies/${id}/comments`;
            console.log(`[AnomalyDetailsPage] Adding comment to anomaly ${id} at relative URL: ${requestUrl}`, commentPayload); // Updated log
            const response = await api.post<Anomaly>(requestUrl, { comment: commentPayload }); // Ensure backend receives comment object
            setAnomaly(response.data); // Update local state with the latest anomaly data from the backend
            setNewCommentText('');
            setSnackbarMessage('Comment added successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);

            // Emit Socket.IO event for real-time update to other clients
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('addAnomalyComment', { anomalyId: id, comment: commentPayload }); // Renamed event
            }
        } catch (err: any) {
            console.error(`[AnomalyDetailsPage] Error adding comment to anomaly ${id}:`, err.response?.data?.message || err.message); // Updated log
            setSnackbarMessage(err.response?.data?.message || 'Failed to add comment.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false); // Stop loading after comment operation
        }
    };

    const handleDeleteConfirmOpen = () => setDeleteDialogOpen(true);
    const handleDeleteConfirmClose = () => setDeleteDialogOpen(false);

    const handleDeleteAnomaly = async () => { // Renamed function
        if (!anomaly || !isAdmin) return;

        setLoading(true);
        setDeleteDialogOpen(false);
        try {
            const requestUrl = `/anomalies/${id}`; // Updated endpoint
            console.log(`[AnomalyDetailsPage] Deleting anomaly with ID: ${id} from relative URL: ${requestUrl}`); // Updated log
            await api.delete(requestUrl);
            setSnackbarMessage('Anomaly deleted successfully!'); // Updated snackbar message
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            history.push('/anomalies'); // Updated navigation path
        } catch (err: any) {
            console.error(`[AnomalyDetailsPage] Error deleting anomaly ${id}:`, err.response?.data?.message || err.message); // Updated log
            setError(err.response?.data?.message || 'Failed to delete anomaly.'); // Updated error message
            setSnackbarMessage(err.response?.data?.message || 'Failed to delete anomaly.'); // Updated snackbar message
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
            handleDeleteConfirmClose();
        }
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    const renderJsonData = (data: any) => {
        if (data === null || data === undefined) return 'N/A';
        try {
            const obj = typeof data === 'string' ? JSON.parse(data) : data;
            if (Object.keys(obj).length === 0) return '{}';
            return (
                <pre className="whitespace-pre-wrap break-all bg-gray-50 dark:bg-gray-700 p-2 rounded-md text-sm text-gray-800 dark:text-gray-200 overflow-auto">
                    {JSON.stringify(obj, null, 2)}
                </pre>
            );
        } catch (e) {
            console.error("Error parsing JSON data for display:", e);
            return String(data);
        }
    };

    const anomalyStatuses: Anomaly['status'][] = ['open', 'investigating', 'resolved', 'false_positive']; // Updated type

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <Loader2 size={48} className="animate-spin text-blue-500" />
                <p className="ml-4 text-gray-700 dark:text-gray-300 text-xl">Loading anomaly details...</p> {/* Updated text */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-red-600 dark:text-red-400 text-lg font-semibold">Error: {error}</div>
            </div>
        );
    }

    if (!anomaly) { // Renamed variable
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-gray-600 dark:text-gray-400 text-lg font-semibold">Anomaly not found.</div> {/* Updated text */}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                <div className="flex items-center">
                    <button
                        onClick={handleBackToAnomalies} // Renamed function
                        className="p-2 rounded-full text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 mr-2"
                        aria-label="Go back to anomalies list" // Updated aria-label
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Anomaly Details <span className="text-blue-600 dark:text-blue-400">#{anomaly.id?.substring(0, 8) || 'N/A'}...</span> {/* Updated text */}
                    </h1>
                </div>

                {canManageAnomalies && ( // Renamed permission check
                    <div className="flex items-center space-x-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleUpdateAnomalyDetails} // Renamed function
                                    disabled={loading}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50"
                                >
                                    <Save size={18} className="mr-2" /> Save
                                </button>
                                <button
                                    onClick={handleEditToggle}
                                    disabled={loading}
                                    className="flex items-center px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 disabled:opacity-50"
                                >
                                    <XCircle size={18} className="mr-2" /> Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleEditToggle}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    <Edit size={18} className="mr-2" /> Edit
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={handleDeleteConfirmOpen}
                                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                                    >
                                        <Trash2 size={18} className="mr-2" /> Delete
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Enhanced Anomaly Overview Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-xl shadow-xl mb-8 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
                        Anomaly Overview
                    </h2>
                    <div className="flex items-center space-x-2">
                        <span className={clsx("px-4 py-2 text-sm font-bold rounded-full capitalize inline-flex items-center", getSeverityChipClasses(anomaly.severity))}>
                            <Info size={14} className="mr-2" />{anomaly.severity} Risk
                        </span>
                        {isEditing && canManageAnomalies ? (
                            <div className="relative">
                                <select
                                    value={editedAnomalyStatus}
                                    onChange={(e) => setEditedAnomalyStatus(e.target.value as Anomaly['status'])}
                                    className="block w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 capitalize font-medium"
                                >
                                    {anomalyStatuses.map((statusOption) => (
                                        <option key={statusOption} value={statusOption}>
                                            {statusOption.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 dark:text-gray-300">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        ) : (
                            <span className={clsx("px-4 py-2 text-sm font-bold rounded-full capitalize inline-flex items-center space-x-2", getStatusChipClasses(anomaly.status))}>
                                {getStatusIcon(anomaly.status)} <span>{anomaly.status.replace(/_/g, ' ')}</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Anomaly ID Card */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Anomaly ID</p>
                        <p className="text-lg font-mono text-gray-900 dark:text-gray-100 break-all">{anomaly.id?.substring(0, 12)}...</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to copy full ID</p>
                    </div>

                    {/* Transaction Link Card */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Transaction</p>
                        {anomaly.transaction_id ? (
                            <NavLink to={`/transactions/${anomaly.transaction_id}`} className="text-lg font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                                {anomaly.transaction_id.substring(0, 12)}...
                            </NavLink>
                        ) : (
                            <p className="text-lg text-gray-400">N/A</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View transaction details</p>
                    </div>

                    {/* Risk Score Card */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Risk Score</p>
                        <div className="flex items-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {anomaly.risk_score !== null && anomaly.risk_score !== undefined ? Number(anomaly.risk_score).toFixed(2) : 'N/A'}
                            </p>
                            {anomaly.risk_score !== null && anomaly.risk_score !== undefined && (
                                <div className="ml-2 w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div 
                                        className={clsx("h-full transition-all duration-300", {
                                            "bg-red-500": anomaly.risk_score >= 0.8,
                                            "bg-orange-500": anomaly.risk_score >= 0.6 && anomaly.risk_score < 0.8,
                                            "bg-yellow-500": anomaly.risk_score >= 0.4 && anomaly.risk_score < 0.6,
                                            "bg-green-500": anomaly.risk_score < 0.4
                                        })}
                                        style={{ width: `${Math.min(anomaly.risk_score * 100, 100)}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fraud probability</p>
                    </div>

                    {/* Detection Time Card */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Detected</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{format(parseISO(anomaly.timestamp), 'MMM dd, HH:mm')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{format(parseISO(anomaly.timestamp), 'yyyy')}</p>
                    </div>
                </div>

                {/* Description Section */}
                <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</p>
                    <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{anomaly.description || 'No description provided.'}</p>
                </div>

                {/* Resolution Notes Section */}
                <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Resolution Notes</p>
                    {isEditing && canManageAnomalies ? (
                        <textarea
                            value={editedResolutionNotes}
                            onChange={(e) => setEditedResolutionNotes(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 resize-none"
                            placeholder="Add detailed notes about the anomaly investigation and resolution..."
                        ></textarea>
                    ) : (
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">{anomaly.resolution_notes || 'No resolution notes available.'}</p>
                    )}
                </div>
            </div>

            {/* Smart Algorithm Detection Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl shadow-lg mb-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                        <Info size={16} className="text-white" />
                    </div>
                    Detection Algorithm Analysis
                </h3>
                
                {anomaly.triggered_by ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Algorithm Used</p>
                                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                    {anomaly.triggered_by.algorithm?.replace(/_/g, ' ') || 'Unknown Algorithm'}
                                </p>
                            </div>
                            
                            <div>
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Detection Type</p>
                                <span className={clsx("px-3 py-1 rounded-full text-sm font-medium", {
                                    "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200": anomaly.triggered_by.type === 'ML Model',
                                    "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200": anomaly.triggered_by.type === 'Rule Engine',
                                    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200": anomaly.triggered_by.type === 'Manual Review',
                                    "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200": !anomaly.triggered_by.type
                                })}>
                                    {anomaly.triggered_by.type || 'Unknown'}
                                </span>
                            </div>

                            {anomaly.triggered_by.confidence && (
                                <div>
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Confidence Level</p>
                                    <div className="flex items-center">
                                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mr-2">
                                            {(Number(anomaly.triggered_by.confidence) * 100).toFixed(1)}%
                                        </p>
                                        <div className="flex-1 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                                                style={{ width: `${Math.min(Number(anomaly.triggered_by.confidence) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {anomaly.triggered_by.version && (
                                <div>
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Model Version</p>
                                    <p className="text-blue-900 dark:text-blue-100 font-mono">{anomaly.triggered_by.version}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {anomaly.triggered_by.description && (
                                <div>
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Algorithm Description</p>
                                    <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed bg-white/50 dark:bg-blue-900/20 p-3 rounded-lg">
                                        {anomaly.triggered_by.description}
                                    </p>
                                </div>
                            )}

                            {anomaly.triggered_by.selection_reason && (
                                <div>
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Selection Reason</p>
                                    <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed bg-white/50 dark:bg-blue-900/20 p-3 rounded-lg">
                                        {anomaly.triggered_by.selection_reason}
                                    </p>
                                </div>
                            )}

                            {anomaly.triggered_by.risk_factors && anomaly.triggered_by.risk_factors.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Risk Factors</p>
                                    <div className="space-y-1">
                                        {anomaly.triggered_by.risk_factors.map((factor, index) => (
                                            <span key={index} className="inline-block bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 px-2 py-1 rounded text-xs font-medium mr-2 mb-1">
                                                {factor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-blue-700 dark:text-blue-300">No algorithm detection information available</p>
                    </div>
                )}
            </div>

            {/* Enhanced Transaction Data Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6 border-l-4 border-l-emerald-500 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3">
                        <Info size={16} className="text-white" />
                    </div>
                    Transaction Details
                </h3>
                
                {anomaly.transaction_data ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Amount */}
                        {anomaly.transaction_data.amount && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">Amount</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    MWK {Number(anomaly.transaction_data.amount).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {/* Transaction Type */}
                        {anomaly.transaction_data.transaction_type && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">Type</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                    {anomaly.transaction_data.transaction_type.replace(/_/g, ' ')}
                                </p>
                            </div>
                        )}

                        {/* Location */}
                        {anomaly.transaction_data.location_city && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">Location</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {anomaly.transaction_data.location_city}
                                </p>
                            </div>
                        )}

                        {/* Merchant/Recipient */}
                        {(anomaly.transaction_data.merchant_name || anomaly.transaction_data.recipient_phone) && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">
                                    {anomaly.transaction_data.merchant_name ? 'Merchant' : 'Recipient'}
                                </p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {anomaly.transaction_data.merchant_name || anomaly.transaction_data.recipient_phone || 'N/A'}
                                </p>
                            </div>
                        )}

                        {/* Device Info */}
                        {anomaly.transaction_data.device_id && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">Device</p>
                                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                    {anomaly.transaction_data.device_id.substring(0, 12)}...
                                </p>
                            </div>
                        )}

                        {/* User Stats */}
                        {anomaly.transaction_data.user_total_transactions && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">User Activity</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {anomaly.transaction_data.user_total_transactions} transactions
                                </p>
                                {anomaly.transaction_data.user_total_amount_spent && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                        Total: MWK {Number(anomaly.transaction_data.user_total_amount_spent).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-300">No transaction data available</p>
                    </div>
                )}
            </div>

            {/* Enhanced Detection Metadata Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6 border-l-4 border-l-indigo-500 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                        <Info size={16} className="text-white" />
                    </div>
                    Detection Metadata
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* User ID */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">User ID</p>
                        <p className="text-lg font-mono text-gray-900 dark:text-gray-100">
                            {anomaly.user_id ? anomaly.user_id.substring(0, 12) + '...' : 'N/A'}
                        </p>
                    </div>

                    {/* Rule Name */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">Rule Name</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {anomaly.rule_name || 'N/A'}
                        </p>
                    </div>

                    {/* Created At */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">Created</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {anomaly.created_at ? format(parseISO(anomaly.created_at), 'MMM dd, HH:mm') : 'N/A'}
                        </p>
                        {anomaly.created_at && (
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                {format(parseISO(anomaly.created_at), 'yyyy')}
                            </p>
                        )}
                    </div>

                    {/* Updated At */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">Last Updated</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {anomaly.updated_at ? format(parseISO(anomaly.updated_at), 'MMM dd, HH:mm') : 'N/A'}
                        </p>
                        {anomaly.updated_at && (
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                {format(parseISO(anomaly.updated_at), 'yyyy')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Resolution Information */}
                {(anomaly.resolved_by || anomaly.resolved_at) && (
                    <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">Resolution Information</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {resolvedByUsername && (
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resolved By</p>
                                    <p className="text-gray-900 dark:text-gray-100 font-semibold">{resolvedByUsername}</p>
                                </div>
                            )}
                            {anomaly.resolved_at && (
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resolved At</p>
                                    <p className="text-gray-900 dark:text-gray-100 font-semibold">
                                        {format(parseISO(anomaly.resolved_at), 'MMM dd, yyyy HH:mm:ss')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b pb-3 mb-4 flex items-center">
                    <MessageSquare size={20} className="mr-2" /> Comments ({anomaly.comments?.length || 0})
                </h2>

                <div className="space-y-4">
                    {anomaly.comments && anomaly.comments.length > 0 ? (
                        anomaly.comments
                            .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime())
                            .map((comment, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-baseline mb-1">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mr-2">{comment.author || 'Unknown'}</p> {/* Using comment.author directly */}
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                                            {format(parseISO(comment.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                        </p>
                                    </div>
                                    <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{comment.text}</p>
                                </div>
                            ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No comments yet.</p>
                    )}
                </div>

                {canManageAnomalies && ( // Renamed permission check
                    <div className="mt-6 flex flex-col sm:flex-row items-end space-y-3 sm:space-y-0 sm:space-x-3">
                        <textarea
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            rows={3}
                            className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            placeholder="Add a new comment..."
                        ></textarea>
                        <button
                            onClick={handleAddCommentToAnomaly} // Renamed function
                            disabled={!newCommentText.trim() || loading}
                            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
                        >
                            <MessageSquare size={18} className="mr-2" /> Add Comment
                        </button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog (Modal) */}
            {deleteDialogOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm sm:max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Confirm Deletion</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Are you sure you want to delete this anomaly? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleDeleteConfirmClose}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAnomaly} // Renamed function
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin mr-2" /> Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} className="mr-2" /> Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Snackbar for notifications */}
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
                    {snackbarSeverity === 'success' && <CheckCircle size={20} />}
                    {snackbarSeverity === 'error' && <AlertCircle size={20} />}
                    {snackbarSeverity === 'info' && <Info size={20} />}
                    {snackbarSeverity === 'warning' && <Bug size={20} />} {/* Using Bug for warning, can adjust */}
                    <p className="text-sm font-medium">{snackbarMessage}</p>
                    <button
                        onClick={handleSnackbarClose}
                        className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
                        aria-label="Close notification"
                    >
                        <XCircle size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AnomalyDetailsPage;
