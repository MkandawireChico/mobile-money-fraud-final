// client/src/pages/RuleFormPage.tsx
import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useParams, useHistory } from 'react-router-dom';
// No Material-UI imports needed for this refactored page
// import { makeStyles, Paper, Typography, Box, CircularProgress, Button } from '@material-ui/core';

// Import Lucide React icons for a modern and consistent look
// Make sure you have 'lucide-react' installed: npm install lucide-react
import { Loader2, AlertCircle } from 'lucide-react'; // Loader2 for spinner, AlertCircle for error

import RuleForm from '../components/rules/RuleForm.tsx'; // Assumed to be Tailwind-ready or converted
import { Rule } from '../types'; // Assuming Rule type is defined here
import api from '../api/axios.ts';
import { AuthContext } from '../context/AuthContext.tsx'; // AuthContext remains for user context

// Removed useStyles as all styling is handled by Tailwind CSS classes

const RuleFormPage: React.FC = () => {
    // useHistory is now useNavigate in react-router-dom v6, but keeping for compatibility if using v5
    // For react-router-dom v6: const navigate = useNavigate();
    const history = useHistory(); // For react-router-dom v5
    const { id } = useParams<{ id?: string }>(); // Get rule ID from URL params (optional for create mode)
    const { user: currentUser, isAuthenticated, isLoading: authLoading } = useContext(AuthContext); // Get auth state

    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [selectedRule, setSelectedRule] = useState<Rule | undefined>(undefined);
    const [loadingRule, setLoadingRule] = useState<boolean>(false); // Separate loading state for rule data fetch
    const [error, setError] = useState<string | null>(null);

    // useCallback to memoize fetchRule to prevent unnecessary re-creations
    const fetchRule = useCallback(async () => {
        if (!id) {
            setLoadingRule(false); // No rule to load for create mode
            return;
        }
        setLoadingRule(true); // Start loading rule data
        setError(null); // Clear any previous errors
        try {
            console.log(`[RuleFormPage] Fetching rule with ID: ${id}`);
            const response = await api.get<Rule>(`/rules/${id}`); // Specify Rule type for API response
            setSelectedRule(response.data);
            console.log('[RuleFormPage] Fetched rule:', response.data);
        } catch (err: any) {
            console.error('Error fetching rule for edit:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to load rule for editing.');
        } finally {
            setLoadingRule(false); // End loading rule data
        }
    }, [id]); // Dependency on 'id' to re-fetch if URL parameter changes

    // Effect hook to determine form mode and fetch rule data based on authentication and user role
    useEffect(() => {
        // Wait for AuthContext to finish loading before checking roles and fetching data
        if (!authLoading) {
            const allowedRoles = ['admin']; // Only admins can create/edit rules
            if (!isAuthenticated || !currentUser?.role || !allowedRoles.includes(currentUser.role)) {
                setError('Access Denied: You must be an administrator to create or edit rules.');
                setLoadingRule(false); // Ensure loading is false if access is denied
                return; // Exit early if unauthorized
            }

            // If an 'id' is present in the URL, it's edit mode; otherwise, it's create mode
            if (id) {
                setFormMode('edit');
                fetchRule(); // Call the memoized fetchRule function
            } else {
                setFormMode('create');
                setSelectedRule(undefined); // Clear any previous rule data for create mode
                setLoadingRule(false); // No rule to load for create mode, so immediately stop loading
            }
        }
    }, [id, isAuthenticated, authLoading, currentUser?.role, fetchRule]); // Dependencies for effect

    // Callback for successful rule creation/update
    const handleSuccess = () => {
        console.log('[RuleFormPage] Rule operation successful. Navigating back to rules list.');
        history.push('/rules'); // Navigate back to the rules list page
    };

    // Callback for canceling the form
    const handleCancel = () => {
        console.log('[RuleFormPage] Rule operation cancelled. Navigating back to rules list.');
        history.push('/rules'); // Navigate back to the rules list page
    };

    // --- Conditional Rendering for Loading, Error, and Not Found states ---

    // Show loading spinner if either auth is loading or rule data is loading
    if (authLoading || loadingRule) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center justify-center">
                    <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
                    <p className="text-xl text-gray-700 dark:text-gray-300">
                        {id ? 'Loading rule...' : 'Preparing form...'}
                    </p>
                </div>
            </div>
        );
    }

    // Show error message if an error occurred during fetching or due to access control
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold flex flex-col items-center">
                    <AlertCircle size={48} className="text-red-600 dark:text-red-400 mb-4" />
                    <p className="mb-6 text-center">{error}</p>
                    <button
                        onClick={handleCancel}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Main Component Render
    return (
        // Root container with Tailwind padding and background for the page
        <div className="min-h-screen flex justify-center items-start bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            {/* Main content area, styled as a paper-like card */}
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl max-w-4xl w-full mt-8 mb-8 border border-gray-200 dark:border-gray-700">
                {/* Page title */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
                    {formMode === 'create' ? 'Create New Rule' : `Edit Rule: ${selectedRule?.rule_name}`}
                </h1>
                {/* Render the RuleForm component */}
                {/* It's assumed that RuleForm.tsx handles its own internal styling with Tailwind */}
                <RuleForm
                    mode={formMode}
                    rule={selectedRule}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    );
};

export default RuleFormPage;
