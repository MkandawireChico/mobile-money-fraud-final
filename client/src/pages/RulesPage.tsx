// client/src/pages/RulesPage.tsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import clsx from 'clsx'; // Utility for conditionally joining class names

// Import Lucide React icons for a modern and consistent look
// Make sure you have 'lucide-react' installed: npm install lucide-react
import {
    Filter as FilterIcon,
    Search as SearchIcon,
    RefreshCw as RefreshIcon,
    Plus as PlusIcon,
    ShieldCheck as PolicyIcon, // Using ShieldCheck as a strong icon for rules
    CheckCircle as CheckIcon,
    AlertCircle as ErrorIcon,
    Info as InfoIcon,
    AlertTriangle as WarningIcon,
    X as CloseIcon, // Generic close icon
    Loader2, // For loading spinner
    ChevronLeft, // For pagination
    ChevronRight, // For pagination
    ChevronDown, // For select dropdowns
} from 'lucide-react';

import api from '../api/axios.ts';
import RulesTable from '../components/rules/RulesTable.tsx'; // Assumed to be Tailwind-ready or converted
import RuleFilter from '../components/rules/RuleFilter.tsx'; // Assumed to be Tailwind-ready or converted
import { Rule } from '../types/index';
import { AuthContext } from '../context/AuthContext.tsx';

// Removed useStyles as all styling is handled by Tailwind CSS classes

