// client/src/components/rules/RulesTable.tsx
import React, { useState } from 'react';
import { Rule } from '../../types/index.ts';
import clsx from 'clsx';

const formatCriteria = (criteria: any) => {
    try {
        return JSON.stringify(criteria, null, 2);
    } catch (e) {
        return String(criteria);
    }
};

interface RulesTableProps {
    rules: Rule[];
    loading: boolean;
    canManageRules: boolean;
    onEdit: (rule: Rule) => void;
    onDelete: (rule: Rule) => void;
    onToggleStatus: (ruleId: string, currentStatus: Rule['status']) => void;
    onRefresh: () => void;
}

const RulesTable: React.FC<RulesTableProps> = ({ rules, loading, canManageRules, onEdit, onDelete, onToggleStatus, onRefresh }) => {
    const [sortAsc, setSortAsc] = useState<boolean>(false);

    const getStatusChipClass = (status: Rule['status']) => {
        switch (status) {
            case 'active':
                return 'bg-green-200 text-green-800';
            case 'inactive':
                return 'bg-yellow-200 text-yellow-800';
            case 'draft':
                return 'bg-blue-200 text-blue-800';
            default:
                return '';
        }
    };

    const getSeverityChipClass = (severity: Rule['severity']) => {
        switch (severity) {
            case 'low':
                return 'bg-blue-200 text-blue-800';
            case 'medium':
                return 'bg-yellow-200 text-yellow-800';
            case 'high':
                return 'bg-red-200 text-red-800';
            case 'critical':
                return 'bg-red-500 text-white';
            default:
                return '';
        }
    };

    const sortedRules = [...rules].sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return sortAsc ? dateA - dateB : dateB - dateA;
    });

    if (loading) {
        return (
            <div className="p-3 bg-white rounded-lg shadow-md mb-3">
                <div className="flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
                    <p className="ml-4 text-gray-600">Loading rules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 bg-white rounded-lg shadow-md mb-3">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] border-collapse">
                    <thead className="bg-blue-100">
                        <tr>
                            <th className="p-2 text-left text-blue-900 font-bold cursor-pointer" onClick={() => setSortAsc(!sortAsc)}>
                                Rule Name<span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                            </th>
                            <th className="p-2 text-left text-blue-900 font-bold">Description</th>
                            <th className="p-2 text-left text-blue-900 font-bold">Criteria</th>
                            <th className="p-2 text-left text-blue-900 font-bold">Rule Type</th>
                            <th className="p-2 text-left text-blue-900 font-bold">Severity</th>
                            <th className="p-2 text-center text-blue-900 font-bold">Status</th>
                            <th className="p-2 text-left text-blue-900 font-bold">Created At</th>
                            <th className="p-2 text-left text-blue-900 font-bold">Updated At</th>
                            {canManageRules && (
                                <th className="p-2 text-center text-blue-900 font-bold">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRules.length === 0 ? (
                            <tr>
                                <td colSpan={canManageRules ? 9 : 8} className="p-4 text-center text-gray-500">
                                    <p className="text-lg">No rules found matching your criteria.</p>
                                    <p className="text-sm">Try adjusting your search or filters.</p>
                                    <button
                                        onClick={onRefresh}
                                        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Refresh Rules
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            sortedRules.map(rule => (
                                <tr key={rule.id} className="border-b">
                                    <td className="p-2"><span className="max-w-[150px] block truncate">{rule.rule_name}</span></td>
                                    <td className="p-2"><span className="max-w-[200px] block truncate">{rule.description || 'N/A'}</span></td>
                                    <td className="p-2"><span className="max-w-[180px] block truncate">{formatCriteria(rule.criteria)}</span></td>
                                    <td className="p-2">{rule.rule_type}</td>
                                    <td className="p-2">
                                        <span
                                            className={clsx('inline-block px-2 py-1 rounded text-xs font-bold', getSeverityChipClass(rule.severity))}
                                        >
                                            {rule.severity}
                                        </span>
                                    </td>
                                    <td className="p-2 text-center">
                                        <span
                                            className={clsx('inline-block px-2 py-1 rounded text-xs font-bold', getStatusChipClass(rule.status))}
                                        >
                                            {rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="p-2">{new Date(rule.created_at).toLocaleString()}</td>
                                    <td className="p-2">{new Date(rule.updated_at).toLocaleString()}</td>
                                    {canManageRules && (
                                        <td className="p-2 text-center">
                                            <button
                                                onClick={() => onEdit(rule)}
                                                className="text-blue-600 hover:text-blue-800 mr-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onToggleStatus(rule.id, rule.status)}
                                                className="text-blue-600 hover:text-blue-800 mr-2"
                                            >
                                                {rule.status === 'active' ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => onDelete(rule)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 text-sm text-gray-600">Total Rules: {sortedRules.length}</p>
        </div>
    );
};

export default RulesTable;