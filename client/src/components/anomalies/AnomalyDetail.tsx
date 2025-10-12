// client/src/components/anomalies/AnomalyDetails.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Anomaly } from '../../types/index'; // Import the Anomaly interface directly

// Import Lucide React icons for a modern look
import {
    Loader2,
    ArrowLeft,
    AlertCircle,
    MessageSquareMore, // For comments section
    Save, // For save button
} from 'lucide-react';

interface RouteParams {
    id: string;
}

const AnomalyDetails: React.FC = () => { // Renamed component
    const history = useHistory();
    const { id } = useParams<RouteParams>();
    const { user } = useAuth(); // Assuming useAuth provides a user object with username and id

    const [anomaly, setAnomaly] = useState<Anomaly | null>(null); // Renamed state variable
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    // Renamed status and severity state variables
    const [currentAnomalyStatus, setCurrentAnomalyStatus] = useState<Anomaly['status']>('open');
    const [currentAnomalySeverity, setCurrentAnomalySeverity] = useState<Anomaly['severity']>('low');
    
    const [newCommentText, setNewCommentText] = useState<string>(''); // Renamed for clarity
    // Store comments as an array of objects to match the Anomaly interface
    const [anomalyCommentsList, setAnomalyCommentsList] = useState<Anomaly['comments']>([]);

    const fetchAnomalyDetails = useCallback(async () => { // Renamed function
        setLoading(true);
        setError(null);
        try {
            // Updated API endpoint from /alerts/:id to /anomalies/:id
            const response = await api.get<Anomaly>(`/anomalies/${id}`); // Updated type
            const fetchedAnomaly: Anomaly = response.data; // Renamed variable
            setAnomaly(fetchedAnomaly); // Updated state setter
            setCurrentAnomalyStatus(fetchedAnomaly.status); // Updated state setter
            setCurrentAnomalySeverity(fetchedAnomaly.severity); // Updated state setter
            setAnomalyCommentsList(fetchedAnomaly.comments || []); // Initialize with existing comments

            console.log("[AnomalyDetails] Fetched anomaly details:", fetchedAnomaly);
        } catch (err: any) {
            console.error('[AnomalyDetails] Error fetching anomaly:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to load anomaly details'); // Updated error message
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAnomalyDetails(); // Called the renamed function
    }, [fetchAnomalyDetails]);

    const handleAnomalyStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => { // Renamed function
        setCurrentAnomalyStatus(e.target.value as Anomaly['status']); // Updated type and state setter
    };

    const handleAnomalySeverityChange = (e: React.ChangeEvent<HTMLSelectElement>) => { // Renamed function
        setCurrentAnomalySeverity(e.target.value as Anomaly['severity']); // Updated type and state setter
    };

    const handleNewCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { // Renamed for clarity
        setNewCommentText(e.target.value);
    };

    const handleSaveAnomalyChanges = async () => { // Renamed function
        if (!anomaly) return; // Ensure anomaly object exists

        setIsSaving(true);
        try {
            const newCommentEntry = newCommentText.trim() ? {
                author: user?.username || 'Anonymous',
                author_id: user?.id ? user.id : undefined, // Ensure author_id is string or undefined
                timestamp: new Date().toISOString(),
                text: newCommentText.trim(),
            } : null;

            const updatedComments = newCommentEntry ? [...anomalyCommentsList, newCommentEntry] : anomalyCommentsList;

            const updatePayload: Partial<Anomaly> = {
                status: currentAnomalyStatus,
                severity: currentAnomalySeverity,
                comments: updatedComments,
                updated_at: new Date().toISOString(), // Update updated_at timestamp
            };

            // If status is resolved or false_positive, set resolved_at
            if (currentAnomalyStatus === 'resolved' || currentAnomalyStatus === 'false_positive') {
                updatePayload.resolved_at = new Date().toISOString();
            } else {
                updatePayload.resolved_at = null; // Clear if status changes away from resolved/false_positive
            }
            // Add resolution notes if status is resolved/false_positive and there's a new comment that could serve as a note
            // For a more robust solution, a dedicated 'resolution_notes' field in the UI would be better.
            if ((currentAnomalyStatus === 'resolved' || currentAnomalyStatus === 'false_positive') && newCommentText.trim()) {
                 updatePayload.resolution_notes = newCommentText.trim();
            }


            // Updated API endpoint from /alerts/:id to /anomalies/:id
            const response = await api.put<Anomaly>(`/anomalies/${id}`, updatePayload);
            const updatedAnomaly = response.data;

            setAnomaly(updatedAnomaly);
            setCurrentAnomalyStatus(updatedAnomaly.status);
            setCurrentAnomalySeverity(updatedAnomaly.severity);
            setAnomalyCommentsList(updatedAnomaly.comments || []); // Update with potentially new comments from backend
            setNewCommentText(''); // Clear comment input after saving

            console.log(`[AnomalyDetails] Anomaly ${id} updated:`, updatedAnomaly);
        } catch (err: any) {
            console.error(`[AnomalyDetails] Error saving anomaly changes for ${id}:`, err.response?.data?.message || err.message);
            setError('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] flex-col bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                <Loader2 size={48} className="animate-spin text-blue-500 dark:text-blue-400" />
                <p className="mt-4 text-lg">Loading anomaly details...</p> {/* Updated text */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold flex items-center">
                    <AlertCircle size={24} className="mr-3" /> Error: {error}
                </div>
                <button
                    type="button"
                    onClick={() => history.push('/anomalies')} // Updated navigation path
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                    Back to Anomalies {/* Updated text */}
                </button>
            </div>
        );
    }

    if (!anomaly) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 min-h-screen">
                <h6 className="text-xl">No anomaly data available</h6> {/* Updated text */}
                <button
                    type="button"
                    onClick={() => history.push('/anomalies')} // Updated navigation path
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                    Back to Anomalies {/* Updated text */}
                </button>
            </div>
        );
    }

    const getSeverityChipClass = (severity: Anomaly['severity']) => {
        switch (severity) {
            case 'low': return 'bg-green-500 text-white';
            case 'medium': return 'bg-yellow-500 text-black';
            case 'high': return 'bg-orange-600 text-white';
            case 'critical': return 'bg-red-700 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };

    const getStatusChipClass = (status: Anomaly['status']) => {
        switch (status) {
            case 'open': return 'bg-blue-600 text-white';
            case 'investigating': return 'bg-indigo-600 text-white';
            case 'resolved': return 'bg-green-600 text-white';
            case 'false_positive': return 'bg-gray-600 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen font-inter text-gray-900 dark:text-gray-100">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <button
                        type="button"
                        onClick={() => history.push('/anomalies')} // Updated navigation path
                        className="mr-4 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                        aria-label="Back to anomalies list"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold">Anomaly Details {/* Updated text */}
                        <span className="ml-3 text-blue-600 dark:text-blue-400">{anomaly.id.substring(0, 8)}...</span>
                    </h1>
                </div>

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Anomaly ID */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Anomaly ID:</p>
                        <p className="text-md font-semibold break-all">{anomaly.id}</p>
                    </div>

                    {/* Transaction ID */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction ID:</p>
                        <p className="text-md font-semibold break-all">
                            {anomaly.transaction_id || 'N/A'}
                        </p>
                    </div>

                    {/* Rule Name */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Algorithm:</p>
                        <p className="text-md font-semibold">
                            {anomaly.triggered_by?.algorithm 
                                ? `${anomaly.triggered_by.algorithm.replace(/_/g, ' ')}${anomaly.triggered_by?.description ? ` - ${anomaly.triggered_by.description}` : ''}` 
                                : 'N/A'}
                        </p>
                    </div>

                    {/* Amount */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction Amount:</p>
                        <p className="text-md font-semibold">{anomaly.transaction_data?.amount ? `${anomaly.transaction_data.amount.toLocaleString()} MWK` : 'N/A'}</p>
                    </div>

                    {/* Timestamp */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Detected At:</p>
                        <p className="text-md font-semibold">{format(new Date(anomaly.timestamp), 'MMM d, yyyy HH:mm:ss')}</p>
                    </div>

                    {/* Location */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Location (City):</p>
                        <p className="text-md font-semibold">{anomaly.transaction_data?.location_city || 'N/A'}</p>
                    </div>

                     {/* Risk Score */}
                     <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Score:</p>
                        <p className="text-md font-semibold">{anomaly.risk_score !== undefined && anomaly.risk_score !== null ? anomaly.risk_score.toFixed(2) : 'N/A'}</p>
                    </div>
                </div>

                {/* Resolution Information */}
                {(anomaly.status === 'resolved' || anomaly.status === 'false_positive') && (anomaly.resolved_at || anomaly.resolver_info) && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                            <AlertCircle size={20} className="mr-2" />
                            Case Resolution Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {anomaly.resolver_info?.username && (
                                <div>
                                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Resolved By:</p>
                                    <p className="text-md font-semibold text-green-800 dark:text-green-200">
                                        {anomaly.resolver_info.username}
                                        {anomaly.resolver_info.role && (
                                            <span className="ml-2 text-xs px-2 py-1 bg-green-200 dark:bg-green-800 rounded-full">
                                                {anomaly.resolver_info.role}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                            {anomaly.resolved_at && (
                                <div>
                                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Resolved At:</p>
                                    <p className="text-md font-semibold text-green-800 dark:text-green-200">
                                        {format(new Date(anomaly.resolved_at), 'MMM d, yyyy HH:mm:ss')}
                                    </p>
                                </div>
                            )}
                            {anomaly.resolution_notes && (
                                <div className="md:col-span-2 lg:col-span-1">
                                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Resolution Notes:</p>
                                    <p className="text-sm text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/30 p-2 rounded">
                                        {anomaly.resolution_notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Status & Severity Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status:
                        </label>
                        <select
                            id="status-select"
                            value={currentAnomalyStatus}
                            onChange={handleAnomalyStatusChange}
                            className={`w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${getStatusChipClass(currentAnomalyStatus)}`}
                        >
                            <option value="open">Open</option>
                            <option value="investigating">Investigating</option>
                            <option value="resolved">Resolved</option>
                            <option value="false_positive">False Positive</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="severity-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Severity:
                        </label>
                        <select
                            id="severity-select"
                            value={currentAnomalySeverity}
                            onChange={handleAnomalySeverityChange}
                            className={`w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${getSeverityChipClass(currentAnomalySeverity)}`}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <MessageSquareMore size={24} className="mr-2 text-blue-600 dark:text-blue-400" /> Comments
                    </h2>
                    <div className="space-y-4 max-h-80 overflow-y-auto mb-4 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                        {anomalyCommentsList.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center italic">No comments yet.</p>
                        ) : (
                            anomalyCommentsList.map((comment, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 break-words">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{comment.author || 'Unknown User'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        {comment.timestamp ? format(new Date(comment.timestamp), 'MMM d, yyyy HH:mm:ss') : 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <textarea
                        value={newCommentText}
                        onChange={handleNewCommentTextChange}
                        placeholder="Add a new comment..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        rows={3}
                    />
                    <button
                        type="button"
                        onClick={handleSaveAnomalyChanges} // Called the renamed function
                        disabled={isSaving || !newCommentText.trim()} // Disable if no new comment
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={20} className="animate-spin mr-2" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save size={20} className="mr-2" /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnomalyDetails;
