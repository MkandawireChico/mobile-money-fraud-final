// client/src/pages/UsersPage.tsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import clsx from 'clsx'; // Utility for conditionally joining class names

// Import Lucide React icons for a modern and consistent look
// Make sure you have 'lucide-react' installed: npm install lucide-react
import {
    Filter as FilterIcon,
    Search as SearchIcon,
    RefreshCw as RefreshIcon, // Renamed from Refresh
    UserPlus as GroupAddIcon, // For "Add User"
    Users as PeopleIcon, // For "User Management" header
    CheckCircle as CheckCircleIcon,
    AlertCircle as ErrorOutlineIcon, // Using AlertCircle for error and warning messages
    Info as InfoIcon,
    AlertTriangle as WarningIcon,
    X as CloseIcon, // Generic close icon for snackbar and dialogs
    Loader2, // For loading spinner
    ChevronLeft, // For pagination
    ChevronRight, // For pagination
    ChevronDown, // For select dropdowns
} from 'lucide-react';

import api from '../api/axios.ts';
import UsersTable from '../components/users/UsersTable.tsx'; // Assumed to be Tailwind-ready or converted
import UserFilter from '../components/users/UserFilter.tsx'; // Assumed to be Tailwind-ready or converted
import UserForm from '../components/users/UserForm.tsx'; // Assumed to be Tailwind-ready or converted
import { AuthContext } from '../context/AuthContext.tsx';

import { User as UserType } from '../types/index';

// Removed useStyles as all styling is handled by Tailwind CSS classes

