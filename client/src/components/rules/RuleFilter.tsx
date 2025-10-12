// client/src/components/rules/RuleFilter.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, 
  X, 
  RotateCcw, 
  CheckCircle, 
  DollarSign, 
  Zap, 
  Clock, 
  MapPin, 
  Users,
  AlertTriangle,
  AlertCircle,
  Shield,
  Eye
} from 'lucide-react';

interface RuleFilterProps {
    currentFilters: {
        rule_type: string | null;
        severity: string | null;
        status: string | null;
    };
    onApply: (filters: { rule_type: string | null; severity: string | null; status: string | null }) => void;
    onClose: () => void;
}

const RuleFilter: React.FC<RuleFilterProps> = ({ currentFilters, onApply, onClose }) => {
    const [filters, setFilters] = useState(currentFilters);
    const filterRef = useRef<HTMLDivElement>(null);

    // Enhanced rule types with icons and descriptions
    const ruleTypes = [
        { value: 'threshold', label: 'Amount Threshold', icon: DollarSign, color: 'text-green-600' },
        { value: 'velocity', label: 'Transaction Velocity', icon: Zap, color: 'text-yellow-600' },
        { value: 'temporal', label: 'Time-based Pattern', icon: Clock, color: 'text-blue-600' },
        { value: 'geographic', label: 'Location Risk', icon: MapPin, color: 'text-red-600' },
        { value: 'behavioral', label: 'User Behavior', icon: Users, color: 'text-purple-600' }
    ];
    
    const severities = [
        { value: 'low', label: 'Low', icon: Eye, color: 'text-gray-500' },
        { value: 'medium', label: 'Medium', icon: AlertCircle, color: 'text-yellow-500' },
        { value: 'high', label: 'High', icon: AlertTriangle, color: 'text-orange-500' },
        { value: 'critical', label: 'Critical', icon: Shield, color: 'text-red-500' }
    ];
    
    const statuses = [
        { value: 'active', label: 'Active', icon: CheckCircle, color: 'text-green-500' },
        { value: 'inactive', label: 'Inactive', icon: X, color: 'text-gray-500' },
        { value: 'draft', label: 'Draft', icon: Clock, color: 'text-blue-500' }
    ];

    useEffect(() => {
        setFilters(currentFilters);
    }, [currentFilters]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name as string]: value === '' ? null : value,
        }));
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear all filters?')) {
            const clearedFilters = {
                rule_type: null,
                severity: null,
                status: null,
            };
            setFilters(clearedFilters);
            onApply(clearedFilters);
            onClose();
        }
    };

    // Filter summary for user feedback
    const filterSummary = [
        filters.rule_type && `Rule Type: ${filters.rule_type.charAt(0).toUpperCase() + filters.rule_type.slice(1)}`,
        filters.severity && `Severity: ${filters.severity.charAt(0).toUpperCase() + filters.severity.slice(1)}`,
        filters.status && `Status: ${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}`,
    ].filter(Boolean).join(', ');

    return (
        <div 
            ref={filterRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 min-w-[320px] max-w-md max-h-[80vh] overflow-y-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Filter Rules
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
            </div>

            {/* Rule Type Filter */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Rule Type
                </label>
                <select
                    name="rule_type"
                    value={filters.rule_type || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">All Rule Types</option>
                    {ruleTypes.map(type => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Severity Filter */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Severity Level
                </label>
                <select
                    name="severity"
                    value={filters.severity || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">All Severity Levels</option>
                    {severities.map(severity => (
                        <option key={severity.value} value={severity.value}>
                            {severity.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Status Filter */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Status
                </label>
                <select
                    name="status"
                    value={filters.status || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                        <option key={status.value} value={status.value}>
                            {status.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Active Filters Summary */}
            {filterSummary && (
                <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                        Active Filters: {filterSummary}
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
                <button
                    onClick={handleClear}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                    <RotateCcw className="h-4 w-4" />
                    <span>Clear All</span>
                </button>
                <button
                    onClick={handleApply}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                    <CheckCircle className="h-4 w-4" />
                    <span>Apply Filters</span>
                </button>
            </div>
        </div>
    );
};

export default RuleFilter;