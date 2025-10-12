// client/src/layouts/AuthLayout.tsx
import React from 'react';
import clsx from 'clsx'; // For conditional classes if needed

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    return (
        // Root container: Full viewport height, centered content, with colored side backgrounds
        <div className={clsx(
            "flex justify-center items-center min-h-screen p-4 sm:p-6",
            "font-inter antialiased text-gray-900 dark:text-gray-100 relative overflow-hidden"
        )}>
            {/* Red Background - Left Side (Airtel) */}
            <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-red-500 to-red-400 hidden lg:block"></div>
            
            {/* Green Background - Right Side (TNM) */}
            <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-green-500 to-green-400 hidden lg:block"></div>
            
            {/* Center Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 lg:left-1/3 lg:right-1/3 lg:w-1/3"></div>

            {/* Airtel Money Branding - Left Side */}
            <div className="absolute left-4 xl:left-8 top-1/2 transform -translate-y-1/2 hidden lg:flex flex-col items-center opacity-70 hover:opacity-90 transition-opacity duration-300">
                <div className="bg-gradient-to-b from-red-600 to-red-700 p-6 xl:p-8 rounded-2xl xl:rounded-3xl shadow-2xl border-2 xl:border-4 border-red-500">
                    <div className="text-white text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-wide whitespace-nowrap">Airtel Money</div>
                </div>
            </div>

            {/* TNM Mpamba Branding - Right Side */}
            <div className="absolute right-4 xl:right-8 top-1/2 transform -translate-y-1/2 hidden lg:flex flex-col items-center opacity-70 hover:opacity-90 transition-opacity duration-300">
                <div className="bg-gradient-to-b from-green-500 to-green-600 p-6 xl:p-8 rounded-2xl xl:rounded-3xl shadow-2xl border-2 xl:border-4 border-green-400">
                    <div className="text-white text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-wide whitespace-nowrap">TNM Mpamba</div>
                </div>
            </div>

            {/* Main authentication card container */}
            <div className={clsx(
                "bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700",
                "max-w-md w-full z-10", // z-10 to ensure it's above the side branding
                "flex flex-col items-center justify-center",
                "transition-all duration-300 ease-in-out transform hover:scale-[1.01]",
                "backdrop-blur-sm bg-white/95 dark:bg-gray-800/95" // Subtle transparency
            )}>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
