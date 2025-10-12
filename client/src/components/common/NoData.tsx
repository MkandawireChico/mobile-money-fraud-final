// client/src/components/common/NoData.tsx
import React from 'react';
import { Frown, RefreshCw } from 'lucide-react'; // Using lucide-react for icons

interface NoDataProps {
    message?: string;
    className?: string;
    icon?: React.ReactNode; // Optional custom icon
    actionText?: string; // Optional action button text
    onAction?: () => void; // Optional action handler
}

const NoData: React.FC<NoDataProps> = ({
    message = 'No data available.',
    className,
    icon = <Frown className="h-12 w-12 mb-4 text-gray-400" />,
    actionText,
    onAction,
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg shadow-sm text-gray-600 ${className}`}>
            <div className="mb-4">{icon}</div> {/* Customizable icon */}
            <p className="text-lg font-semibold">{message}</p>
            <p className="text-sm text-gray-500 mt-1">Please try again later or adjust your filters.</p>
            {actionText && onAction && (
                <button
                    onClick={onAction}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {actionText}
                </button>
            )}
        </div>
    );
};

export default NoData;