const UsersPage: React.FC = () => {
    const history = useHistory();
    const authContext = useContext(AuthContext);
    const { user: currentUser, isAuthenticated, isLoading } = authContext;

    console.log('[UsersPage] Render - AuthContext State - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'User:', currentUser);

    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterMenuOpen, setFilterMenuOpen] = useState<boolean>(false); // State for filter menu visibility
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null); // Anchor for filter menu
    const [filters, setFilters] = useState<any>({
        role: null,
        status: null,
    });
    const [activeFilters, setActiveFilters] = useState<{ key: string; label: string; value: any }[]>([]);

    const [openUserFormDialog, setOpenUserFormDialog] = useState<boolean>(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [selectedUser, setSelectedUser] = useState<UserType | undefined>(undefined);

    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

    const [openResetPasswordConfirm, setOpenResetPasswordConfirm] = useState<boolean>(false);
    const [userToResetPassword, setUserToResetPassword] = useState<UserType | null>(null);

    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [totalUsers, setTotalUsers] = useState<number>(0);

    // Snackbar states for user feedback
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

    /**
     * Shows a snackbar notification.
     * @param message The message to display.
     * @param severity The severity of the notification ('success', 'error', 'info', 'warning').
     */
    const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    }, []);

    /**
     * Fetches users from the backend API based on current filters, search query, and pagination.
     * This function is memoized using `useCallback` to prevent unnecessary re-creations.
     */
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null); // Clear any previous errors
        try {
            const params = new URLSearchParams();
            if (filters.role) params.append('role', filters.role);
            if (filters.status) params.append('status', filters.status);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());

            params.append('limit', rowsPerPage.toString());
            params.append('offset', (page * rowsPerPage).toString());

            console.log(`[UsersPage] Fetching users with params: ${params.toString()}`);

            const response = await api.get<{ users: UserType[]; totalCount: number }>(`/users?${params.toString()}`);
            console.log("[UsersPage] Raw API Response:", response.data);

            const fetchedUsers = response.data?.users || [];
            const fetchedTotalCount = response.data?.totalCount || 0;

            setUsers(fetchedUsers);
            setTotalUsers(fetchedTotalCount);

            console.log(`[UsersPage] Fetched ${fetchedUsers.length} users. Total count: ${fetchedTotalCount}`);

        } catch (err: any) {
            console.error('[UsersPage] Error fetching users:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to fetch users.');
            setUsers([]);
            setTotalUsers(0);
            showSnackbar(err.response?.data?.message || 'Failed to fetch users.', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery, page, rowsPerPage, showSnackbar]);

    // Effect hook for initial data fetch when auth state is ready
    useEffect(() => {
        console.log('[UsersPage] useEffect Triggered - AuthContext State - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'User:', currentUser);

        if (!isLoading) {
            // Only fetch users if authenticated and authorized (admin or analyst)
            if (isAuthenticated && (currentUser?.role === 'admin' || currentUser?.role === 'analyst')) {
                console.log('[UsersPage] User is authenticated and authorized to view users. Attempting to fetch users...');
                fetchUsers();
            } else {
                console.log('[UsersPage] User is NOT authorized for Users page. Setting error. Role:', currentUser?.role, 'IsAuthenticated:', isAuthenticated);
                setError('Access Denied: You must be an administrator or analyst to view users.');
                setLoading(false); // Stop loading if unauthorized
                setUsers([]); // Clear users if unauthorized
                setTotalUsers(0);
            }
        } else {
            console.log('[UsersPage] AuthContext still loading. Waiting...');
        }
    }, [isAuthenticated, isLoading, currentUser, fetchUsers]); // ADDED 'currentUser' to dependency array

    // Effect hook to update active filters displayed as chips
    useEffect(() => {
        const newActiveFilters: { key: string; label: string; value: any }[] = [];

        if (filters.role) {
            newActiveFilters.push({
                key: 'role',
                label: `Role: ${filters.role}`,
                value: filters.role
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
    }, [filters]); // Dependency on filters state

    // Event handlers for UI interactions
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission behavior
        setPage(0); // Reset to first page on new search
        // fetchUsers will be triggered by useEffect due to searchQuery change
    };

    const handleFilterOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFilterAnchorEl(event.currentTarget);
        setFilterMenuOpen(true);
    };
    const handleFilterClose = () => {
        setFilterMenuOpen(false);
        setFilterAnchorEl(null);
    };

    const handleFilterApply = (newFilters: any) => {
        setFilters({ ...filters, ...newFilters });
        setPage(0); // Reset to first page when filters change
        handleFilterClose();
        // fetchUsers will be triggered by useEffect due to filters change
    };

    const handleFilterRemove = (key: string) => {
        setFilters((prevFilters: any) => ({
            ...prevFilters,
            [key]: null, // Set the specific filter back to null
        }));
        setPage(0); // Reset to first page
        // fetchUsers will be triggered by useEffect due to filters change
    };

    const handleClearAllFilters = () => {
        setFilters({ // Reset all filters to their initial null state
            role: null,
            status: null,
        });
        setSearchQuery(''); // Clear search query
        setPage(0); // Reset to first page
        // fetchUsers will be triggered by useEffect due to filters/searchQuery change
    };

    const handleCreateUserClick = () => {
        if (currentUser?.role !== 'admin') {
            showSnackbar('Permission Denied: Only administrators can add users.', 'error');
            return;
        }
        setFormMode('create');
        setSelectedUser(undefined); // Clear any previously selected user
        setOpenUserFormDialog(true);
    };

    const handleEditUserClick = (user: UserType) => {
        if (currentUser?.role !== 'admin') {
            showSnackbar('Permission Denied: Only administrators can edit users.', 'error');
            return;
        }
        setFormMode('edit');
        setSelectedUser(user);
        setOpenUserFormDialog(true);
    };

    const handleUserFormClose = () => {
        setOpenUserFormDialog(false);
        setSelectedUser(undefined); // Clear selected user after closing form
    };

    const handleUserFormSuccess = () => {
        fetchUsers(); // Re-fetch users to reflect changes (new user or updated user)
        handleUserFormClose();
        showSnackbar('User operation successful!', 'success');
    };

    const handleDeleteUser = (user: UserType) => {
        if (currentUser?.role !== 'admin') {
            showSnackbar('Permission Denied: Only administrators can delete users.', 'error');
            return;
        }
        setUserToDelete(user);
        setOpenDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete || currentUser?.role !== 'admin') {
            showSnackbar('Permission Denied: You do not have access to delete users.', 'error');
            setOpenDeleteConfirm(false);
            return;
        }
        try {
            setLoading(true); // Indicate loading during deletion
            await api.delete(`/users/${userToDelete.id}`);
            fetchUsers(); // Re-fetch users after deletion
            console.log(`User ${userToDelete.id} deleted successfully.`);
            showSnackbar('User deleted successfully!', 'success');
        } catch (error: any) {
            console.error('Error deleting user:', error.response?.data?.message || error.message);
            setError(error.response?.data?.message || 'Failed to delete user.');
            showSnackbar(error.response?.data?.message || 'Failed to delete user.', 'error');
        } finally {
            setOpenDeleteConfirm(false); // Close delete confirmation dialog
            setUserToDelete(null); // Clear user to delete
            setLoading(false); // Stop loading
        }
    };

    const handleToggleUserStatus = async (userId: string, currentStatus: UserType['status']) => {
        if (currentUser?.role !== 'admin') {
            showSnackbar('Permission Denied: Only administrators can toggle user status.', 'error');
            return;
        }
        try {
            setLoading(true); // Indicate loading during status toggle
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active'; // Toggle status
            await api.patch(`/users/${userId}/status`, { status: newStatus });
            fetchUsers(); // Re-fetch users to reflect status change
            console.log(`User ${userId} status changed to ${newStatus}.`);
            showSnackbar(`User status changed to ${newStatus}!`, 'success');
        } catch (error: any) {
            console.error('Error toggling user status:', error.response?.data?.message || error.message);
            setError(error.response?.data?.message || 'Failed to toggle user status.');
            showSnackbar(error.response?.data?.message || 'Failed to toggle user status.', 'error');
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const handleResetPassword = (userId: string) => {
        if (currentUser?.role !== 'admin') {
            showSnackbar('Permission Denied: Only administrators can reset passwords.', 'error');
            return;
        }
        const user = users.find(u => u.id === userId);
        if (user) {
            setUserToResetPassword(user);
            setOpenResetPasswordConfirm(true);
        }
    };

    const handleConfirmResetPassword = async () => {
        if (!userToResetPassword || currentUser?.role !== 'admin') {
            showSnackbar('Permission Denied: You do not have access to reset passwords.', 'error');
            setOpenResetPasswordConfirm(false);
            return;
        }
        try {
            setLoading(true); // Indicate loading during password reset
            await api.post(`/users/${userToResetPassword.id}/reset-password`, {}); // API call to reset password
            console.log(`Password for user ${userToResetPassword.id} reset successfully.`);
            showSnackbar('Password reset successfully! (A temporary password would typically be emailed).', 'success');
        } catch (error: any) {
            console.error('Error resetting password:', error.response?.data?.message || error.message);
            setError(error.response?.data?.message || 'Failed to reset password.');
            showSnackbar(error.response?.data?.message || 'Failed to reset password.', 'error');
        } finally {
            setOpenResetPasswordConfirm(false); // Close reset password dialog
            setUserToResetPassword(null); // Clear user for password reset
            setLoading(false); // Stop loading
        }
    };

    // Navigates to user details page
    const handleUserRowClick = (userId: string) => {
        console.log(`Navigating to user details for ID: ${userId}`);
        history.push(`/users/${userId}`);
    };

    // Pagination handlers
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

    // --- Conditional Rendering for Loading, Error, and Empty states ---

    // Corrected mixed operators for clarity
    if (isLoading || (loading && !error)) { // Show loading spinner while auth is loading or data is being fetched (and no prior error)
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center justify-center">
                    <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
                    <p className="text-xl text-gray-700 dark:text-gray-300">Loading user data...</p>
                </div>
            </div>
        );
    }

    if (error) { // Show error message if an error occurred during fetch or due to unauthorized access
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold flex items-center">
                    <ErrorOutlineIcon size={24} className="mr-3" /> Error: {error}
                </div>
            </div>
        );
    }

    if (!loading && users.length === 0 && !error) { // Show "No users found" if not loading, no users, and no error
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-gray-600 dark:text-gray-400 text-lg font-semibold flex items-center">
                    <InfoIcon size={24} className="mr-3" /> No users found matching your criteria.
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Main Content Area (Header, Search, Filters) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200 dark:border-gray-700">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <PeopleIcon size={32} className="mr-4 text-blue-600 dark:text-blue-400" />
                        User Management
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
                        {/* Search Field */}
                        <form onSubmit={handleSearchSubmit} className="flex-grow sm:flex-grow-0 min-w-[200px] sm:min-w-[300px]">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                    <SearchIcon size={20} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search users (username, email)..."
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
                                    <UserFilter
                                        currentFilters={filters}
                                        onApply={handleFilterApply}
                                        onClose={handleFilterClose}
                                    />
                                </div>
                            )}
                        </div>
                        {/* Add User Button (Admin only) */}
                        {currentUser?.role === 'admin' && (
                            <button
                                onClick={handleCreateUserClick}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                <GroupAddIcon size={18} className="mr-2" /> Add User
                            </button>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={fetchUsers}
                            disabled={loading || isLoading}
                            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 dark:text-blue-400 dark:hover:bg-blue-900 disabled:opacity-50"
                            aria-label="Refresh users"
                        >
                            <RefreshIcon size={24} className={clsx({ 'animate-spin': loading || isLoading })} />
                        </button>
                    </div>
                </div>

                {/* Display active filters as chips */}
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

            {/* Users Table and Pagination */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200 dark:border-gray-700">
                <UsersTable
                    users={users}
                    loading={loading}
                    currentUserId={currentUser?.id}
                    onEdit={handleEditUserClick}
                    onDelete={handleDeleteUser}
                    onToggleStatus={handleToggleUserStatus}
                    onResetPassword={handleResetPassword}
                    onRefresh={fetchUsers}
                    canManageUsers={currentUser?.role === 'admin'}
                    onRowClick={handleUserRowClick}
                />

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
                        {totalUsers > 0 ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, totalUsers)} of ${totalUsers}` : `0-0 of 0`}
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
                            disabled={(page + 1) * rowsPerPage >= totalUsers}
                            className="p-2 rounded-full text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            aria-label="Next page"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* User Form Dialog (Custom Modal) */}
            {openUserFormDialog && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm sm:max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {formMode === 'create' ? 'Create New User' : 'Edit User'}
                            </h2>
                            <button
                                onClick={handleUserFormClose}
                                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                                aria-label="Close dialog"
                            >
                                <CloseIcon size={20} />
                            </button>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                            <UserForm
                                mode={formMode}
                                user={
                                    selectedUser
                                        ? {
                                              ...selectedUser,
                                              // Ensure name is always a string, falling back to username if name is null/undefined
                                              name: typeof selectedUser.name === 'string' ? selectedUser.name : selectedUser.username,
                                              lastLogin: selectedUser.last_login ?? undefined,
                                              status: selectedUser.status === 'inactive' ? undefined : selectedUser.status,
                                          }
                                        : undefined
                                }
                                onSuccess={handleUserFormSuccess}
                                onCancel={handleUserFormClose}
                            />
                        </div>
                    </div>
                </div>
            )}


            {/* Delete Confirmation Dialog (Custom Modal) */}
            {openDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Delete User</h2>
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
                                Are you sure you want to delete user "
                                <span className="font-semibold">{userToDelete?.username || userToDelete?.email || 'N/A'}</span>"?
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

            {/* Reset Password Confirmation Dialog (Custom Modal) */}
            {openResetPasswordConfirm && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Password Reset</h2>
                            <button
                                onClick={() => setOpenResetPasswordConfirm(false)}
                                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                                aria-label="Close dialog"
                            >
                                <CloseIcon size={20} />
                            </button>
                        </div>
                        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
                            <p className="text-gray-700 dark:text-gray-300">
                                Are you sure you want to reset the password for user "
                                <span className="font-semibold">{userToResetPassword?.username || userToResetPassword?.email || 'N/A'}</span>"?
                                A new temporary password would typically be generated and sent to their email.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setOpenResetPasswordConfirm(false)}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmResetPassword}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
                            >
                                Reset Password
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
                    {snackbarSeverity === 'success' && <CheckCircleIcon size={20} />}
                    {snackbarSeverity === 'error' && <ErrorOutlineIcon size={20} />}
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
export default UsersPage;
