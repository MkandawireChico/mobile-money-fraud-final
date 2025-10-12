// client/src/components/auditLogs/AuditLogsTable.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';

// Enhanced icons for better UX
import { 
    Copy as CopyIcon, 
    Shield, 
    AlertTriangle, 
    CheckCircle, 
    XCircle,
    User,
    Database,
    Settings,
    Activity,
    Clock
} from 'lucide-react'; 

export interface AuditLog {
    id: string;
    user_id?: string;
    username?: string;
    action_type: string;
    entity_type?: string;
    entity_id?: string;
    description?: string;
    details?: any;
    ip_address?: string;
    user_agent?: string;
    timestamp: string;
    resource_type?: string;
    resource_id?: string;
}

interface AuditLogsTableProps {
    auditLogs: AuditLog[];
    loading: boolean;
    onRowClick?: (auditLogId: string) => void;
    selectedAuditLogId?: string | null;
}

const AuditLogsTable: React.FC<AuditLogsTableProps> = ({ auditLogs, loading, onRowClick, selectedAuditLogId }) => {
    const [selectedRow, setSelectedRow] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const logsToDisplay = Array.isArray(auditLogs) ? auditLogs : [];

    // Helper function to get action type styling
    const getActionTypeStyle = (actionType: string) => {
        const type = actionType.toLowerCase();
        if (type.includes('failed') || type.includes('error') || type.includes('delete')) {
            return {
                bg: 'bg-red-100 dark:bg-red-900/30',
                text: 'text-red-800 dark:text-red-200',
                icon: XCircle,
                border: 'border-red-200 dark:border-red-700'
            };
        } else if (type.includes('fraud') || type.includes('anomaly') || type.includes('alert')) {
            return {
                bg: 'bg-orange-100 dark:bg-orange-900/30',
                text: 'text-orange-800 dark:text-orange-200',
                icon: AlertTriangle,
                border: 'border-orange-200 dark:border-orange-700'
            };
        } else if (type.includes('login') || type.includes('auth') || type.includes('session')) {
            return {
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                text: 'text-blue-800 dark:text-blue-200',
                icon: Shield,
                border: 'border-blue-200 dark:border-blue-700'
            };
        } else if (type.includes('created') || type.includes('success') || type.includes('completed')) {
            return {
                bg: 'bg-green-100 dark:bg-green-900/30',
                text: 'text-green-800 dark:text-green-200',
                icon: CheckCircle,
                border: 'border-green-200 dark:border-green-700'
            };
        } else {
            return {
                bg: 'bg-gray-100 dark:bg-gray-700/50',
                text: 'text-gray-800 dark:text-gray-200',
                icon: Activity,
                border: 'border-gray-200 dark:border-gray-600'
            };
        }
    };

    // Helper function to get entity type icon
    const getEntityIcon = (entityType: string) => {
        const type = entityType?.toLowerCase() || '';
        if (type.includes('user')) return User;
        if (type.includes('transaction')) return Database;
        if (type.includes('setting')) return Settings;
        return Activity;
    };

    const handleRowClick = (auditLogId: string) => {
        setSelectedRow(selectedRow === auditLogId ? null : auditLogId);
        if (onRowClick) {
            onRowClick(auditLogId);
        }
    };

    const handleCopyDetails = (details: any, logId: string) => {
        try {
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = JSON.stringify(details, null, 2);
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);
            
            // Show visual feedback
            setCopiedId(logId);
            setTimeout(() => setCopiedId(null), 2000);
            console.log('Details copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text to clipboard:', err);
        }
    };

    if (loading && logsToDisplay.length === 0) {
        return (
            <div className="p-3 text-center text-gray-500 min-h-[200px] flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
                <p className="mt-2">Loading audit logs...</p>
            </div>
        );
    }

    if (logsToDisplay.length === 0) {
        return (
            <div className="p-3 text-center text-gray-500">
                <p>No audit logs found matching your criteria.</p>
            </div>
        );
    }

    // Removed the problematic local clsx function

    return (
        <div className="w-full">
            <div className="overflow-x-auto shadow-xl rounded-lg border-2 border-gray-300 dark:border-gray-600 max-h-[80vh] bg-white dark:bg-gray-800">
                <table className="min-w-full table-fixed">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 text-left sticky top-0 z-10 shadow-sm">
                        <tr>
                        <th className="w-32 p-4 border-b-2 border-gray-200 dark:border-gray-600 font-semibold text-sm uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                                <Clock size={16} />
                                <span>Time</span>
                            </div>
                        </th>
                        <th className="w-40 p-4 border-b-2 border-gray-200 dark:border-gray-600 font-semibold text-sm uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                                <User size={16} />
                                <span>User</span>
                            </div>
                        </th>
                        <th className="w-36 p-4 border-b-2 border-gray-200 dark:border-gray-600 font-semibold text-sm uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                                <Activity size={16} />
                                <span>Action</span>
                            </div>
                        </th>
                        <th className="w-64 p-4 border-b-2 border-gray-200 dark:border-gray-600 font-semibold text-sm uppercase tracking-wider">Description</th>
                        <th className="w-24 p-4 border-b-2 border-gray-200 dark:border-gray-600 font-semibold text-sm uppercase tracking-wider">Entity</th>
                        <th className="w-48 p-4 border-b-2 border-gray-200 dark:border-gray-600 font-semibold text-sm uppercase tracking-wider">Details</th>
                        <th className="w-32 p-4 border-b-2 border-gray-200 dark:border-gray-600 font-semibold text-sm uppercase tracking-wider">IP Address</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y-2 divide-gray-200 dark:divide-gray-600">
                    {logsToDisplay.map((log) => {
                        const actionStyle = getActionTypeStyle(log.action_type);
                        const ActionIcon = actionStyle.icon;
                        const EntityIcon = getEntityIcon(log.entity_type || '');
                        
                        return (
                            <React.Fragment key={log.id}>
                            <tr
                                className={clsx(
                                    'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-200 hover:shadow-sm',
                                    selectedAuditLogId === log.id 
                                        ? 'bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-600 shadow-md' 
                                        : 'hover:border-l-2 hover:border-blue-300 dark:hover:border-blue-500'
                                )}
                                onClick={() => handleRowClick(log.id)}
                            >
                                {/* Time Column */}
                                <td className="p-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {format(new Date(log.timestamp), 'MMM d, yyyy')}
                                        </span>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                                        </span>
                                    </div>
                                </td>

                                {/* User Column */}
                                <td className="p-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                                            <User size={14} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {log.username || 'System'}
                                            </span>
                                            {log.user_id && (
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 font-mono">
                                                    {log.user_id.substring(0, 8)}...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Action Type Column */}
                                <td className="p-3">
                                    <div className={clsx(
                                        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border',
                                        actionStyle.bg,
                                        actionStyle.text,
                                        actionStyle.border
                                    )}>
                                        <ActionIcon size={14} className="mr-1.5" />
                                        {log.action_type.replace(/_/g, ' ')}
                                    </div>
                                </td>

                                {/* Description Column */}
                                <td className="p-3">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={log.description}>
                                        {log.description || 'N/A'}
                                    </p>
                                </td>

                                {/* Entity Type Column */}
                                <td className="p-3">
                                    {log.entity_type ? (
                                        <div className="flex items-center space-x-2">
                                            <EntityIcon size={16} className="text-gray-500 dark:text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {log.entity_type}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                                    )}
                                </td>

                                {/* Details Column */}
                                <td className="p-3 relative">
                                    {log.details ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-600 dark:text-gray-300 truncate font-mono">
                                                    {JSON.stringify(log.details).substring(0, 30)}...
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyDetails(log.details, log.id);
                                                }}
                                                className={clsx(
                                                    'p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                                    copiedId === log.id 
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-400'
                                                )}
                                                title={copiedId === log.id ? 'Copied!' : 'Copy details to clipboard'}
                                            >
                                                {copiedId === log.id ? (
                                                    <CheckCircle size={16} />
                                                ) : (
                                                    <CopyIcon size={16} />
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                                    )}
                                </td>

                                {/* IP Address Column */}
                                <td className="p-3">
                                    <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-600 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-500">
                                        {log.ip_address || 'N/A'}
                                    </span>
                                </td>
                            </tr>
                            
                            {/* Expanded Details Row */}
                            {selectedAuditLogId === log.id && (
                                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-l-4 border-blue-600 shadow-lg">
                                    <td colSpan={7} className="p-6">
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-6 flex items-center">
                                                <Activity className="mr-2" size={20} />
                                                Audit Log Details
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                                        <label className="text-sm font-semibold text-blue-700 dark:text-blue-300">Log ID:</label>
                                                        <p className="text-sm font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded mt-1 border">{log.id}</p>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID:</label>
                                                        <p className="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">{log.user_id || 'N/A'}</p>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Entity ID:</label>
                                                        <p className="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">{log.entity_id || 'N/A'}</p>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Resource:</label>
                                                        <p className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                                            {log.resource_type || 'N/A'} {log.resource_id && `(${log.resource_id})`}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">User Agent:</label>
                                                        <p className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
                                                            {log.user_agent || 'N/A'}
                                                        </p>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Description:</label>
                                                        <p className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                                            {log.description || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {log.details && (
                                                <div className="mt-4">
                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Details:</label>
                                                    <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded mt-2 overflow-x-auto">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-end mt-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onRowClick) onRowClick(log.id);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    Close Details
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
            </div>
        </div>
    );
};

export default AuditLogsTable;
