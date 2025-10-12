// src/components/TopBar.tsx
import React, { useContext } from 'react';
// Import Lucide React icons, replacing Material-UI icons
import { Menu, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext.tsx'; // Assuming AuthContext is correctly defined

interface TopBarProps {
    onMenuClick: () => void; // Callback to toggle the sidebar menu
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
    // Access authentication context to get user info and logout function
    const authContext = useContext(AuthContext);

    // Handles user logout
    const handleLogout = () => {
        authContext.logout();
    };

    return (
        // Main Header/App Bar Container:
        // - fixed: Stays at the top of the viewport
        // - top-0 left-0 right-0: Spans the full width
        // - bg-blue-900: Dark blue background for a strong brand presence
        // - text-white: White text for high contrast
        // - shadow-md: Adds a subtle shadow for depth
        // - z-30: Ensures it's above most content but below the sidebar (z-40 in SideNav)
        <header className="fixed top-0 left-0 right-0 h-16 bg-blue-900 text-white shadow-md z-30">
            {/* Toolbar equivalent: Flex container for aligning items */}
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left section: Menu Icon and potentially a brand name */}
                <div className="flex items-center">
                    {/* Menu Button: Visible primarily on smaller screens or to toggle a persistent sidebar */}
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                        aria-label="Open sidebar menu"
                    >
                        <Menu size={24} /> {/* Lucide Menu Icon */}
                    </button>
                    {/* Application Title */}
                    <h1 className="text-xl font-bold ml-4 tracking-wide">
                        Fraud Detection System
                    </h1>
                </div>

                {/* Right section: User info and Logout button */}
                <div className="flex items-center space-x-4">
                    {/* Display user's name and role if authenticated */}
                    {authContext.user && (
                        <p className="text-base text-gray-200 hidden md:block"> {/* Hidden on small, block on medium+ */}
                            Welcome, <span className="font-semibold">{authContext.user.name}</span> (<span className="capitalize">{authContext.user.role}</span>)
                        </p>
                    )}
                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-sm font-medium"
                    >
                        <LogOut size={18} className="mr-2" /> {/* Lucide Log Out Icon */}
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
