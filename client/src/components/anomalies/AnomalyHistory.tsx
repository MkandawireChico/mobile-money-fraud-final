// client/src/components/anomalies/AnomalyHistory.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns'; // Make sure date-fns is imported for formatting

interface AnomalyHistoryItem { // Renamed interface
    id: string;
    transaction_id: string;
    status: string;
    updated_at: string;
}

const AnomalyHistory: React.FC = () => { // Renamed component
    const [anomalyHistory, setAnomalyHistory] = useState<AnomalyHistoryItem[]>([]); // Renamed state variable
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnomalyHistory = useCallback(async () => { // Renamed function
        setLoading(true);
        setError(null);
        try {
            // Updated API endpoint from /alerts/history to /anomalies/history
            const response = await api.get('/anomalies/history');
            setAnomalyHistory(response.data); // Updated state setter
            console.log("[AnomalyHistory] Fetched anomaly history:", response.data);
        } catch (err: any) {
            console.error('[AnomalyHistory] Error fetching anomaly history:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to load anomaly history'); // Updated error message
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnomalyHistory(); // Called the renamed function
    }, [fetchAnomalyHistory]);

    if (loading) {
        return (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 dark:border-blue-400"></div>
                    <p className="ml-2 text-gray-600 dark:text-gray-300">Loading anomaly history...</p> {/* Updated text */}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center text-red-600 dark:text-red-400">
                <p className="text-lg">{error}</p>
                <button
                    onClick={fetchAnomalyHistory} // Called the renamed function
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Anomaly History</h2> {/* Updated text */}
            {anomalyHistory.length === 0 ? ( // Updated state variable
                <p className="text-gray-500 dark:text-gray-400 text-center">No anomaly history available.</p> 
            ) : (
                <div className="overflow-y-auto max-h-64 space-y-3">
                    {anomalyHistory.map((item) => ( // Updated state variable
                        <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-100 dark:border-gray-600">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Anomaly ID: <span className="font-normal text-blue-600 dark:text-blue-400">{item.id?.substring(0, 10)}...</span></p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Transaction ID: <span className="font-normal text-blue-600 dark:text-blue-400">{item.transaction_id?.substring(0, 10)}...</span></p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Status: <span className="font-normal capitalize">{item.status.replace(/_/g, ' ')}</span></p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Updated: <span className="font-normal">{format(new Date(item.updated_at), 'MMM d, yyyy HH:mm')}</span></p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnomalyHistory;
