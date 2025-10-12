// client/src/components/auditLogs/AuditLogFilter.tsx
import React, { useState, useEffect } from 'react';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';
import { 
    Calendar, 
    Filter, 
    X, 
    Download, 
    RefreshCw,
    ChevronDown,
    Activity,
    User,
    Database
} from 'lucide-react';

interface AuditLogFilterProps {
    currentFilters: {
        actionType: string | null;
        resourceType: string | null;
        userId: string | null;
        dateRange: [Date | null, Date | null] | null;
    };
    onApply: (filters: any) => void;
    onClose: () => void;
}

const AuditLogFilter: React.FC<AuditLogFilterProps> = ({ currentFilters, onApply, onClose }) => {
    const [actionType, setActionType] = useState<string | null>(currentFilters.actionType);
    const [resourceType, setResourceType] = useState<string | null>(currentFilters.resourceType);
    const [userId, setUserId] = useState<string | null>(currentFilters.userId);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        currentFilters.dateRange?.[0] || null,
        currentFilters.dateRange?.[1] || null,
    ]);
    const [showDateRangePicker, setShowDateRangePicker] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setActionType(currentFilters.actionType);
        setResourceType(currentFilters.resourceType);
        setUserId(currentFilters.userId);
        setDateRange([currentFilters.dateRange?.[0] || null, currentFilters.dateRange?.[1] || null]);
    }, [currentFilters]);

    const handleApply = () => {
        if (dateRange[0] && dateRange[1] && dateRange[0] > dateRange[1]) {
            setError('Start date cannot be later than end date.');
            return;
        }
        setError(null);
        onApply({
            actionType,
            resourceType,
            userId,
            dateRange,
        });
        onClose();
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear all filters?')) {
            setActionType(null);
            setResourceType(null);
            setUserId(null);
            setDateRange([null, null]);
            onApply({
                actionType: null,
                resourceType: null,
                userId: null,
                dateRange: null,
            });
            onClose();
        }
    };

    const handleDateRangeChange = (item: any) => {
        setDateRange([item.selection.startDate, item.selection.endDate]);
    };

    const handleExportLogs = () => {
        const queryParams = new URLSearchParams({
            actionType: actionType || '',
            resourceType: resourceType || '',
            userId: userId || '',
            startDate: dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : '',
            endDate: dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : '',
        }).toString();
        window.open(`/api/auditlogs/export?${queryParams}`, '_blank');
    };

    return (
        <div className="min-w-[500px] max-w-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header - Enhanced */}
            <div className="flex items-center justify-between p-6 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Filter className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Filter Audit Logs</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Refine your search criteria</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            {/* Action Type Filter */}
            <div className="mb-6">
                <label htmlFor="actionType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-500" />
                    Action Type
                </label>
                <div className="relative">
                    <select
                        id="actionType"
                        value={actionType || ''}
                        onChange={(e) => setActionType(e.target.value as string)}
                        className="w-full p-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                    >
                        <option value="">All Actions</option>
                        <option value="USER_LOGIN">User Login</option>
                        <option value="USER_LOGOUT">User Logout</option>
                        <option value="USER_CREATED">User Created</option>
                        <option value="USER_UPDATED">User Updated</option>
                        <option value="USER_DELETED">User Deleted</option>
                        <option value="TRANSACTION_CREATED">Transaction Created</option>
                        <option value="TRANSACTION_FRAUD_PREDICTED">Fraud Prediction</option>
                        <option value="TRANSACTION_FRAUD_PREDICTION_FAILED">Prediction Failed</option>
                        <option value="ANOMALY_CREATED">Anomaly Created</option>
                        <option value="SETTING_UPDATED">Setting Updated</option>
                        <option value="REPORT_GENERATED">Report Generated</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
            </div>

            {/* Resource Type Filter */}
            <div className="mb-6">
                <label htmlFor="resourceType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Database className="w-4 h-4 mr-2 text-blue-500" />
                    Entity Type
                </label>
                <div className="relative">
                    <select
                        id="resourceType"
                        value={resourceType || ''}
                        onChange={(e) => setResourceType(e.target.value as string)}
                        className="w-full p-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                    >
                        <option value="">All Entities</option>
                        <option value="User">User</option>
                        <option value="Transaction">Transaction</option>
                        <option value="Anomaly">Anomaly</option>
                        <option value="Setting">Setting</option>
                        <option value="Report">Report</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
            </div>

            {/* User ID Filter */}
            <div className="mb-6">
                <label htmlFor="userId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-500" />
                    User ID
                </label>
                <input
                    id="userId"
                    type="text"
                    value={userId || ''}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID or username..."
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                />
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    Date Range
                </label>
                <div className="relative">
                    <div
                        className="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 cursor-pointer hover:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                        onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                    >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            {dateRange[0] && dateRange[1] 
                                ? `${format(dateRange[0], 'MMM d, yyyy')} - ${format(dateRange[1], 'MMM d, yyyy')}`
                                : 'Select date range...'
                            }
                        </span>
                        <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    
                    {showDateRangePicker && (
                        <div className="absolute z-20 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                            <DateRangePicker
                                ranges={[
                                    {
                                        startDate: dateRange[0] || new Date(),
                                        endDate: dateRange[1] || new Date(),
                                        key: 'selection',
                                    },
                                ]}
                                onChange={handleDateRangeChange}
                                className="dark:bg-gray-800"
                            />
                            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                                <button
                                    type="button"
                                    onClick={() => setShowDateRangePicker(false)}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Apply Date Range
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center">
                        <X className="w-4 h-4 mr-1" />
                        {error}
                    </p>
                )}
            </div>
            </div>

            {/* Action Buttons - Enhanced */}
            <div className="p-6 pt-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-t border-gray-200 dark:border-gray-600 sticky bottom-0">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleClear}
                        className="flex items-center px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-sm hover:shadow-md transform hover:scale-105"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear All
                    </button>
                    <button
                        onClick={handleExportLogs}
                        className="flex items-center px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogFilter;