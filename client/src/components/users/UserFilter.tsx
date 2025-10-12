// client/src/components/users/UserFilter.tsx
import React, { useState } from 'react';

interface UserFilterProps {
    currentFilters: any;
    onApply: (filters: any) => void;
    onClose: () => void;
}

const UserFilter: React.FC<UserFilterProps> = ({
    currentFilters,
    onApply,
    onClose
}) => {
    // State to manage the selected role, initialized with current filters or empty
    const [role, setRole] = useState<string>(currentFilters.role || '');
    // State to manage the selected status, initialized with current filters or empty
    const [status, setStatus] = useState<string>(currentFilters.status || '');

    // Handles applying the selected filters and closing the filter panel
    const handleApply = () => {
        onApply({
            role,
            status,
        });
        onClose();
    };

    // Handles resetting the filters to their default (empty) state
    const handleReset = () => {
        setRole('');
        setStatus('');
    };

    return (
        // Main container for the filter panel
        // p-6 for padding, w-80 for a fixed width (320px), bg-white for background,
        // rounded-lg for rounded corners, shadow-xl for a prominent shadow.
        // flex flex-col space-y-4 to arrange elements vertically with spacing.
        <div className="p-6 w-80 bg-white rounded-lg shadow-xl flex flex-col space-y-4">
            {/* Title for the filter panel */}
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-2">
                Filter Users
            </h2>

            {/* Role selection form control */}
            <div className="relative w-full">
                <label htmlFor="role-select" className="sr-only">Role</label>
                <select
                    id="role-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    // Tailwind classes for a sleek, outlined select input
                    className="block w-full px-4 py-2 text-base text-gray-900 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-colors duration-200 ease-in-out hover:border-gray-400"
                >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                </select>
                {/* Custom arrow for the select input */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                        className="h-4 w-4 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                        />
                    </svg>
                </div>
            </div>

            {/* Status selection form control */}
            <div className="relative w-full">
                <label htmlFor="status-select" className="sr-only">Status</label>
                <select
                    id="status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    // Tailwind classes for a sleek, outlined select input
                    className="block w-full px-4 py-2 text-base text-gray-900 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-colors duration-200 ease-in-out hover:border-gray-400"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                </select>
                {/* Custom arrow for the select input */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                        className="h-4 w-4 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                    >
                        <path
                            d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                        />
                    </svg>
                </div>
            </div>

            {/* Divider for visual separation */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Action buttons: Reset, Cancel, Apply */}
            <div className="flex justify-between items-center mt-2">
                {/* Reset Button */}
                <button
                    onClick={handleReset}
                    className="px-4 py-2 text-blue-700 font-medium rounded-md hover:bg-blue-50 transition-colors duration-200 ease-in-out"
                >
                    Reset
                </button>
                <div className="flex space-x-2">
                    {/* Cancel Button */}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 font-medium rounded-md hover:bg-gray-100 transition-colors duration-200 ease-in-out"
                    >
                        Cancel
                    </button>
                    {/* Apply Button: Primary action button */}
                    <button
                        onClick={handleApply}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserFilter;
