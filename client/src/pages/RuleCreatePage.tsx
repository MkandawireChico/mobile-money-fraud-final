// client/src/pages/RuleCreatePage.tsx
import React from 'react';
import { useHistory } from 'react-router-dom';
// No Material-UI imports needed for this refactored page
// import { makeStyles, Paper, Typography, Box } from '@material-ui/core';

import RuleForm from '../components/rules/RuleForm.tsx'; // Assumed to be Tailwind-ready or converted
// theme.ts is not directly used for styling in this page after refactor,
// but might be used by child components (like RuleForm) or for color constants.
// import theme from '../theme.ts';

// Removed useStyles as all styling is handled by Tailwind CSS classes

const RuleCreatePage: React.FC = () => {
    // useHistory is now useNavigate in react-router-dom v6, but keeping for compatibility if using v5
    // For react-router-dom v6: const navigate = useNavigate();
    const history = useHistory(); // For react-router-dom v5

    // Callback for successful rule creation
    const handleSuccess = () => {
        console.log('[RuleCreatePage] Rule created successfully. Navigating back to /rules.');
        history.push('/rules'); // Navigate back to the rules list page
    };

    // Callback for canceling the form
    const handleCancel = () => {
        console.log('[RuleCreatePage] Rule creation cancelled. Navigating back to /rules.');
        history.push('/rules'); // Navigate back to the rules list page
    };

    return (
        // Root container with Tailwind padding and background for the page
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Main content area, styled as a paper-like card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
                {/* Header section */}
                <div className="mb-6">
                    {/* Page title */}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Create New Rule
                    </h1>
                </div>
                {/* Render the RuleForm component for creating a new rule */}
                {/* It's assumed that RuleForm.tsx handles its own internal styling with Tailwind */}
                <RuleForm mode="create" onSuccess={handleSuccess} onCancel={handleCancel} />
            </div>
        </div>
    );
};

export default RuleCreatePage;
