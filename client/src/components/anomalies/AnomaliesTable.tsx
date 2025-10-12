// client/src/components/anomalies/AnomaliesTable.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { Anomaly } from '../../types/index'; // Import the main Anomaly type

// Removed local Anomaly interface - using the main one from types/index.ts

// Renamed interface from AlertsTableProps to AnomaliesTableProps
interface AnomaliesTableProps {
    anomalies: Anomaly[];
    loading: boolean;
    onRowClick: (anomalyId: string) => void;
    onStatusChange: (anomalyId: string, newStatus: Anomaly['status']) => Promise<void>;
    updatingAnomalyId?: string | null;
}

// Renamed component from AlertsTable to AnomaliesTable
const AnomaliesTable: React.FC<AnomaliesTableProps> = ({
    anomalies, // Renamed from 'alerts'
    loading,
    onRowClick,
    onStatusChange,
    updatingAnomalyId, // Renamed from 'updatingAlertId'
}) => {
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null); // Renamed from 'selectedRow'

    // Determines the Tailwind CSS classes for the severity chip
    const getSeverityChipClass = (severity: Anomaly['severity']) => { // Updated type
        switch (severity) {
            case 'low':
                return 'bg-green-500 text-white'; // Darker green for better contrast
            case 'medium':
                return 'bg-yellow-500 text-black'; // Tailwind yellow-500, black text
            case 'high':
                return 'bg-orange-600 text-white'; // Darker orange
            case 'critical':
                return 'bg-red-700 text-white'; // Dark red
            default:
                return 'bg-gray-400 text-white'; // Default gray
        }
    };

    // Provides styling properties for different anomaly statuses
    const getStatusProps = (status: Anomaly['status']) => { // Updated type
        switch (status) {
            case 'open':
                return {
                    chipClass: 'bg-blue-600 text-white',
                    avatarClass: 'bg-blue-500',
                    icon: '🔔',
                };
            case 'investigating':
                return {
                    chipClass: 'bg-indigo-600 text-white',
                    avatarClass: 'bg-indigo-500',
                    icon: '⏳',
                };
            case 'resolved':
                return {
                    chipClass: 'bg-green-600 text-white',
                    avatarClass: 'bg-green-500',
                    icon: '✅',
                };
            case 'false_positive':
                return {
                    chipClass: 'bg-gray-600 text-white',
                    avatarClass: 'bg-gray-500',
                    icon: '⚠️',
                };
            case 'confirmed_fraud':
                return {
                    chipClass: 'bg-red-600 text-white',
                    avatarClass: 'bg-red-500',
                    icon: '🚨',
                };
            default:
                return { chipClass: 'bg-gray-400 text-white', avatarClass: 'bg-gray-400', icon: '❓' };
        }
    };

    // Renamed from 'alertsToDisplay' to 'anomaliesToDisplay'
    const anomaliesToDisplay = Array.isArray(anomalies) ? anomalies : [];
    // Renamed from 'alertStatuses' to 'anomalyStatuses' and updated type
    const anomalyStatuses: Anomaly['status'][] = ['open', 'investigating', 'resolved', 'false_positive', 'confirmed_fraud'];

    // Renamed handler function
    const handleAnomalyRowClick = (anomalyId: string) => {
        setSelectedRowId(selectedRowId === anomalyId ? null : anomalyId);
        onRowClick(anomalyId);
    };

    // Renamed handler function
    const handleAnomalyStatusChange = (anomalyId: string, newStatus: Anomaly['status']) => {
        // IMPORTANT: window.confirm should be replaced with a custom modal/dialog UI.
        // As per instructions, avoid using window.confirm/alert.
        if (true /* await showCustomConfirmDialog(`Are you sure you want to change the status of anomaly ${anomalyId} to ${newStatus.replace(/_/g, ' ')}?`) */) {
            onStatusChange(anomalyId, newStatus);
        }
    };

    return (
        <div className="w-full overflow-x-auto rounded-lg shadow-lg dark:bg-gray-800">
            {loading && anomaliesToDisplay.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] p-4 text-gray-600 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 dark:border-blue-400"></div>
                    <p className="mt-4 text-lg">Loading anomalies...</p> {/* Updated text */}
                </div>
            ) : anomaliesToDisplay.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-lg">
                    <p>No anomalies found matching your criteria.</p> {/* Updated text */}
                </div>
            ) : (
                <table className="min-w-full leading-normal table-auto">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider rounded-tl-lg">
                                Status
                            </th>
                            <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Anomaly ID {/* Updated text */}
                            </th>
                            <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Transaction ID
                            </th>
                            <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Algorithm
                            </th>
                            <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Severity
                            </th>
                            <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Risk Score
                            </th>
                            <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Timestamp
                            </th>
                            <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider rounded-tr-lg">
                                Description
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {anomaliesToDisplay.map((anomaly) => { // Renamed from 'alert' to 'anomaly'
                            console.log('[AnomaliesTable] Rendering anomaly:', anomaly);
                            const isUpdating = updatingAnomalyId === anomaly.id; // Renamed
                            // Destructure chipClass and icon to be used
                            const { chipClass, icon } = getStatusProps(anomaly.status);

                            return (
                                <tr
                                    key={anomaly.id}
                                    className={clsx(
                                        'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150',
                                        selectedRowId === anomaly.id ? 'bg-blue-50 dark:bg-blue-900' : '' // Renamed
                                    )}
                                    onClick={() => handleAnomalyRowClick(anomaly.id)} // Renamed
                                >
                                    <td className="px-4 py-3 whitespace-no-wrap text-sm text-gray-900 dark:text-gray-200" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={anomaly.status}
                                                onChange={(event) =>
                                                    handleAnomalyStatusChange(anomaly.id, event.target.value as Anomaly['status']) // Renamed
                                                }
                                                className={clsx(
                                                    "p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500",
                                                    "disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed",
                                                    chipClass // Dynamically apply status chip class
                                                )}
                                                disabled={isUpdating}
                                            >
                                                {anomalyStatuses.map((statusOption) => ( // Renamed
                                                    <option key={statusOption} value={statusOption}>
                                                        {icon} {statusOption.replace(/_/g, ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                            {isUpdating && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500 dark:border-blue-400"></div>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-no-wrap text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                        {anomaly.id?.substring(0, 10)}...
                                    </td>
                                    <td className="px-4 py-3 whitespace-no-wrap text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                        {anomaly.transaction_id?.substring(0, 10)}...
                                    </td>
                                    <td className="px-4 py-3 whitespace-no-wrap text-sm text-gray-900 dark:text-gray-200">
                                        {anomaly.triggered_by?.algorithm 
                                            ? `${anomaly.triggered_by.algorithm.replace(/_/g, ' ')}${anomaly.triggered_by?.description ? ` - ${anomaly.triggered_by.description.substring(0, 30)}...` : ''}` 
                                            : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-no-wrap text-sm">
                                        <span
                                            className={clsx(
                                                'px-3 py-1 rounded-full text-center text-xs font-semibold tracking-wide',
                                                getSeverityChipClass(anomaly.severity)
                                            )}
                                        >
                                            {anomaly.severity.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-no-wrap text-sm text-gray-900 dark:text-gray-200">
                                        {anomaly.risk_score !== undefined && anomaly.risk_score !== null
                                            ? Number(anomaly.risk_score).toFixed(2)
                                            : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-no-wrap text-sm text-gray-900 dark:text-gray-200">
                                        {format(new Date(anomaly.timestamp), 'MMM d, yyyy HH:mm')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-no-wrap text-sm text-gray-700 dark:text-gray-300">
                                        {anomaly.description ? (
                                            <span className="cursor-pointer hover:underline" title={anomaly.description}>
                                                {anomaly.description.substring(0, 50)}...
                                            </span>
                                        ) : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AnomaliesTable;
