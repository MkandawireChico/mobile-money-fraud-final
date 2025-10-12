// client/src/components/common/Loader.tsx
import React from 'react';

interface LoaderProps {
    className?: string;
    size?: 'small' | 'medium' | 'large';
    color?: 'blue' | 'green' | 'red' | 'gray';
    showText?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ className, size = 'medium', color = 'blue', showText = false }) => {
    let loaderSizeClasses = '';
    let spinnerBorderClasses = '';
    let borderColorClasses = '';

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
            spinnerBorderClasses = 'border-3';
            break;
    }

    switch (color) {
        case 'green':
            borderColorClasses = 'border-t-green-500 border-r-green-500 border-b-green-500 border-l-gray-200';
            break;
        case 'red':
            borderColorClasses = 'border-t-red-500 border-r-red-500 border-b-red-500 border-l-gray-200';
            break;
        case 'gray':
            borderColorClasses = 'border-t-gray-500 border-r-gray-500 border-b-gray-500 border-l-gray-200';
            break;
        case 'blue':
        default:
            borderColorClasses = 'border-t-blue-500 border-r-blue-500 border-b-blue-500 border-l-gray-200';
            break;
    }

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div
                className={`animate-spin rounded-full ${spinnerBorderClasses} ${borderColorClasses} ${loaderSizeClasses}`}
                role="status"
            >
                <span className="sr-only">Loading...</span>
            </div>
            {showText && <p className="ml-2 text-gray-600">Loading...</p>}
        </div>
    );
};

export default Loader;