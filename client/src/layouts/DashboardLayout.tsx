// client/src/layouts/DashboardLayout.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx'; // Corrected import to use `anomalies`
import { useHistory, NavLink } from 'react-router-dom';

// Import Lucide React icons for a modern and consistent look
import {
    Menu,           // For toggling sidebar on mobile
    Bell,           // For notifications
    LogOut,         // For logout
    LayoutDashboard, // For Dashboard
    ReceiptText,    // For Transactions
    AlertTriangle,  // For Anomalies
    Users,          // For Users
    Settings,       // For Settings
    ScrollText,     // For Audit Logs
    ClipboardList,  // For Rule Engine
    X,              // For close button on mobile sidebar
    ShieldQuestion  // For Top-left logo
} from 'lucide-react';

import NotificationSnackbar from '../components/common/NotificationSnackBar.tsx';

// Define consistent widths for the sidebar in pixels
const SIDEBAR_WIDTH_EXPANDED = 256; // w-64 equivalent
const SIDEBAR_WIDTH_COLLAPSED = 80;   // w-20 equivalent

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 'sidebarOpen' controls if sidebar is fully visible (mobile) or expanded (desktop hover)
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // 'sidebarCollapsed' is true when the sidebar is in its minimized (80px) state on desktop
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
    const { anomalies } = useSocket(); // 🎯 FIXED: Destructuring 'anomalies' instead of 'fraudAlerts'
    const history = useHistory();

    // Ref to store the interval ID
    const intervalRef = useRef<NodeJS.Timeout | null>(null); // Declare intervalRef with type NodeJS.Timeout | null

    console.log('[DashboardLayout] Render - AuthContext State - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading, 'User:', user);

    // Effect to handle sidebar collapse on desktop larger screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) { // Equivalent to Tailwind's 'lg' breakpoint
                setSidebarCollapsed(true); // Default to collapsed on desktop
                setSidebarOpen(false); // Ensure it's not fully open by default
            } else {
                setSidebarCollapsed(false); // Not collapsed on mobile/tablet
            }
        };

        handleResize(); // Set initial state
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

    // Toggle sidebar for mobile (and desktop if manually toggled)
    const handleDrawerToggle = useCallback(() => {
        setSidebarOpen(prevOpen => !prevOpen);
        // If on desktop, also toggle the collapsed state
        if (window.innerWidth >= 1024) {
            setSidebarCollapsed(prevCollapsed => !prevCollapsed);
        }
    }, []);

    const handleSidebarHoverEnter = useCallback(() => {
        if (sidebarCollapsed && window.innerWidth >= 1024) {
            setSidebarOpen(true); // Expand on hover if collapsed on desktop
        }
    }, [sidebarCollapsed]);

    const handleSidebarHoverLeave = useCallback(() => {
        if (sidebarCollapsed && window.innerWidth >= 1024) {
            setSidebarOpen(false); // Collapse on mouse leave if collapsed on desktop
        }
    }, [sidebarCollapsed]);


    const handleLogout = useCallback(() => {
        logout();
        history.push('/login');
    }, [logout, history]);

    const commonMenuItems = [
        { text: 'Dashboard', icon: <LayoutDashboard size={24} />, path: '/dashboard' },
        { text: 'Transactions', icon: <ReceiptText size={24} />, path: '/transactions' },
        { text: 'Anomalies', icon: <AlertTriangle size={24} />, path: '/anomalies' }, // 🎯 FIXED: Renamed text and path
    ];

    const restrictedMenuItems = [
        { text: 'Rule Engine', icon: <ClipboardList size={24} />, path: '/rules', roles: ['admin'] },
        { text: 'Users', icon: <Users size={24} />, path: '/users', roles: ['admin'] },
        { text: 'Settings', icon: <Settings size={24} />, path: '/settings', roles: ['admin'] },
        { text: 'Audit Logs', icon: <ScrollText size={24} />, path: '/audit-logs', roles: ['admin'] },
    ];

    const allMenuItems = [
        ...commonMenuItems,
        ...(user && isAuthenticated ? restrictedMenuItems.filter(item => item.roles.includes(user.role)) : [])
    ];

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            history.push('/login');
        }
    }, [isAuthenticated, authLoading, history]);

    // FIX: Simplified useEffect for interval management.
    // This pattern ensures the interval is only set when needed
    // and correctly cleared in the cleanup function, preventing 'interval is not defined'.
    useEffect(() => {
        // First, ensure any existing interval is cleared BEFORE setting a new one
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (isAuthenticated) {
            intervalRef.current = setInterval(() => {
                console.log('Fetching latest anomalies...'); // 🎯 FIXED: Updated log message
                // In a real app, you'd call an API to fetch new anomalies here
                // e.g., fetchNewAnomalies();
            }, 30000);
        }

        // Cleanup function: This will be called when the component unmounts
        // or when any dependency in the array changes (i.e., isAuthenticated changes).
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null; // Important: Clear ref value on cleanup
                console.log('Anomaly fetching interval cleared (via cleanup).'); // 🎯 FIXED: Updated log message
            }
        };
    }, [isAuthenticated]); // Rerun if authentication status changes


    // Calculate dynamic widths and margins based on state and screen size
    const currentSidebarWidth = (() => {
        if (window.innerWidth < 1024) { // Mobile
            return sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : 0; // Sidebar is either full width or hidden
        } else { // Desktop
            return sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED; // Expanded or collapsed
        }
    })();

    const mainContentLeftMargin = currentSidebarWidth;


    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 dark:border-blue-400"></div>
                <p className="ml-4 text-gray-700 dark:text-gray-300 text-xl">Loading application...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 font-inter antialiased">
            {/* Overlay for mobile sidebar when open */}
            {sidebarOpen && window.innerWidth < 1024 && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={handleDrawerToggle}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar / Navigation Drawer */}
            <nav
                className={clsx(
                    `fixed inset-y-0 left-0 h-full bg-blue-900 dark:bg-gray-900 text-white shadow-2xl z-40
                     transform transition-all duration-300 ease-in-out overflow-hidden`,
                    // Mobile: use translate-x for slide effect
                    window.innerWidth < 1024 && (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
                )}
                style={{ width: currentSidebarWidth }}
                onMouseEnter={handleSidebarHoverEnter}
                onMouseLeave={handleSidebarHoverLeave}
            >
                {/* Close button for mobile sidebar (only visible when open on mobile) */}
                {sidebarOpen && window.innerWidth < 1024 && (
                    <button
                        onClick={handleDrawerToggle}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700"
                        aria-label="Close sidebar menu"
                    >
                        <X size={24} />
                    </button>
                )}

                {/* Logo/Brand Area */}
                <div className="h-16 flex items-center justify-center bg-blue-950 dark:bg-gray-950 shadow-lg px-4 relative overflow-hidden">
                    <h2 className="text-2xl font-bold tracking-wider whitespace-nowrap">
                        {/* Show icon only when collapsed desktop, otherwise hide it */}
                        <span className={clsx(
                            "absolute left-1/2 -translate-x-1/2 transition-opacity duration-300",
                            // Show icon when collapsed desktop (sidebarOpen is false) OR if mobile closed (!sidebarOpen && window.innerWidth < 1024)
                            (sidebarCollapsed && !sidebarOpen) || (!sidebarOpen && window.innerWidth < 1024)
                                ? "opacity-100"
                                : "opacity-0"
                        )}>
                            <ShieldQuestion size={32} className="text-blue-200" />
                        </span>
                        {/* Show text when expanded (mobile open or desktop expanded) */}
                           <span className={clsx(
                            "transition-opacity duration-300",
                            // Show text when sidebar is open (mobile or desktop expanded)
                            sidebarOpen
                                ? "opacity-100"
                                : "opacity-0"
                        )}>
                            FraudSense
                        </span>
                    </h2>
                </div>

                {/* Navigation Links */}
                <div className="mt-8 flex flex-col justify-between h-[calc(100%-4rem)]">
                    <ul className="space-y-2 px-2">
                        {allMenuItems.map((item) => (
                            <li key={item.text}>
                                <NavLink
                                    to={item.path}
                                    // For desktop, only close on click if the sidebar is expanded (i.e., 'open' is true).
                                    // On mobile, always close on click.
                                    onClick={() => { if (sidebarOpen) handleDrawerToggle(); }}
                                    className={clsx(
                                        "flex items-center py-4 rounded-lg transition-all duration-200 ease-in-out transform relative overflow-hidden",
                                        "hover:translate-x-1 hover:shadow-md",
                                        // Conditional padding/justification for desktop collapsed vs expanded
                                        sidebarOpen ? "justify-start px-5" : "justify-center px-0",
                                        'text-gray-300 dark:text-gray-300 hover:bg-blue-700 dark:hover:bg-gray-700 hover:text-white dark:hover:text-white'
                                    )}
                                    activeClassName="bg-blue-700 dark:bg-blue-600 font-semibold text-white border-l-4 border-blue-300 dark:border-blue-200 shadow-md"
                                >
                                    {/* Icon */}
                                    <div className={clsx(
                                        "flex-shrink-0 transition-all duration-300 z-10",
                                        // Conditional margin-right for icon
                                        sidebarOpen ? "mr-4" : "mr-0"
                                    )}>
                                        {item.icon}
                                    </div>
                                    {/* Text Label */}
                                    <span className={clsx(
                                        "whitespace-nowrap text-base transition-opacity duration-300 absolute left-1/2 -translate-x-1/2 pointer-events-none",
                                        // Hide text completely when sidebar is collapsed or mobile closed
                                        sidebarOpen ? "opacity-100" : "opacity-0",
                                        // Adjust position for expanded text (mobile open or desktop hover)
                                        sidebarOpen ? "relative left-auto transform-none" : "left-1/2 -translate-x-1/2"
                                    )}>
                                        {item.text}
                                    </span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* Clean bottom spacing without user info duplication */}
                    <div className="mt-auto p-4">
                        {/* User info removed - now only shown in top bar to avoid duplication */}
                    </div>
                </div>
            </nav>

            {/* Top Bar (AppBar Equivalent) */}
            <header
                className={clsx(
                    `fixed top-0 right-0 h-16 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-lg z-20
                     transition-all duration-300 ease-in-out flex items-center justify-between px-6`
                )}
                style={{ left: mainContentLeftMargin, width: `calc(100% - ${mainContentLeftMargin}px)` }} // Added width calculation for header
            >
                {/* Menu Button (for small screens, or to toggle collapse on desktop) */}
                <button
                    onClick={handleDrawerToggle}
                    className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                    aria-label="Toggle sidebar menu"
                >
                    <Menu size={24} />
                </button>

                {/* Application Title */}
                <h1 className="text-2xl font-bold flex-grow text-center lg:text-left ml-4">
                    Malawi Mobile Money Fraud Detection
                </h1>
                {/* Right-aligned actions */}
                <div className="flex items-center space-x-4">
                    {/* Notifications Icon with Badge */}
                    <button
                        onClick={() => history.push('/anomalies')} // 🎯 FIXED: Changed path to /anomalies
                        className="relative p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                        aria-label={`View ${anomalies.length} new anomalies`} // 🎯 FIXED: Used 'anomalies.length' and updated text
                    >
                        <Bell size={24} />
                        {anomalies.length > 0 && ( // 🎯 FIXED: Used 'anomalies.length'
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                                {anomalies.length} {/* 🎯 FIXED: Used 'anomalies.length' */}
                            </span>
                        )}
                    </button>
                    {/* User Info (responsive - shows on all screens now since sidebar duplicate removed) */}
                    {user && isAuthenticated && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mr-4">
                            <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full mr-2 sm:mr-3 text-blue-600 dark:text-blue-300 font-semibold text-xs">
                                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                            </span>
                            <div className="hidden sm:flex flex-col justify-center -space-y-0.5">
                                <span className="font-medium text-gray-900 dark:text-gray-100 leading-tight">
                                    {user.username}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                            </div>
                        </div>
                    )}
                    {/* Enhanced Logout Button (all screen sizes) */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg shadow-sm hover:bg-red-700 dark:hover:bg-red-600 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 text-sm font-medium"
                        aria-label="Logout"
                    >
                        <LogOut size={18} className="sm:mr-2" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main
                className={clsx(
                    "flex-grow p-6 pt-20 transition-all duration-300 ease-in-out overflow-auto"
                )}
                style={{ marginLeft: mainContentLeftMargin }}
            >
                {children}
            </main>

            <NotificationSnackbar />
        </div>
    );
};

export default DashboardLayout;
