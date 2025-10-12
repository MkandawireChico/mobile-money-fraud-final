// client/src/components/anomalies/AnomalyFilter.tsx
import React, { useState, useEffect } from 'react';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { format } from 'date-fns';
import { ChevronDown, CalendarDays, X as CloseIcon } from 'lucide-react'; // Import Lucide icons

interface AnomalyFilterOptions {
    status: string | null;
    severity: string | null;
    rule_name: string | null;
    algorithm: string | null;
    minRiskScore: number | null;
    maxRiskScore: number | null;
    dateRange: [Date | null, Date | null] | null;
}

interface AnomalyFilterProps {
    currentFilters: AnomalyFilterOptions;
    onApply: (filters: AnomalyFilterOptions) => void;
    onClose: () => void;
}

const AnomalyFilter: React.FC<AnomalyFilterProps> = ({ currentFilters, onApply, onClose }) => {
    const [filters, setFilters] = useState<AnomalyFilterOptions>(currentFilters);
    const [showDateRangePicker, setShowDateRangePicker] = useState<boolean>(false);

    // Common options for filter dropdowns
    const statusOptions = ['open', 'investigating', 'resolved', 'false_positive'];
    const severityOptions = ['low', 'medium', 'high', 'critical'];
    const algorithmOptions = [
        'isolation_forest',
        'one_class_svm',
        'local_outlier_factor',
        'elliptic_envelope'
    ];
    // In a real app, rule names would be fetched from the backend
    const ruleNameOptions = [
        'Synthetic_High_Risk_Transaction',
        'Synthetic_Fraud_Flag',
        'LargeAmountTransfer',
        'FrequentSmallTransfers',
        'NewDeviceLogin',
        'GeographicalAnomaly'
    ];

    useEffect(() => {
        setFilters(currentFilters);
    }, [currentFilters]);

    const handleApplyFilters = () => {
        onApply(filters);
        onClose();
    };

    const handleClearFilters = () => {
        // As per instructions, avoid using window.confirm/alert.
        // A custom modal/dialog should be used here if confirmation is needed.
        setFilters({
            status: null,
            severity: null,
            rule_name: null,
            algorithm: null,
            minRiskScore: null,
            maxRiskScore: null,
            dateRange: null,
        });
        // Apply immediately after clearing
        onApply({
            status: null,
            severity: null,
            rule_name: null,
            algorithm: null,
            minRiskScore: null,
            maxRiskScore: null,
            dateRange: null,
        });
        onClose();
    };

    const handleFilterChange = (key: keyof AnomalyFilterOptions, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleDateRangeChange = (item: any) => {
        setFilters({
            ...filters,
            dateRange: [item.selection.startDate, item.selection.endDate],
        });
    };

    const selectionRange = {
        startDate: filters.dateRange?.[0] || new Date(),
        endDate: filters.dateRange?.[1] || new Date(),
        key: 'selection',
    };

    return (
        <div className="p-5 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-gray-900 dark:text-gray-100 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-5 border-b pb-3 border-gray-200 dark:border-gray-700">Filter Anomalies</h2>

            {/* Status Filter */}
            <div className="mb-4">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                </label>
                <div className="relative">
                    <select
                        id="status-filter"
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value || null)}
                        className="block w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                    >
                        <option value="">Any</option>
                        {statusOptions.map(status => (
                            <option key={status} value={status}>
                                {status.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Severity Filter */}
            <div className="mb-4">
                <label htmlFor="severity-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Severity
                </label>
                <div className="relative">
                    <select
                        id="severity-filter"
                        value={filters.severity || ''}
                        onChange={(e) => handleFilterChange('severity', e.target.value || null)}
                        className="block w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                    >
                        <option value="">Any</option>
                        {severityOptions.map(severity => (
                            <option key={severity} value={severity}>
                                {severity}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Rule Name Filter */}
            <div className="mb-4">
                <label htmlFor="rule-name-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rule Name
                </label>
                <div className="relative">
                    <select
                        id="rule-name-filter"
                        value={filters.rule_name || ''}
                        onChange={(e) => handleFilterChange('rule_name', e.target.value || null)}
                        className="block w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                    >
                        <option value="">Any</option>
                        {ruleNameOptions.map(rule => (
                            <option key={rule} value={rule}>
                                {rule.replace(/([A-Z])/g, ' $1').trim()}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Algorithm Filter */}
            <div className="mb-4">
                <label htmlFor="algorithm-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Algorithm
                </label>
                <div className="relative">
                    <select
                        id="algorithm-filter"
                        value={filters.algorithm || ''}
                        onChange={(e) => handleFilterChange('algorithm', e.target.value || null)}
                        className="block w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                    >
                        <option value="">Any</option>
                        {algorithmOptions.map(algorithm => (
                            <option key={algorithm} value={algorithm}>
                                {algorithm.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Risk Score Filter */}
            <div className="mb-4">
                <label htmlFor="risk-score-min" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Risk Score Range (0-1)
                </label>
                <div className="flex space-x-2">
                    <input
                        id="risk-score-min"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="Min"
                        value={filters.minRiskScore === null ? '' : filters.minRiskScore}
                        onChange={(e) => handleFilterChange('minRiskScore', e.target.value === '' ? null : parseFloat(e.target.value))}
                        className="w-1/2 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        id="risk-score-max"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="Max"
                        value={filters.maxRiskScore === null ? '' : filters.maxRiskScore}
                        onChange={(e) => handleFilterChange('maxRiskScore', e.target.value === '' ? null : parseFloat(e.target.value))}
                        className="w-1/2 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
                <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</h3>
                <div className="relative">
                    <button
                        onClick={() => setShowDateRangePicker(prev => !prev)}
                        className="flex items-center justify-between w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <span className="text-sm">
                            {filters.dateRange?.[0] && filters.dateRange?.[1]
                                ? `${format(filters.dateRange[0], 'MMM dd, yyyy')} - ${format(filters.dateRange[1], 'MMM dd, yyyy')}`
                                : 'Select Date Range'}
                        </span>
                        <CalendarDays size={18} className="text-gray-500 dark:text-gray-400" />
                    </button>
                    {showDateRangePicker && (
                        <div className="absolute left-0 mt-2 z-20 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-3 border border-gray-200 dark:border-gray-700">
                            <DateRangePicker
                                ranges={[selectionRange]}
                                onChange={handleDateRangeChange}
                                showSelectionPreview={true}
                                moveRangeOnFirstSelection={false}
                                direction="vertical"
                                className="rdr-theme-default"
                                rangeColors={['#3B82F6']} // Tailwind blue-500
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDateRangePicker(false)}
                                    className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-3 mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleClearFilters}
                    className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                >
                    Clear All
                </button>
                <button
                    onClick={handleApplyFilters}
                    className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                    Apply Filters
                </button>
            </div>
            
            {/* Close Button at top-right for convenience */}
            <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close filter menu"
            >
                <CloseIcon size={20} />
            </button>
        </div>
    );
};

export default AnomalyFilter;
