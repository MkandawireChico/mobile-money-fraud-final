// client// src/pages/AuditLogsPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import clsx from 'clsx'; // Utility for conditionally joining class names
import { format } from 'date-fns';

// Import Lucide React icons for a modern and consistent look
// Make sure you have 'lucide-react' installed: npm install lucide-react
import {
    Filter as FilterIcon,
    Search as SearchIcon,
    RefreshCw as RefreshIcon,
    ScrollText as HistoryIcon, // Using ScrollText as a modern equivalent for history/logs
    Loader2, // For loading spinner
    ChevronLeft, // For pagination
    ChevronRight, // For pagination
    ChevronDown, // For select dropdowns
    XCircle, // For clearing filters
} from 'lucide-react';

import api from '../api/axios.ts'; // Assuming your axios instance is correctly configured
import AuditLogsTable from '../components/auditLogs/AuditLogsTable.tsx'; // Assumed to be Tailwind-ready or converted
import AuditLogFilter from '../components/auditLogs/AuditLogFilter.tsx'; // Assumed to be Tailwind-ready or converted

import { AuditLog } from '../types/index'; // Assuming AuditLog type is defined here

const AuditLogsPage: React.FC = () => {
    const history = useHistory();

    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false); // State for filter menu visibility
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null); // Anchor for filter menu
    const filterDropdownRef = useRef<HTMLDivElement>(null); // Ref for filter dropdown
    const filterButtonRef = useRef<HTMLButtonElement>(null); // Ref for filter button
    const [filters, setFilters] = useState<any>({
        userId: null,
        actionType: null,
        entityType: null,
        dateRange: null,
    });
    const [activeFilters, setActiveFilters] = useState<{ key: string; label: string; value: any }[]>([]);

    // Pagination states
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [totalAuditLogs, setTotalAuditLogs] = useState<number>(0);

    // Fetches audit logs from the API with current filters, search query, and pagination
    const fetchAuditLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();

            if (filters.userId) params.append('user_id', filters.userId);
            if (filters.actionType) params.append('action_type', filters.actionType);
            if (filters.entityType) params.append('entity_type', filters.entityType);
            if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
                params.append('start_date', filters.dateRange[0].toISOString());
                params.append('end_date', filters.dateRange[1].toISOString());
            }
            // Only append search if it's not an empty string
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            // Append pagination parameters
            params.append('limit', rowsPerPage.toString());
            params.append('offset', (page * rowsPerPage).toString());

            console.log(`[AuditLogsPage] Fetching with params: ${params.toString()}`);

            const response = await api.get<{ auditLogs: AuditLog[]; totalCount: number }>(`/audit-logs?${params.toString()}`); // Specify response type
            console.log("[AuditLogsPage] Raw API Response:", response.data);

            const fetchedAuditLogs = response.data?.auditLogs || [];
            const fetchedTotalCount = response.data?.totalCount || 0;

            setAuditLogs(fetchedAuditLogs);
            setTotalAuditLogs(fetchedTotalCount);

            console.log(`[AuditLogsPage] Fetched ${fetchedAuditLogs.length} audit logs. Total count: ${fetchedTotalCount}`);

        } catch (err: any) {
            console.error('[AuditLogsPage] Error fetching audit logs:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to fetch audit logs.');
            setAuditLogs([]);
            setTotalAuditLogs(0);
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery, page, rowsPerPage]);

    // Effect to fetch audit logs on component mount and when dependencies change
    useEffect(() => {
        fetchAuditLogs();
    }, [fetchAuditLogs]);

    // Effect to handle click outside filter dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isClickInsideDropdown = filterDropdownRef.current?.contains(target);
            const isClickInsideButton = filterButtonRef.current?.contains(target);
            
            if (!isClickInsideDropdown && !isClickInsideButton) {
                setFilterMenuOpen(false);
                setFilterAnchorEl(null);
            }
        };

        if (filterMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [filterMenuOpen]);

    // Effect to update active filters display when filters state changes
    useEffect(() => {
        const newActiveFilters: { key: string; label: string; value: any }[] = [];

        if (filters.userId) {
            newActiveFilters.push({
                key: 'userId',
                label: `User ID: ${filters.userId.substring(0, 8)}...`, // Display truncated ID
                value: filters.userId
            });
        }
        if (filters.actionType) {
            newActiveFilters.push({
                key: 'actionType',
                label: `Action: ${filters.actionType.replace(/_/g, ' ')}`, // Format "action_type"
                value: filters.actionType
            });
        }
        if (filters.entityType) {
            newActiveFilters.push({
                key: 'entityType',
                label: `Entity: ${filters.entityType}`,
                value: filters.entityType
            });
        }
        if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
            newActiveFilters.push({
                key: 'dateRange',
                label: `Date: ${format(filters.dateRange[0], 'MMM d')} - ${format(filters.dateRange[1], 'MMM d')}`,
                value: filters.dateRange
            });
        }
        setActiveFilters(newActiveFilters);
    }, [filters]);

    // Handles changes in the search input field
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Handles search form submission, resets page to 0 and re-fetches audit logs
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0); // Reset to first page on new search
        // fetchAuditLogs(); // useEffect dependency will trigger fetch
    };

    // Opens the filter menu
    const handleFilterOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFilterAnchorEl(event.currentTarget);
        setFilterMenuOpen(true);
    };

    // Closes the filter menu
    const handleFilterClose = () => {
        setFilterMenuOpen(false);
        setFilterAnchorEl(null);
    };

    // Applies new filters, resets page to 0, and closes the filter menu
    const handleFilterApply = (newFilters: any) => {
        setFilters((prevFilters: any) => ({ ...prevFilters, ...newFilters }));
        setPage(0); // Reset to first page on new filters
        handleFilterClose();
    };

    // Removes a specific filter by key
    const handleFilterRemove = (key: string) => {
        setFilters((prevFilters: any) => ({
            ...prevFilters,
            [key]: null, // Set the specific filter value to null
        }));
        setPage(0); // Reset to first page
    };

    // Clears all active filters and search query, resets page, and re-fetches audit logs
    const handleClearAllFilters = () => {
        setFilters({
            userId: null,
            actionType: null,
            entityType: null,
            dateRange: null,
        });
        setSearchQuery('');
        setPage(0); // Reset to first page
    };

    // Handles clicking on an audit log row, shows details in expanded view
    const [selectedAuditLogId, setSelectedAuditLogId] = useState<string | null>(null);
    
    const handleRowClick = (auditLogId: string) => {
        console.log(`Clicked audit log ID: ${auditLogId}`);
        // Toggle selection - if same log clicked, deselect it
        setSelectedAuditLogId(selectedAuditLogId === auditLogId ? null : auditLogId);
    };

    // Pagination Handlers
    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when rows per page changes
    };

    // --- Conditional Rendering for Loading and Error states ---
    if (loading && auditLogs.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <Loader2 size={48} className="animate-spin text-blue-500" />
                <p className="ml-4 text-gray-700 dark:text-gray-300 text-xl">Loading audit logs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold">
                    Error: {error}
                </div>
            </div>
        );
    }

    // --- Main Component Render ---
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Main Content Card/Paper */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200 dark:border-gray-700">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <HistoryIcon size={32} className="mr-3 text-blue-600 dark:text-blue-400" />
                        Audit Logs
                    </h1>

                    {/* Search, Filter, Refresh Actions */}
                    <div className="flex flex-wrap items-center space-x-2 sm:space-x-3">
                        {/* Search Field */}
                        <form onSubmit={handleSearchSubmit} className="flex-grow sm:flex-grow-0 min-w-[200px] sm:min-w-[280px]">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                    <SearchIcon size={20} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search logs (Description, Details, IP)..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                />
                            </div>
                        </form>

                        {/* Filter Button */}
                        <div className="relative">
                            <button
                                ref={filterButtonRef}
                                onClick={handleFilterOpen}
                                className={`flex items-center px-4 py-2 rounded-md focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    activeFilters.length > 0 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md' 
                                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                                }`}
                                aria-haspopup="true"
                                aria-expanded={filterMenuOpen ? 'true' : 'false'}
                            >
                                <FilterIcon size={18} className="mr-2" /> 
                                Filters
                                {activeFilters.length > 0 && (
                                    <span className="ml-2 bg-white bg-opacity-20 text-xs px-2 py-0.5 rounded-full">
                                        {activeFilters.length}
                                    </span>
                                )}
                            </button>
                            {/* Filter Menu (Custom Dropdown) */}
                            {filterMenuOpen && (
                                <div
                                    ref={(node) => {
                                        // Set both refs - one for positioning, one for click-outside detection
                                        if (filterDropdownRef.current !== node) {
                                            (filterDropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
                                        }
                                        if (node && filterAnchorEl) {
                                            const rect = filterAnchorEl.getBoundingClientRect();
                                            const viewportWidth = window.innerWidth;
                                            const dropdownWidth = 600; // Match the filter component width
                                            
                                            // Position below the button
                                            node.style.top = `${rect.bottom + 8}px`;
                                            
                                            // Smart horizontal positioning to prevent overflow
                                            if (rect.left + dropdownWidth > viewportWidth) {
                                                // Position from the right edge if it would overflow
                                                node.style.right = `${viewportWidth - rect.right}px`;
                                                node.style.left = 'auto';
                                            } else {
                                                node.style.left = `${rect.left}px`;
                                                node.style.right = 'auto';
                                            }
                                            
                                            node.style.position = 'fixed'; // Use fixed positioning for dropdown
                                        }
                                    }}
                                    className="absolute mt-2 origin-top-right rounded-lg shadow-2xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 backdrop-blur-sm"
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="filters-button"
                                >
                                    <AuditLogFilter
                                        currentFilters={filters}
                                        onApply={handleFilterApply}
                                        onClose={handleFilterClose}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchAuditLogs}
                            disabled={loading}
                            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 dark:text-blue-400 dark:hover:bg-blue-900 disabled:opacity-50"
                            aria-label="Refresh audit logs"
                        >
                            <RefreshIcon size={24} className={clsx({ 'animate-spin': loading })} />
                        </button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap items-center mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Active Filters:</span>
                        {activeFilters.map(filter => (
                            <span
                                key={filter.key}
                                className="flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2 mb-1 dark:bg-blue-900 dark:text-blue-100"
                            >
                                {filter.label}
                                <button
                                    onClick={() => handleFilterRemove(filter.key)}
                                    className="ml-1 p-0.5 rounded-full hover:bg-blue-200 hover:text-blue-900 dark:hover:bg-blue-800 dark:hover:text-blue-50"
                                    aria-label={`Remove filter: ${filter.label}`}
                                >
                                    <XCircle size={12} />
                                </button>
                            </span>
                        ))}
                        {activeFilters.length > 0 && (
                            <button
                                onClick={handleClearAllFilters}
                                className="text-blue-600 dark:text-blue-400 text-sm hover:underline ml-2 mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Audit Logs Table and Pagination */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6 border border-gray-200 dark:border-gray-700 min-h-[60vh]">
                {/* Audit Logs Table */}
                <AuditLogsTable
                    auditLogs={auditLogs}
                    loading={loading}
                    onRowClick={handleRowClick}
                    selectedAuditLogId={selectedAuditLogId}
                />

                {/* No logs found message */}
                {!loading && auditLogs.length === 0 && !error && (
                    <div className="flex justify-center p-8 text-gray-500 dark:text-gray-400">
                        <p>No audit logs found matching your criteria.</p>
                    </div>
                )}

                {/* Custom Table Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-wrap">
                    {/* Rows per page selector */}
                    <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <span>Rows per page:</span>
                        <div className="relative">
                            <select
                                value={rowsPerPage}
                                onChange={handleChangeRowsPerPage}
                                className="block appearance-none w-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 py-1.5 px-3 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {[10, 25, 50, 100, 200, 500].map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Pagination status text */}
                    <span className="text-sm text-gray-700 dark:text-gray-300 my-2 sm:my-0">
                        {totalAuditLogs > 0 ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, totalAuditLogs)} of ${totalAuditLogs}` : `0-0 of 0`}
                    </span>

                    {/* Pagination buttons */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={(e) => handleChangePage(e, page - 1)}
                            disabled={page === 0}
                            className="p-2 rounded-full text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={(e) => handleChangePage(e, page + 1)}
                            disabled={(page + 1) * rowsPerPage >= totalAuditLogs}
                            className="p-2 rounded-full text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            aria-label="Next page"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogsPage;