const RulesPage: React.FC = () => {
    const history = useHistory();
    const authContext = useContext(AuthContext);
    const { user: currentUser, isAuthenticated, isLoading: authLoading } = authContext; // Renamed isLoading to authLoading

    console.log('[RulesPage] Auth State - isAuthenticated:', isAuthenticated, 'isLoading:', authLoading, 'User:', currentUser);

    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState<boolean>(true); // Loading state for rules data
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false); // State for filter menu visibility
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null); // Anchor for filter menu
    const [filters, setFilters] = useState<any>({
        rule_type: null,
        severity: null,
        status: null,
    });
    const [activeFilters, setActiveFilters] = useState<{ key: string; label: string; value: any }[]>([]);

    // State for Delete Confirmation dialog
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);
    const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);

    // Snackbar for feedback
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

    // Pagination states
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [totalRules, setTotalRules] = useState<number>(0);

    // Fetches rules from the API with current filters, search query, and pagination
    const fetchRules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.rule_type) params.append('rule_type', filters.rule_type);
            if (filters.severity) params.append('severity', filters.severity);
            if (filters.status) params.append('status', filters.status);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());

            params.append('limit', rowsPerPage.toString());
            params.append('offset', (page * rowsPerPage).toString());

            console.log(`[RulesPage] Fetching rules with params: ${params.toString()}`);

            const response = await api.get<{ rules: Rule[]; totalCount: number }>(`/rules?${params.toString()}`); // Specify response type
            console.log("[RulesPage] Raw API Response:", response.data);

            const fetchedRules = response.data?.rules || [];
            const fetchedTotalCount = response.data?.totalCount || 0;

            setRules(fetchedRules);
            setTotalRules(fetchedTotalCount);

            console.log(`[RulesPage] Fetched ${fetchedRules.length} rules. Total count: ${fetchedTotalCount}`);

        } catch (err: any) {
            console.error('[RulesPage] Error fetching rules:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to fetch rules.');
            setRules([]);
            setTotalRules(0);
            setSnackbarMessage(err.response?.data?.message || 'Failed to fetch rules.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery, page, rowsPerPage]); // Dependencies for useCallback

    // Effect hook for initial data fetch and role-based access control
    useEffect(() => {
        if (!authLoading) { // Ensure authentication state has been determined
            const allowedRoles = ['admin', 'analyst'];
            if (isAuthenticated && currentUser?.role && allowedRoles.includes(currentUser.role)) {
                console.log(`[RulesPage] User (${currentUser.role}) is authorized. Attempting to fetch rules...`);
                fetchRules(); // Fetch rules if authorized
            } else {
                console.log(`[RulesPage] User (${currentUser?.role || 'N/A'}) is NOT authorized for Rules page. Setting error.`);
                setError('Access Denied: You must be an administrator or analyst to view rules.');
                setLoading(false); // Stop loading if access is denied
                setRules([]);
                setTotalRules(0);
                setSnackbarMessage('Access Denied: You are not authorized to view rules.');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
        } else {
            console.log('[RulesPage] AuthContext still loading. Waiting...');
        }
    }, [isAuthenticated, authLoading, currentUser?.role, fetchRules]); // Dependencies for effect

    // Effect hook to update active filters display when filters state changes
    useEffect(() => {
        const newActiveFilters: { key: string; label: string; value: any }[] = [];

        if (filters.rule_type) {
            newActiveFilters.push({
                key: 'rule_type',
                label: `Type: ${filters.rule_type}`,
                value: filters.rule_type
            });
        }
        if (filters.severity) {
            newActiveFilters.push({
                key: 'severity',
                label: `Severity: ${filters.severity}`,
                value: filters.severity
            });
        }
        if (filters.status) {
            newActiveFilters.push({
                key: 'status',
                label: `Status: ${filters.status}`,
                value: filters.status
            });
        }
        setActiveFilters(newActiveFilters);
    }, [filters]);

    // Handles changes in the search input field
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Handles search form submission, resets page to 0, and re-fetches rules
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0); // Reset to first page on new search
        fetchRules();
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

    // Applies new filters, resets page to 0, closes the filter menu, and re-fetches rules
    const handleFilterApply = (newFilters: any) => {
        setFilters((prevFilters: any) => ({ ...prevFilters, ...newFilters }));
        setPage(0); // Reset to first page on new filters
        handleFilterClose();
        // fetchRules will be triggered by useEffect due to filters change
    };

    // Removes a specific filter by key, resets page to 0, and re-fetches rules
    const handleFilterRemove = (key: string) => {
        setFilters((prevFilters: any) => ({
            ...prevFilters,
            [key]: null,
        }));
        setPage(0); // Reset to first page
        // fetchRules will be triggered by useEffect due to filters change
    };

    // Clears all active filters and search query, resets page to 0, and re-fetches rules
    const handleClearAllFilters = () => {
        setFilters({
            rule_type: null,
            severity: null,
            status: null,
        });
        setSearchQuery('');
        setPage(0); // Reset to first page
        // fetchRules will be triggered by useEffect due to filters/searchQuery change
    };

    // Navigates to the rule creation page
    const handleCreateRuleClick = () => {
        console.log('[RulesPage] Navigating to /rules/create to add a new rule.');
        history.push('/rules/create');
    };

    // Navigates to the rule editing page
    const handleEditRuleClick = (rule: Rule) => {
        console.log('[RulesPage] Navigating to /rules/edit to edit rule ID:', rule.id);
        history.push(`/rules/edit/${rule.id}`);
    };

    // Sets the rule to be deleted and opens the confirmation dialog
    const handleDeleteRule = (rule: Rule) => {
        setRuleToDelete(rule);
        setOpenDeleteConfirm(true);
    };

    // Confirms and executes the rule deletion
    const handleConfirmDelete = async () => {
        if (!ruleToDelete) return; // Should not happen if dialog is opened correctly
        try {
            setLoading(true); // Indicate loading during deletion
            await api.delete(`/rules/${ruleToDelete.id}`);
            setSnackbarMessage('Rule deleted successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setPage(0); // Reset to first page after deletion
            fetchRules(); // Re-fetch rules to update the list
        } catch (err: any) {
            console.error('Error deleting rule:', err.response?.data?.message || err.message);
            setSnackbarMessage(`Failed to delete rule: ${err.response?.data?.message || err.message}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setOpenDeleteConfirm(false); // Close dialog
            setRuleToDelete(null); // Clear rule to delete
            setLoading(false); // Stop loading
        }
    };

    // Toggles the status of a rule (active/inactive)
    const handleToggleRuleStatus = async (ruleId: string, currentStatus: Rule['status']) => {
        try {
            setLoading(true); // Indicate loading during status toggle
            let newStatus: Rule['status'];
            if (currentStatus === 'active') {
                newStatus = 'inactive';
            } else { // currentStatus is 'inactive' or potentially 'draft', default to active
                newStatus = 'active';
            }
            await api.patch(`/rules/${ruleId}/status`, { status: newStatus });
            setSnackbarMessage(`Rule status changed to ${newStatus}!`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            fetchRules(); // Re-fetch rules to update the list with new status
        } catch (err: any) {
            console.error('[RulesPage] Error toggling rule status:', err.response?.data?.message || err.message);
            setSnackbarMessage(`Failed to toggle rule status: ${err.response?.data?.message || err.message}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    // Pagination Handlers
    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when rows per page changes
    };

    // Handles closing the Snackbar notification
    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    // Helper to determine if the current user can manage (create, edit, delete, toggle status) rules
    const canManageRules = isAuthenticated && currentUser?.role === 'admin';
    console.log('[RulesPage] Can manage rules (for button visibility):', canManageRules);

    // --- Conditional Rendering for Loading, Error, and Empty States ---

    // Show loading spinner when auth is loading OR rule data is loading (and no rules are yet loaded)
    if ((authLoading || loading) && rules.length === 0 && !error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400" />
                <p className="ml-5 text-xl text-gray-700 dark:text-gray-300">Loading rules...</p>
            </div>
        );
    }

    // Show error message if an error occurred during fetching or due to access control
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold flex items-center">
                    <ErrorIcon size={24} className="mr-3" /> Error: {error}
                </div>
            </div>
        );
    }

    // Show "No rules found" message if no rules are available after loading and no error
    if (!loading && rules.length === 0 && !error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center flex flex-col items-center">
                    <p className="text-xl text-gray-500 dark:text-gray-400 mb-6">No rules found matching your criteria.</p>
                    {canManageRules && (
                        <button
                            onClick={handleCreateRuleClick}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                        >
                            <PlusIcon size={20} className="mr-2" /> Add First Rule
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // --- Main Component Render ---
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Main Content Area (Header, Search, Filters) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200 dark:border-gray-700">
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-4 mb-4">
                    {/* Title */}
                    <div className="flex items-center flex-shrink-0">
                        <PolicyIcon size={32} className="mr-4 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Rule Engine
                        </h1>
                    </div>

                    {/* Actions Container (Search, Filter, Add, Refresh) */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
                        {/* Search Field */}
                        <form onSubmit={handleSearchSubmit} className="flex-grow sm:flex-grow-0 min-w-[200px] sm:min-w-[250px]">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                    <SearchIcon size={20} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search rules (name, description)..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                />
                            </div>
                        </form>

                        {/* Filter Button */}
                        <div className="relative">
                            <button
                                onClick={handleFilterOpen}
                                className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                                aria-haspopup="true"
                                aria-expanded={filterMenuOpen ? 'true' : 'false'}
                            >
                                <FilterIcon size={18} className="mr-2" /> Filters
                            </button>
                            {/* Filter Menu (Custom Dropdown) */}
                            {filterMenuOpen && (
                                <div
                                    ref={(node) => {
                                        // Position the filter menu below the button
                                        if (node && filterAnchorEl) {
                                            const rect = filterAnchorEl.getBoundingClientRect();
                                            node.style.top = `${rect.bottom + 8}px`;
                                            node.style.left = `${rect.left}px`;
                                            node.style.position = 'fixed'; // Use fixed positioning for dropdown
                                        }
                                    }}
                                    className="absolute left-0 mt-2 w-72 origin-top-left rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20 dark:bg-gray-800"
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="filters-button"
                                >
                                    <RuleFilter
                                        currentFilters={filters}
                                        onApply={handleFilterApply}
                                        onClose={handleFilterClose}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Add Rule Button (Admin only) */}
                        {canManageRules && (
                            <button
                                onClick={handleCreateRuleClick}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
                            >
                                <PlusIcon size={18} className="mr-2" /> Add Rule
                            </button>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={fetchRules}
                            disabled={loading}
                            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 dark:text-blue-400 dark:hover:bg-blue-900 disabled:opacity-50"
                            aria-label="Refresh rules"
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
                                    <CloseIcon size={12} />
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

            {/* Rules Table and Pagination */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200 dark:border-gray-700">
                <RulesTable
                    rules={rules}
                    loading={loading}
                    canManageRules={canManageRules}
                    onEdit={handleEditRuleClick}
                    onDelete={handleDeleteRule}
                    onToggleStatus={handleToggleRuleStatus}
                    onRefresh={fetchRules}
                />
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
                                {[10, 25, 50, 100].map((option) => (
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
                        {totalRules > 0 ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, totalRules)} of ${totalRules}` : `0-0 of 0`}
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
                            disabled={(page + 1) * rowsPerPage >= totalRules}
                            className="p-2 rounded-full text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            aria-label="Next page"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog (Custom Modal) */}
            {openDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Delete Rule</h2>
                            <button
                                onClick={() => setOpenDeleteConfirm(false)}
                                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                                aria-label="Close dialog"
                            >
                                <CloseIcon size={20} />
                            </button>
                        </div>
                        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
                            <p className="text-gray-700 dark:text-gray-300">
                                Are you sure you want to delete rule "<span className="font-semibold">{ruleToDelete?.rule_name}</span>"?
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setOpenDeleteConfirm(false)}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Snackbar for feedback */}
            {snackbarOpen && (
                <div
                    className={clsx(
                        "fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-xl flex items-center space-x-3 z-50 transition-all duration-300",
                        {
                            'bg-green-500 text-white': snackbarSeverity === 'success',
                            'bg-red-500 text-white': snackbarSeverity === 'error',
                            'bg-blue-500 text-white': snackbarSeverity === 'info',
                            'bg-yellow-500 text-white': snackbarSeverity === 'warning',
                        }
                    )}
                    role="alert"
                >
                    {snackbarSeverity === 'success' && <CheckIcon size={20} />}
                    {snackbarSeverity === 'error' && <ErrorIcon size={20} />}
                    {snackbarSeverity === 'info' && <InfoIcon size={20} />}
                    {snackbarSeverity === 'warning' && <WarningIcon size={20} />}
                    <p className="text-sm font-medium">{snackbarMessage}</p>
                    <button
                        onClick={handleSnackbarClose}
                        className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
                        aria-label="Close notification"
                    >
                        <CloseIcon size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default RulesPage;
