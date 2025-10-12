// client/src/pages/UserDetailsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';

// Import Lucide React icons for a modern and consistent look
import {
    ArrowLeft as ArrowBackIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    X as CancelIcon, // Using X for cancel
    Trash2 as DeleteIcon, // Using Trash2 for delete
    User as PersonIcon,
    KeyRound as LockResetIcon, // Using KeyRound for password reset
    CheckCircle as CheckCircleIcon,
    AlertCircle, // Explicitly import AlertCircle
    Info as InfoIcon,
    AlertTriangle as WarningIcon,
    X as CloseIcon, // Generic close icon for snackbar and dialogs
    Loader2, // For loading spinner
    ChevronDown, // For select dropdowns
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx'; // Utility for conditionally joining class names

import api from '../api/axios.ts';
import { User } from '../types/index';
import { useAuth } from '../context/AuthContext.tsx';

const UserDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Get user ID from URL params
    const history = useHistory();
    const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth(); // Auth context for current user info

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Loading state for user data fetch
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false); // Toggles edit mode

    // States for editable fields
    const [editedUsername, setEditedUsername] = useState<string>('');
    const [editedEmail, setEditedEmail] = useState<string>('');
    const [editedRole, setEditedRole] = useState<User['role']>('viewer');
    const [editedStatus, setEditedStatus] = useState<User['status']>('active');

    // Snackbar states for user feedback
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

    // Dialog states for confirmation/actions
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState<boolean>(false);
    const [newPassword, setNewPassword] = useState<string>(''); // For reset password dialog

    // Permissions based on current user's role
    const canEditUsers = isAuthenticated && currentUser?.role === 'admin';
    const canDeleteUsers = isAuthenticated && currentUser?.role === 'admin';
    const canResetPassword = isAuthenticated && currentUser?.role === 'admin';

    // Fetches user details from the API
    const fetchUserDetails = useCallback(async () => {
        setLoading(true); // Start loading for user data
        setError(null); // Clear any previous errors
        try {
            console.log(`[UserDetailsPage] Fetching user details for ID: ${id}`);
            const response = await api.get<User>(`/users/${id}`); // Specify User type for response
            console.log("[UserDetailsPage] Raw API Response:", response.data);
            const fetchedUser: User = response.data;
            setUser(fetchedUser); // Set the fetched user data

            // Initialize editable states with fetched user data
            setEditedUsername(fetchedUser.username);
            setEditedEmail(fetchedUser.email);
            setEditedRole(fetchedUser.role);
            setEditedStatus(fetchedUser.status);

        } catch (err: any) {
            console.error(`[UserDetailsPage] Error fetching user details for ID ${id}:`, err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to fetch user details.');
        } finally {
            setLoading(false); // Stop loading
        }
    }, [id]); // Dependency on 'id' to re-fetch if URL parameter changes

    // Effect hook for initial data fetch when auth state is ready
    useEffect(() => {
        if (!authLoading) { // Ensure authentication state has been determined
            fetchUserDetails();
        }
    }, [fetchUserDetails, authLoading]); // Re-fetch when fetchUserDetails changes or auth state changes

    // Navigates back to the users list page
    const handleBack = () => {
        history.push('/users');
    };

    // Toggles between view and edit mode, reverting changes if canceling edit
    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        // If exiting edit mode (and it was previously editing) and user data exists, revert changes
        if (isEditing && user) {
            setEditedUsername(user.username);
            setEditedEmail(user.email);
            setEditedRole(user.role);
            setEditedStatus(user.status);
        }
    };

    // Handles updating user details via API
    const handleUpdateUserDetails = async () => {
        // Permission check
        if (!user || !canEditUsers) {
            setSnackbarMessage('Permission Denied: You do not have access to edit user details.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        setLoading(true); // Start loading
        try {
            const updateData: Partial<User> = {
                username: editedUsername,
                email: editedEmail,
                role: editedRole,
                status: editedStatus,
            };

            console.log(`[UserDetailsPage] Updating user ${id} with data:`, updateData);
            const response = await api.put<{ user: User }>(`/users/${id}`, updateData); // Specify response type
            const updatedUser: User = response.data.user;
            setUser(updatedUser); // Update local user state
            setIsEditing(false); // Exit edit mode
            setSnackbarMessage('User details updated successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (err: any) {
            console.error(`[UserDetailsPage] Error updating user ${id}:`, err.response?.data?.message || err.message);
            setSnackbarMessage(err.response?.data?.message || 'Failed to update user details.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    // Opens the delete confirmation dialog
    const handleDeleteConfirmOpen = () => {
        setDeleteDialogOpen(true);
    };

    // Closes the delete confirmation dialog
    const handleDeleteConfirmClose = () => {
        setDeleteDialogOpen(false);
    };

    // Executes user deletion via API
    const handleDelete = async () => {
        // Permission check
        if (!user || !canDeleteUsers) {
            setSnackbarMessage('Permission Denied: You do not have access to delete users.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            handleDeleteConfirmClose(); // Close dialog immediately if no permission
            return;
        }

        setLoading(true); // Start loading
        try {
            console.log(`[UserDetailsPage] Deleting user with ID: ${id}`);
            await api.delete(`/users/${id}`);
            setSnackbarMessage('User deleted successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            history.push('/users'); // Navigate back to users list after successful deletion
        } catch (err: any) {
            console.error(`[UserDetailsPage] Error deleting user ${id}:`, err.response?.data?.message || err.message);
            setSnackbarMessage(err.response?.data?.message || 'Failed to delete user.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false); // Stop loading
            handleDeleteConfirmClose(); // Close dialog
        }
    };

    // Opens the reset password dialog
    const handleResetPasswordOpen = () => {
        setNewPassword(''); // Clear previous password input
        setResetPasswordDialogOpen(true);
    };

    // Closes the reset password dialog
    const handleResetPasswordClose = () => {
        setResetPasswordDialogOpen(false);
    };

    // Executes password reset via API
    const handleResetPassword = async () => {
        // Permission check
        if (!user || !canResetPassword) {
            setSnackbarMessage('Permission Denied: You do not have access to reset passwords.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            handleResetPasswordClose();
            return;
        }
        // Input validation
        if (!newPassword.trim()) {
            setSnackbarMessage('New password cannot be empty.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }

        setLoading(true); // Start loading
        try {
            console.log(`[UserDetailsPage] Resetting password for user ID: ${id}`);
            await api.post(`/users/${id}/reset-password`, { newPassword });
            setSnackbarMessage('Password reset successfully! (A temporary password would typically be emailed).');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            handleResetPasswordClose(); // Close dialog
        } catch (err: any) {
            console.error(`[UserDetailsPage] Error resetting password for user ${id}:`, err.response?.data?.message || err.message);
            setSnackbarMessage(err.response?.data?.message || 'Failed to reset password.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    // Handles closing the Snackbar notification
    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    // Helper to get Tailwind classes for user status chip
    const getStatusChipClasses = (status: User['status']) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
            case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    // Helper to get Tailwind classes for user role chip
    const getRoleChipClasses = (role: User['role']) => {
        switch (role) {
            case 'admin': return 'bg-blue-600 text-white dark:bg-blue-800';
            case 'analyst': return 'bg-indigo-500 text-white dark:bg-indigo-700';
            case 'viewer': return 'bg-gray-500 text-white dark:bg-gray-700';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    // --- Conditional Rendering for Loading, Error, and Not Found states ---

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center justify-center">
                    <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
                    <p className="text-xl text-gray-700 dark:text-gray-300">Loading user details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold flex items-center">
                    <AlertCircle size={24} className="mr-3" /> Error: {error}
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-gray-600 dark:text-gray-400 text-lg font-semibold flex items-center">
                    <AlertCircle size={24} className="mr-3" /> User not found.
                </div>
            </div>
        );
    }

    // --- Main Component Render ---
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Main Content Area (Header and Details) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-6 border border-gray-200 dark:border-gray-700">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center">
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 mr-4"
                        >
                            <ArrowBackIcon size={20} className="mr-2" /> Back to Users
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <PersonIcon size={32} className="mr-4 text-blue-600 dark:text-blue-400" />
                            User Details: <span className="text-blue-600 dark:text-blue-400 ml-2">{user.username}</span>
                        </h1>
                    </div>
                    {/* Action Buttons (Edit, Save, Cancel, Reset Password, Delete) */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
                        {canEditUsers && (
                            isEditing ? (
                                <>
                                    <button
                                        onClick={handleUpdateUserDetails}
                                        disabled={loading}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
                                    >
                                        <SaveIcon size={18} className="mr-2" /> Save Changes
                                    </button>
                                    <button
                                        onClick={handleEditToggle}
                                        disabled={loading}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
                                    >
                                        <CancelIcon size={18} className="mr-2" /> Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleEditToggle}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                    >
                                        <EditIcon size={18} className="mr-2" /> Edit
                                    </button>
                                    {canResetPassword && (
                                        <button
                                            onClick={handleResetPasswordOpen}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                        >
                                            <LockResetIcon size={18} className="mr-2" /> Reset Password
                                        </button>
                                    )}
                                    {canDeleteUsers && (
                                        <button
                                            onClick={handleDeleteConfirmOpen}
                                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                                        >
                                            <DeleteIcon size={18} className="mr-2" /> Delete
                                        </button>
                                    )}
                                </>
                            )
                        )}
                    </div>
                </div>

                {/* User Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information Section */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                            <InfoIcon size={20} className="mr-2 text-blue-500" /> Basic Information
                        </h2>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">User ID:</span> {user.id}
                            </p>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="username-input" className="font-semibold text-gray-800 dark:text-gray-200 mr-2 block mb-1">Username:</label>
                            {isEditing ? (
                                <input
                                    id="username-input"
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                    value={editedUsername}
                                    onChange={(e) => setEditedUsername(e.target.value)}
                                    disabled={loading}
                                />
                            ) : (
                                <p className="text-gray-700 dark:text-gray-300">{user.username}</p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email-input" className="font-semibold text-gray-800 dark:text-gray-200 mr-2 block mb-1">Email:</label>
                            {isEditing ? (
                                <input
                                    id="email-input"
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                    value={editedEmail}
                                    onChange={(e) => setEditedEmail(e.target.value)}
                                    disabled={loading}
                                />
                            ) : (
                                <p className="text-gray-700 dark:text-gray-300">{user.email}</p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label htmlFor="role-select" className="font-semibold text-gray-800 dark:text-gray-200 mr-2 block mb-1">Role:</label>
                            {isEditing ? (
                                <div className="relative">
                                    <select
                                        id="role-select"
                                        value={editedRole}
                                        onChange={(e) => setEditedRole(e.target.value as User['role'])}
                                        disabled={loading}
                                        className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="analyst">Analyst</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            ) : (
                                <span className={clsx("inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium", getRoleChipClasses(user.role))}>
                                    {user.role.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="mb-4">
                            <label htmlFor="status-select" className="font-semibold text-gray-800 dark:text-gray-200 mr-2 block mb-1">Status:</label>
                            {isEditing ? (
                                <div className="relative">
                                    <select
                                        id="status-select"
                                        value={editedStatus}
                                        onChange={(e) => setEditedStatus(e.target.value as User['status'])}
                                        disabled={loading}
                                        className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            ) : (
                                <span className={clsx("inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium", getStatusChipClasses(user.status))}>
                                    {user.status.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Audit Information Section */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                            <InfoIcon size={20} className="mr-2 text-blue-500" /> Audit Information
                        </h2>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Created At:</span> {user.created_at ? format(parseISO(user.created_at), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Updated At:</span> {user.updated_at ? format(parseISO(user.updated_at), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                            </p>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-base">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">Last Login:</span> {user.last_login ? format(parseISO(user.last_login), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog (Custom Modal) */}
            {deleteDialogOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Delete User</h2>
                            <button
                                onClick={handleDeleteConfirmClose}
                                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                                aria-label="Close dialog"
                            >
                                <CloseIcon size={20} />
                            </button>
                        </div>
                        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
                            <p className="text-gray-700 dark:text-gray-300">
                                Are you sure you want to delete user "<span className="font-semibold">{user.username}</span>"?
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleDeleteConfirmClose}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Dialog (Custom Modal) */}
            {resetPasswordDialogOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reset Password for {user.username}</h2>
                            <button
                                onClick={handleResetPasswordClose}
                                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                                aria-label="Close dialog"
                            >
                                <CloseIcon size={20} />
                            </button>
                        </div>
                        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
                            <label htmlFor="new-password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                            <input
                                id="new-password-input"
                                type="password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={loading}
                                autoFocus
                            />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Note: In a real application, a temporary password would typically be emailed to the user, and they would be prompted to change it on next login.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleResetPasswordClose}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResetPassword}
                                disabled={loading || !newPassword.trim()}
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
                    {snackbarSeverity === 'error' && <AlertCircle size={20} />}
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

export default UserDetailsPage;
