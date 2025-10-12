// client/src/pages/NotFoundPage.tsx
import React from 'react';
import { useHistory } from 'react-router-dom';

// Import Lucide React icons for a modern and consistent look
// Make sure you have 'lucide-react' installed: npm install lucide-react
import { Frown as FrownIcon } from 'lucide-react'; // Frown icon for a "not found" page

const NotFoundPage: React.FC = () => {
    const history = useHistory();

    // Handles navigation back to the dashboard
    const handleGoHome = () => {
        history.push('/dashboard');
    };

    return (
        // Full screen container for the 404 page, centering content vertically and horizontally
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            {/* Not Found Card/Container */}
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 md:p-10 text-center max-w-xl w-full rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                {/* Icon */}
                <FrownIcon size={80} className="text-red-600 dark:text-red-400 mx-auto mb-6" /> {/* Lucide Frown Icon */}

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">
                    404 - Page Not Found
                </h1>

                {/* Description */}
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-prose mx-auto">
                    Oops! The page you're trying to reach doesn't exist or has been moved.
                    Please double-check the URL or use the button below to go back to the dashboard.
                </p>

                {/* Go Home Button */}
                <button
                    onClick={handleGoHome}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;
