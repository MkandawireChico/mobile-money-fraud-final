// client/src/components/common/MessageBox.tsx
import React, { useEffect } from 'react';
import { Info, XCircle, CheckCircle, AlertTriangle, X } from 'lucide-react'; // Using lucide-react for icons

interface MessageBoxProps {
    message: string;
    type?: 'info' | 'error' | 'success' | 'warning';
    className?: string;
    onClose?: () => void; // Optional close handler function
    autoDismiss?: number; // Optional auto-dismiss time in milliseconds
    maxLength?: number; // Optional max character limit for message
}

const MessageBox: React.FC<MessageBoxProps> = ({
    message,
    type = 'info',
    className,
    onClose,
    autoDismiss,
    maxLength = 100,
}) => {
    if (!message) return null; // Don't render if there's no message

    let icon;
    let containerClasses = '';
    let textClasses = '';
    let iconClasses = '';
    const displayMessage = maxLength && message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;

    // Apply different styles based on the message type
    switch (type) {
        case 'error':
            icon = <XCircle className="h-6 w-6" />;
            containerClasses = 'bg-red-100 border-red-400';
            textClasses = 'text-red-700';
            iconClasses = 'text-red-500';
            break;
        case 'success':
            icon = <CheckCircle className="h-6 w-6" />;
            containerClasses = 'bg-green-100 border-green-400';
            textClasses = 'text-green-700';
            iconClasses = 'text-green-500';
            break;
        case 'warning':
            icon = <AlertTriangle className="h-6 w-6" />;
            containerClasses = 'bg-yellow-100 border-yellow-400';
            textClasses = 'text-yellow-700';
            iconClasses = 'text-yellow-500';
            break;
        case 'info':
        default:
            icon = <Info className="h-6 w-6" />;
            containerClasses = 'bg-blue-100 border-blue-400';
            textClasses = 'text-blue-700';
            iconClasses = 'text-blue-500';
            break;
    }

    // Auto-dismiss logic
    useEffect(() => {
        if (autoDismiss && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoDismiss);
            return () => clearTimeout(timer);
        }
    }, [autoDismiss, onClose]);

    return (
        <div
            className={`flex items-start p-4 rounded-lg shadow-md max-w-lg mx-auto ${containerClasses} ${className}`}
            role="alert"
        >
            <div className={`flex-shrink-0 mr-3 ${iconClasses}`}>
                {icon}
            </div>
            <div className={`flex-grow ${textClasses}`}>
                <p className="text-sm font-medium">{displayMessage}</p>
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2 focus:ring-opacity-50 inline-flex h-8 w-8 ${textClasses} hover:bg-opacity-80`}
                    aria-label="Close"
                >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" />
                </button>
            )}
        </div>
    );
};

export default MessageBox;