// client/src/components/common/NotificationSnackBar.tsx
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'; // Using lucide-react for icons
import clsx from 'clsx'; // For conditional class joining

export interface SnackBarRef {
    openSnackBar: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
}

const NotificationSnackBar = forwardRef<SnackBarRef, { position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left' }>(
    ({ position = 'bottom-right' }, ref) => {
        const [open, setOpen] = useState(false);
        const [message, setMessage] = useState('');
        const [type, setType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
        const [duration, setDuration] = useState(3000); // Default duration
        const [progress, setProgress] = useState(100); // Progress bar percentage

        // Expose openSnackBar function to parent components via ref
        useImperativeHandle(ref, () => ({
            openSnackBar: (msg, type = 'info', dur = 3000) => {
                setMessage(msg);
                setType(type);
                setDuration(dur);
                setProgress(100);
                setOpen(true);
            },
        }));

        useEffect(() => {
            let timer: NodeJS.Timeout;
            let intervalId: NodeJS.Timeout;
            if (open) {
                const startTime = Date.now();
                intervalId = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const newProgress = Math.max(0, 100 - ((elapsed / duration) * 100));
                    setProgress(newProgress);
                    if (newProgress <= 0) {
                        clearInterval(intervalId);
                        setOpen(false);
                    }
                }, 50);
                timer = setTimeout(() => {
                    setOpen(false);
                }, duration);
            }
            return () => {
                clearTimeout(timer);
                if (intervalId) clearInterval(intervalId);
            };
        }, [open, duration]);

        const handleClose = () => {
            setOpen(false);
        };

        let icon;
        let snackbarClasses = '';
        let iconClasses = '';

        // Determine styling based on the notification type
        switch (type) {
            case 'success':
                icon = <CheckCircle className="h-5 w-5" />;
                snackbarClasses = 'bg-green-600';
                iconClasses = 'text-green-200';
                break;
            case 'error':
                icon = <XCircle className="h-5 w-5" />;
                snackbarClasses = 'bg-red-600';
                iconClasses = 'text-red-200';
                break;
            case 'warning':
                icon = <AlertTriangle className="h-5 w-5" />;
                snackbarClasses = 'bg-yellow-600';
                iconClasses = 'text-yellow-200';
                break;
            case 'info':
            default:
                icon = <Info className="h-5 w-5" />;
                snackbarClasses = 'bg-blue-600';
                iconClasses = 'text-blue-200';
                break;
        }

        return (
            <div
                className={clsx(
                    "fixed z-50 transition-all duration-300 transform",
                    open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none",
                    position === 'bottom-right' && 'bottom-6 right-6',
                    position === 'top-right' && 'top-6 right-6',
                    position === 'bottom-left' && 'bottom-6 left-6',
                    position === 'top-left' && 'top-6 left-6'
                )}
            >
                <div
                    className={`flex items-center w-full max-w-xs p-4 rounded-lg shadow-lg text-white ${snackbarClasses}`}
                    role="alert"
                >
                    <div className={`flex-shrink-0 ${iconClasses}`}>
                        {icon}
                    </div>
                    <div className="ml-3 text-sm font-medium flex-grow">
                        {message}
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-white hover:text-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-opacity-80 inline-flex h-8 w-8"
                        aria-label="Close"
                    >
                        <span className="sr-only">Close</span>
                        <X className="h-5 w-5" />
                    </button>
                    <div
                        className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-50"
                        style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
                    />
                </div>
            </div>
        );
    }
);

export default NotificationSnackBar;