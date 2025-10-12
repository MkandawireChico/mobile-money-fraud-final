// client/src/components/common/Loader.tsx
import React from 'react';

interface LoaderProps {
    className?: string;
    size?: 'small' | 'medium' | 'large';
}

const Loader: React.FC<LoaderProps> = ({ className, size = 'medium' }) => {
    let loaderSizeClasses = '';
    let spinnerBorderClasses = '';

    // Determine loader size and border thickness based on 'size' prop
    switch (size) {
        case 'small':
            loaderSizeClasses = 'w-6 h-6';
            spinnerBorderClasses = 'border-2';
            break;
        case 'large':
            loaderSizeClasses = 'w-16 h-16';
            spinnerBorderClasses = 'border-4';
            break;
        case 'medium':
        default:
            loaderSizeClasses = 'w-10 h-10';
            spinnerBorderClasses = 'border-3'; // Custom border width if needed, or adjust to 2 or 4
            break;
    }

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div
                className={`animate-spin rounded-full ${spinnerBorderClasses} border-t-blue-500 border-r-blue-500 border-b-blue-500 border-l-gray-200 ${loaderSizeClasses}`}
                role="status"
            >
                <span className="sr-only">Loading...</span> {/* Accessible text for screen readers */}
            </div>
        </div>
    );
};

export default Loader;
