// client/src/components/dashboard/RecentAnomaliesTable.tsx
import React from 'react';
import { format } from 'date-fns';
import clsx from 'clsx'; // Import clsx for conditional class names

// Define an Anomaly interface. It extends the original Alert type
// but emphasizes risk_score and updates terminology.
// Assuming this type will be fetched from the backend, potentially replacing or extending 'Alert'.
export interface Anomaly {
    anomaly_id: string; // Renamed from alert_id
    transaction_id: string;
    risk_score: number; // Crucial for unsupervised learning
    status: 'open' | 'resolved' | 'false_positive' | 'closed'; // Updated possible statuses
    timestamp: string;
    description?: string; // Optional field for a brief summary of the anomaly
    // Any other relevant fields like transaction_amount, sender, receiver etc.
    // For now, we'll focus on what's displayed in the table.
}

interface RecentAnomaliesTableProps {
    anomalies: Anomaly[]; // Prop name changed from 'alerts' to 'anomalies'
    onRowClick: (anomalyId: string) => void; // Callback now takes anomalyId
}

const RecentAnomaliesTable: React.FC<RecentAnomaliesTableProps> = ({ anomalies, onRowClick }) => {
    // Helper function to get Tailwind classes for status chips based on anomaly status AND risk score
    const getStatusChipClasses = (status: Anomaly['status'], riskScore: number) => {
        // Base classes for chips
        const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full';

        // Dark mode considerations for text colors
        const textColorOpen = 'text-red-800 dark:text-red-100';
        const textColorResolved = 'text-green-800 dark:text-green-100';
        const textColorFalsePositive = 'text-blue-800 dark:text-blue-100'; // Using blue for false positive
        const textColorClosed = 'text-gray-700 dark:text-gray-300';
        const textColorDefault = 'text-gray-800 dark:text-gray-200';

        switch (status.toLowerCase()) {
            case 'open':
                // For open anomalies, add a visual cue based on risk score
                if (riskScore >= 0.8) return clsx(baseClasses, 'bg-red-500 dark:bg-red-700', textColorOpen); // High risk
                if (riskScore >= 0.5) return clsx(baseClasses, 'bg-orange-300 dark:bg-orange-500', textColorOpen); // Medium risk
                return clsx(baseClasses, 'bg-yellow-200 dark:bg-yellow-500', textColorOpen); // Low risk
            case 'resolved':
                return clsx(baseClasses, 'bg-green-100 dark:bg-green-700', textColorResolved);
            case 'false_positive':
                return clsx(baseClasses, 'bg-blue-100 dark:bg-blue-700', textColorFalsePositive); // New status
            case 'closed':
                return clsx(baseClasses, 'bg-gray-200 dark:bg-gray-700', textColorClosed);
            default:
                return clsx(baseClasses, 'bg-gray-100 dark:bg-gray-800', textColorDefault);
        }
    };

    // Determine dark mode for Recharts theme adjustments
    const isDarkMode = document.documentElement.classList.contains('dark');
    const tableHeaderBg = isDarkMode ? 'bg-blue-900' : 'bg-blue-800';
    const tableHeaderTextColor = 'text-white dark:text-gray-100';
    const tableRowBgEven = 'bg-gray-50 dark:bg-gray-700'; // Even row background in dark mode
    const tableRowBgOdd = 'bg-white dark:bg-gray-800'; // Odd row background in dark mode
    const tableHoverBg = 'hover:bg-blue-50 dark:hover:bg-blue-900'; // Hover effect
    const tableBorderColor = 'divide-gray-200 dark:divide-gray-700';
    const cellTextColor = 'text-gray-900 dark:text-gray-100';
    const placeholderTextColor = 'text-gray-500 dark:text-gray-400';

    return (
        // Table Container: Provides overall styling, shadow, rounded corners, and border
        <div className="flex-grow overflow-hidden bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Responsive Table Wrapper: Allows horizontal scrolling on smaller screens */}
            <div className="overflow-x-auto h-full">
                <table className={`min-w-full ${tableBorderColor}`}>
                    {/* Table Head: Styled with a dark blue background for prominence */}
                    <thead className={tableHeaderBg}>
                        <tr>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold ${tableHeaderTextColor} uppercase tracking-wider`}>
                                Status
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold ${tableHeaderTextColor} uppercase tracking-wider`}>
                                Anomaly ID
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold ${tableHeaderTextColor} uppercase tracking-wider`}>
                                Transaction ID
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold ${tableHeaderTextColor} uppercase tracking-wider`}>
                                Risk Score
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold ${tableHeaderTextColor} uppercase tracking-wider`}>
                                Timestamp
                            </th>
                        </tr>
                    </thead>
                    {/* Table Body: Displays anomaly data */}
                    <tbody className={`divide-y ${tableBorderColor}`}>
                        {anomalies.length === 0 ? (
                            // Message displayed when there are no anomalies
                            <tr className="bg-gray-50 dark:bg-gray-700">
                                <td colSpan={5} className={`px-4 py-4 whitespace-nowrap text-sm text-center ${placeholderTextColor}`}>
                                    No recent anomalies.
                                </td>
                            </tr>
                        ) : (
                            // Map through anomalies and render each row
                            anomalies.map((anomaly, index) => (
                                <tr
                                    key={anomaly.anomaly_id || `anomaly-${index}`} // Use index as fallback key
                                    // Row styling with alternating background colors and hover effect
                                    className={clsx(
                                        (index % 2 === 0 ? tableRowBgOdd : tableRowBgEven),
                                        tableHoverBg,
                                        "transition duration-150 ease-in-out cursor-pointer"
                                    )}
                                    onClick={() => onRowClick(anomaly.anomaly_id || '')} // Ensure ID is passed, handle empty case
                                >
                                    {/* Status Cell with a styled chip */}
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <span
                                            className={getStatusChipClasses(anomaly.status, anomaly.risk_score)}
                                        >
                                            {anomaly.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    {/* Anomaly ID Cell with truncation and native tooltip */}
                                    <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${cellTextColor}`} title={anomaly.anomaly_id || 'N/A'}>
                                        <span className="max-w-[100px] truncate block">
                                            {(anomaly.anomaly_id || 'N/A').substring(0, 8)}...
                                        </span>
                                    </td>
                                    {/* Transaction ID Cell with truncation and native tooltip */}
                                    <td className={`px-4 py-2 whitespace-nowrap text-sm ${cellTextColor}`} title={anomaly.transaction_id || 'N/A'}>
                                        <span className="max-w-[100px] truncate block">
                                            {(anomaly.transaction_id || 'N/A').substring(0, 8)}...
                                        </span>
                                    </td>
                                    {/* Risk Score Cell */}
                                    <td className={`px-4 py-2 whitespace-nowrap text-sm font-bold ${cellTextColor}`}>
                                        {anomaly.risk_score !== undefined ? (anomaly.risk_score * 100).toFixed(1) + '%' : 'N/A'}
                                    </td>
                                    {/* Timestamp Cell with date formatting */}
                                    <td className={`px-4 py-2 whitespace-nowrap text-sm ${cellTextColor}`}>
                                        {anomaly.timestamp ? format(new Date(anomaly.timestamp), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentAnomaliesTable;
