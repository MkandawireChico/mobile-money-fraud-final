// client/src/pages/RuleEditPage.tsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useHistory, useParams } from 'react-router-dom';
// No Material-UI imports needed for this refactored page
// import { makeStyles, Paper, Typography, Box, CircularProgress } from '@material-ui/core';

// Import Lucide React icons for a modern and consistent look
// Make sure you have 'lucide-react' installed: npm install lucide-react
import { Loader2, AlertCircle } from 'lucide-react'; // Loader2 for spinner, AlertCircle for error

import RuleForm from '../components/rules/RuleForm.tsx'; // Assumed to be Tailwind-ready or converted
import api from '../api/axios.ts';
import { Rule } from '../types/index.ts'; // Assuming Rule type is defined here
import { AuthContext } from '../context/AuthContext.tsx'; // AuthContext remains for user context

// Removed useStyles as all styling is handled by Tailwind CSS classes

const RuleEditPage: React.FC = () => {
    // useHistory is now useNavigate in react-router-dom v6, but keeping for compatibility if using v5
    // For react-router-dom v6: const navigate = useNavigate();
    const history = useHistory(); // For react-router-dom v5
    const { id } = useParams<{ id: string }>(); // Get rule ID from URL parameters
    const { user: currentUser, isAuthenticated, isLoading: authLoading } = useContext(AuthContext); // Use isAuthenticated and authLoading from AuthContext

    const [rule, setRule] = useState<Rule | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true); // Separate loading state for rule data
    const [error, setError] = useState<string | null>(null);

    // Fetches a specific rule by its ID from the API
    const fetchRule = useCallback(async () => {
        setLoading(true); // Start loading for rule data
        setError(null); // Clear any previous errors
        try {
            console.log(`[RuleEditPage] Fetching rule with ID: ${id}`);
            const response = await api.get<Rule>(`/rules/${id}`); // Specify Rule type for response
            setRule(response.data);
            console.log('[RuleEditPage] Fetched rule:', response.data);
        } catch (err: any) {
            console.error('[RuleEditPage] Error fetching rule:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to load rule.');
        } finally {
            setLoading(false); // End loading for rule data
        }
    }, [id]); // Dependency on 'id' to re-fetch if URL parameter changes

    // Effect hook to fetch rule details based on authentication status and user role
    useEffect(() => {
        if (!authLoading) { // Ensure authentication state has been determined
            if (isAuthenticated && currentUser?.role === 'admin') { // Only admins can edit rules
                fetchRule();
            } else {
                setError('Access Denied: You must be an administrator to edit rules.');
                setLoading(false); // Stop loading if access is denied
            }
        }
    }, [isAuthenticated, authLoading, currentUser?.role, fetchRule]); // Dependencies for effect

    // Callback for successful rule update
    const handleSuccess = () => {
        console.log('[RuleEditPage] Rule updated successfully. Navigating back to /rules.');
        history.push('/rules'); // Navigate back to the rules list page
    };

    // Callback for canceling the form
    const handleCancel = () => {
        console.log('[RuleEditPage] Rule editing cancelled. Navigating back to /rules.');
        history.push('/rules'); // Navigate back to the rules list page
    };

    // --- Conditional Rendering for Loading, Error, and Not Found states ---

    // Show loading spinner if either auth is loading or rule data is loading
    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <Loader2 size={60} className="animate-spin text-blue-500" />
                <p className="ml-5 text-xl text-gray-700 dark:text-gray-300">
                    Loading rule data...
                </p>
            </div>
        );
    }

    // Show error message if an error occurred during fetching or due to access control
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold flex items-center">
                    <AlertCircle size={24} className="mr-3" /> Error: {error}
                </div>
            </div>
        );
    }

    // Show "Rule not found" if no rule data is available after loading and no error
    if (!rule) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-gray-600 dark:text-gray-400 text-lg font-semibold flex items-center">
                    <AlertCircle size={24} className="mr-3" /> Rule not found or could not be loaded.
                </div>
            </div>
        );
    }

    // --- Main Component Render ---
    return (
        // Root container with Tailwind padding and background for the page
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Main content area, styled as a paper-like card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
                {/* Header section */}
                <div className="mb-6">
                    {/* Page title with rule name */}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Edit Rule: <span className="text-blue-600 dark:text-blue-400">{rule.rule_name}</span>
                    </h1>
                </div>
                {/* Render the RuleForm component for editing an existing rule */}
                {/* It's assumed that RuleForm.tsx handles its own internal styling with Tailwind */}
                <RuleForm mode="edit" rule={rule} onSuccess={handleSuccess} onCancel={handleCancel} />
            </div>
        </div>
    );
};

export default RuleEditPage;
