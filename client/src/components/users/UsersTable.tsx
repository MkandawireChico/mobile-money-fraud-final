// client/src/components/users/UsersTable.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx'; // Utility for conditionally joining class names

// Import Lucide React icons for a modern look, replacing Material-UI icons.
// Make sure to install lucide-react: `npm install lucide-react`
import {
    Edit as EditIcon,
    Trash2 as DeleteIcon,
    Lock as LockIcon,
    Unlock as UnlockIcon,
    KeyRound as ResetPasswordIcon,
    MoreVertical as MoreIcon,
    RefreshCw as RefreshIcon,
    Eye as VisibilityIcon,
} from 'lucide-react';

import { User as UserType } from '../../types/index.ts';

interface UsersTableProps {
    users: UserType[];
    loading: boolean;
    currentUserId?: string; // ID of the currently logged-in user, to disable actions on self
    onEdit: (user: UserType) => void;
    onDelete: (user: UserType) => void;
    onToggleStatus: (userId: string, currentStatus: UserType['status']) => void;
    onResetPassword: (userId: string) => void;
    onRefresh: () => void;
    canManageUsers: boolean; // Permission flag for managing users
    onRowClick: (userId: string) => void; // Callback for clicking a table row
}

const UsersTable: React.FC<UsersTableProps> = ({
    users,
    loading,
    currentUserId,
    onEdit,
    onDelete,
    onToggleStatus,
    onResetPassword,
    onRefresh,
    canManageUsers,
    onRowClick,
}) => {
    // State to manage the visibility and position of the action menu
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    // State to store the ID of the user for whom the action menu is open
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Handler to open the action menu
    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, userId: string) => {
        event.stopPropagation(); // Prevent row click event from firing
        setAnchorEl(event.currentTarget); // Set the anchor element for positioning the menu
        setSelectedUserId(userId); // Store the ID of the user whose menu is open
    };

    // Handler to close the action menu
    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedUserId(null);
    };

    // Helper to find the currently selected user from the `users` array
    const getSelectedUser = () => Array.isArray(users) ? users.find(u => u.id === selectedUserId) : undefined;

    // Action handlers for menu items
    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const userToEdit = getSelectedUser();
        if (userToEdit) onEdit(userToEdit);
        handleMenuClose();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const userToDelete = getSelectedUser();
        if (userToDelete) onDelete(userToDelete);
        handleMenuClose();
    };

    const handleToggleStatusClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const userToToggle = getSelectedUser();
        if (userToToggle) onToggleStatus(userToToggle.id, userToToggle.status);
        handleMenuClose();
    };

    const handleResetPasswordClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedUserId) onResetPassword(selectedUserId);
        handleMenuClose();
    };

    const handleViewDetailsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedUserId) onRowClick(selectedUserId);
        handleMenuClose();
    };

    // Helper function to get Tailwind classes for Role Chips
    const getRoleChipClasses = (role: UserType['role']) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-800'; // Admin role in purple
            case 'analyst':
                return 'bg-blue-100 text-blue-800';   // Analyst role in blue
            case 'viewer':
                return 'bg-gray-100 text-gray-800';   // Viewer role in gray
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Helper function to get Tailwind classes for Status Chips
    const getStatusChipClasses = (status: UserType['status']) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800'; // Active status in green
            case 'suspended':
                return 'bg-red-100 text-red-800';     // Suspended status in red
            case 'inactive': // Assuming 'inactive' might also be a status
                return 'bg-yellow-100 text-yellow-800'; // Inactive status in yellow
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Helper to parse ISO strings into Date objects
    function parseISO(dateString: string): Date {
        return new Date(dateString);
    }

    // Ensure `users` is always an array for safe mapping
    const usersToDisplay = Array.isArray(users) ? users : [];

    // --- Loading State ---
    if (loading && usersToDisplay.length === 0) {
        return (
            <div className="flex justify-center items-center p-8">
                {/* Custom Tailwind loading spinner */}
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="ml-4 text-gray-700 text-lg">Loading users...</p>
            </div>
        );
    }

    // --- No Data State ---
    if (!loading && usersToDisplay.length === 0) {
        return (
            <div className="flex justify-center items-center p-8 text-center text-gray-500">
                <p className="text-lg">No users found matching your criteria.</p>
            </div>
        );
    }

    return (
        // Table Container: Provides a card-like appearance with shadow and rounded corners
        <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
            {/* Responsive wrapper for the table, enabling horizontal scrolling on small screens */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* Table Head: Styled with a dark background for headers */}
                    <thead className="bg-blue-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                User
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Last Login
                            </th>
                            {/* Action Column Header with Refresh Button */}
                            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                <span className="sr-only">Actions</span> {/* Screen reader only text */}
                                <button
                                    onClick={onRefresh}
                                    disabled={loading}
                                    className="p-1 rounded-full text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                    title="Refresh Users List" // Native tooltip
                                >
                                    <RefreshIcon size={18} /> {/* Lucide Refresh Icon */}
                                </button>
                            </th>
                        </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {usersToDisplay.map((user) => (
                            <tr
                                key={user.id}
                                className="hover:bg-gray-50 transition-colors duration-150 ease-in-out cursor-pointer"
                                onClick={() => onRowClick(user.id)}
                            >
                                {/* User Cell (Avatar + Username) */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-600 text-white font-semibold text-lg">
                                                {user.username ? user.username.charAt(0).toUpperCase() : ''}
                                            </div>
                                        </div>
                                        {/* Username */}
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                {/* Email Cell */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                    {user.email}
                                </td>
                                {/* Role Cell (Chip) */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={clsx(
                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize",
                                            getRoleChipClasses(user.role)
                                        )}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                {/* Status Cell (Chip) */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={clsx(
                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize",
                                            getStatusChipClasses(user.status)
                                        )}
                                    >
                                        {user.status}
                                    </span>
                                </td>
                                {/* Last Login Cell */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                    {user.last_login ? format(parseISO(user.last_login), 'MMM dd, yyyy HH:mm:ss') : 'Never'}
                                </td>
                                {/* Action Cell (MoreVert Icon and Dropdown Menu) */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {canManageUsers && (
                                        <div className="relative inline-block text-left">
                                            {/* MoreVert Button */}
                                            <button
                                                type="button"
                                                onClick={(e) => handleMenuOpen(e, user.id)}
                                                disabled={user.id === currentUserId} // Disable actions for the current user
                                                className="inline-flex justify-center p-1 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                id={`options-menu-${user.id}`}
                                                aria-haspopup="true"
                                                aria-expanded={Boolean(anchorEl) && selectedUserId === user.id ? 'true' : 'false'}
                                            >
                                                <MoreIcon size={20} /> {/* Lucide MoreVert Icon */}
                                            </button>

                                            {/* Dropdown Menu (conditionally rendered) */}
                                            {Boolean(anchorEl) && selectedUserId === user.id && (
                                                <div
                                                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                                                    role="menu"
                                                    aria-orientation="vertical"
                                                    aria-labelledby={`options-menu-${user.id}`}
                                                    // This div is a simple custom dropdown.
                                                    // For more advanced interaction (e.g., closing on outside click),
                                                    // you might integrate a headless UI library like Headless UI or Radix UI.
                                                >
                                                    <div className="py-1" role="none">
                                                        {/* View Details */}
                                                        <button
                                                            onClick={handleViewDetailsClick}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                            role="menuitem"
                                                        >
                                                            <VisibilityIcon size={18} className="mr-3 text-gray-500" />
                                                            <span>View Details</span>
                                                        </button>
                                                        {/* Edit User */}
                                                        <button
                                                            onClick={handleEditClick}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                            role="menuitem"
                                                        >
                                                            <EditIcon size={18} className="mr-3 text-blue-500" />
                                                            <span>Edit User</span>
                                                        </button>
                                                        {/* Suspend/Activate User */}
                                                        <button
                                                            onClick={handleToggleStatusClick}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                            role="menuitem"
                                                        >
                                                            {getSelectedUser()?.status === 'active' ? (
                                                                <LockIcon size={18} className="mr-3 text-yellow-600" />
                                                            ) : (
                                                                <UnlockIcon size={18} className="mr-3 text-green-600" />
                                                            )}
                                                            <span>
                                                                {getSelectedUser()?.status === 'active' ? 'Suspend User' : 'Activate User'}
                                                            </span>
                                                        </button>
                                                        {/* Reset Password */}
                                                        <button
                                                            onClick={handleResetPasswordClick}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                            role="menuitem"
                                                        >
                                                            <ResetPasswordIcon size={18} className="mr-3 text-indigo-500" />
                                                            <span>Reset Password</span>
                                                        </button>
                                                        {/* Delete User */}
                                                        <button
                                                            onClick={handleDeleteClick}
                                                            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900"
                                                            role="menuitem"
                                                        >
                                                            <DeleteIcon size={18} className="mr-3 text-red-500" />
                                                            <span>Delete User</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersTable;
