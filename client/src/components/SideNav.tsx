// src/components/SideNav.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

// Import Lucide React icons for visual appeal
import {
    LayoutDashboard, // For Dashboard
    AlertTriangle,   // For Alerts
    ReceiptText,     // For Transactions
    BarChart3,       // For Analytics
    Brain,           // For ML Performance
    FileText,        // For Reports
    Wrench,          // For Rule Engine
    Users,           // For Users
    Settings,        // For Settings
    ScrollText,      // For Audit Logs
    X,               // For close button on mobile
    Shield,          // For logo
    ShieldQuestion // For Top Nav Alert Icon (if used)
} from 'lucide-react';

// Define the width of the sidebar using a standard Tailwind class for consistency
const SIDEBAR_WIDTH_CLASS = 'w-64'; // Equivalent to 256px, common sidebar width

interface SideNavProps {
    isOpen: boolean; // Controls the open/close state of the sidebar
    onClose: () => void; // Callback to close the sidebar
    userRole: string | null; // User's role for conditional menu items
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, onClose, userRole }) => {
    // Determine if the current user has admin privileges
    const isAdmin = userRole === 'admin';
    const isAnalyst = userRole === 'analyst';

    // Base styling for navigation links
    const baseLinkClasses = `flex items-center px-6 py-3 text-base font-medium
                             transition-colors duration-200 ease-in-out rounded-lg mx-2`;

    // Active link styling
    const activeLinkClasses = `bg-blue-700 dark:bg-blue-600 text-white shadow-lg
                               border-l-4 border-white dark:border-white transform scale-105`;

    // Inactive link styling
    const inactiveLinkClasses = `text-gray-200 dark:text-gray-300 hover:bg-blue-700 hover:text-white
                                 dark:hover:bg-gray-700 hover:shadow-md hover:scale-102 transition-all duration-200`;

    // Combine base, active, and inactive classes dynamically
    const getNavLinkClasses = (isActive: boolean): string =>
        `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

    return (
        // Main Sidebar Container:
        <div
            className={`fixed inset-y-0 left-0 ${SIDEBAR_WIDTH_CLASS} h-full bg-blue-800 dark:bg-gray-900 text-white shadow-xl
                       transform transition-transform duration-300 ease-in-out z-40
                       ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                       lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-700 dark:lg:border-gray-800`}
        >
            {/* Mobile Close Button (visible only on small screens when open) */}
            <div className="lg:hidden absolute top-4 right-4 z-50">
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                               dark:hover:bg-gray-700 dark:focus:ring-blue-400"
                    aria-label="Close sidebar"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Logo/Branding Area */}
            <div className="flex items-center justify-center h-16 bg-blue-900 dark:bg-gray-950 shadow-md">
                <div className="flex items-center space-x-2">
                    <Shield size={28} className="text-white" />
                    <h2 className="text-2xl font-extrabold tracking-wide text-white">FraudSense</h2>
                </div>
            </div>

            {/* Navigation List */}
            <nav className="mt-8 space-y-2"> {/* Added space-y-2 for vertical spacing between links */}
                <ul>
                    {/* Dashboard Link */}
                    <li>
                        <NavLink 
                            to="/dashboard" 
                            onClick={onClose} 
                            className={baseLinkClasses + " " + inactiveLinkClasses}
                            activeClassName={activeLinkClasses}
                        >
                            <LayoutDashboard size={20} className="mr-4" />
                            <span>Dashboard</span>
                        </NavLink>
                    </li>

                    {/* Alerts Link */}
                    <li>
                        <NavLink 
                            to="/alerts" 
                            onClick={onClose} 
                            className={baseLinkClasses + " " + inactiveLinkClasses}
                            activeClassName={activeLinkClasses}
                        >
                            <AlertTriangle size={20} className="mr-4" />
                            <span>Alerts</span>
                        </NavLink>
                    </li>

                    {/* Transactions Link */}
                    <li>
                        <NavLink 
                            to="/transactions" 
                            onClick={onClose} 
                            className={baseLinkClasses + " " + inactiveLinkClasses}
                            activeClassName={activeLinkClasses}
                        >
                            <ReceiptText size={20} className="mr-4" />
                            <span>Transactions</span>
                        </NavLink>
                    </li>

                    {/* Analytics Link */}
                    <li>
                        <NavLink 
                            to="/analytics" 
                            onClick={onClose} 
                            className={baseLinkClasses + " " + inactiveLinkClasses}
                            activeClassName={activeLinkClasses}
                        >
                            <BarChart3 size={20} className="mr-4" />
                            <span>Analytics</span>
                        </NavLink>
                    </li>

                    {/* ML Performance Link */}
                    <li>
                        <NavLink 
                            to="/ml-performance" 
                            onClick={onClose} 
                            className={baseLinkClasses + " " + inactiveLinkClasses}
                            activeClassName={activeLinkClasses}
                        >
                            <Brain size={20} className="mr-4" />
                            <span>ML Performance</span>
                        </NavLink>
                    </li>

                    {/* Reports Link - Admin Only */}
                    {isAdmin && (
                        <li>
                            <NavLink 
                                to="/reports" 
                                onClick={onClose} 
                                className={baseLinkClasses + " " + inactiveLinkClasses}
                                activeClassName={activeLinkClasses}
                            >
                                <FileText size={20} className="mr-4" />
                                <span>Reports</span>
                            </NavLink>
                        </li>
                    )}

                    {/* Conditional Links for Admin Role */}
                    {isAdmin && (
                        <>
                            {/* Rule Engine Link */}
                            <li>
                                <NavLink 
                                    to="/rules" 
                                    onClick={onClose} 
                                    className={baseLinkClasses + " " + inactiveLinkClasses}
                                    activeClassName={activeLinkClasses}
                                >
                                    <Wrench size={20} className="mr-4" />
                                    <span>Rule Engine</span>
                                </NavLink>
                            </li>

                            {/* Users Link */}
                            <li>
                                <NavLink 
                                    to="/users" 
                                    onClick={onClose} 
                                    className={baseLinkClasses + " " + inactiveLinkClasses}
                                    activeClassName={activeLinkClasses}
                                >
                                    <Users size={20} className="mr-4" />
                                    <span>Users</span>
                                </NavLink>
                            </li>
                        </>
                    )}

                    {/* Settings Link - Admin Only */}
                    {isAdmin && (
                        <li>
                            <NavLink 
                                to="/settings" 
                                onClick={onClose} 
                                className={baseLinkClasses + " " + inactiveLinkClasses}
                                activeClassName={activeLinkClasses}
                            >
                                <Settings size={20} className="mr-4" />
                                <span>Settings</span>
                            </NavLink>
                        </li>
                    )}

                    {/* Conditional Audit Logs Link for Admin Role */}
                    {isAdmin && (
                        <li>
                            <NavLink 
                                to="/audit-logs" 
                                onClick={onClose} 
                                className={baseLinkClasses + " " + inactiveLinkClasses}
                                activeClassName={activeLinkClasses}
                            >
                                <ScrollText size={20} className="mr-4" />
                                <span>Audit Logs</span>
                            </NavLink>
                        </li>
                    )}
                </ul>
            </nav>
        </div>
    );
};

export default SideNav;
