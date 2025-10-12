// client/src/components/auditLogs/AuditLogExport.tsx
import React, { useState } from 'react';
import api from '../../api/axios';

interface AuditLogExportProps {
    filters: {
        actionType: string | null;
        resourceType: string | null;
        userId: string | null;
        dateRange: [Date | null, Date | null] | null;
    };
    onExportComplete?: (success: boolean) => void;
}

const AuditLogExport: React.FC<AuditLogExportProps> = ({ filters, onExportComplete }) => {
    const [exporting, setExporting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        setExporting(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                actionType: filters.actionType || '',
                resourceType: filters.resourceType || '',
                userId: filters.userId || '',
                startDate: filters.dateRange?.[0] ? format(filters.dateRange[0], 'yyyy-MM-dd') : '',
                endDate: filters.dateRange?.[1] ? format(filters.dateRange[1], 'yyyy-MM-dd') : '',
            }).toString();
            const response = await api.get(`/auditlogs/export?${queryParams}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            if (onExportComplete) onExportComplete(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to export audit logs');
            if (onExportComplete) onExportComplete(false);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Export Audit Logs</h3>
            <p className="text-sm text-gray-600 mb-4">Export filtered audit logs as a CSV file.</p>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {exporting ? (
                    <span className="flex items-center">
                        Exporting...
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white ml-2"></div>
                    </span>
                ) : 'Export CSV'}
            </button>
        </div>
    );
};

export default AuditLogExport;