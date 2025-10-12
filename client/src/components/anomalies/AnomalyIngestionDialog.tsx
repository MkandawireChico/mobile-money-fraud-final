import React, { useState, useEffect } from 'react';
// Import Lucide React icons for a modern and consistent look
import {
    UploadCloud as CloudUploadIcon,
    CheckCircle as CheckCircleIcon,
    X as CloseIcon,
    AlertCircle as ErrorOutlineIcon, // Using AlertCircle for error messages
    Loader2, // For loading spinner
    Info as InfoIcon, // For general info messages
    AlertTriangle as WarningIcon, // For warning messages
} from 'lucide-react';
import api from '../../api/axios.ts';
import clsx from 'clsx'; // Utility for conditionally joining class names

interface AnomalyIngestionDialogProps { // Renamed interface
    open: boolean;
    onClose: (ingestedSuccessfully?: boolean) => void;
    onIngestionSuccess?: () => void;
}

const AnomalyIngestionDialog: React.FC<AnomalyIngestionDialogProps> = ({ open, onClose, onIngestionSuccess }) => { // Renamed component
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

    // Reset state when the dialog is closed
    useEffect(() => {
        if (!open) {
            setSelectedFile(null);
            setLoading(false);
            setUploadProgress(0);
            setSnackbarOpen(false); // Close snackbar on dialog close
            setSnackbarSeverity('info'); // Reset severity
        }
    }, [open]);

    // Handles file selection and basic validation
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            if (file.type !== 'text/csv') {
                showSnackbar('Please upload a CSV file.', 'error');
                setSelectedFile(null); // Clear selected file if invalid
                return;
            }
            setSelectedFile(file);
        } else {
            setSelectedFile(null); // Clear selected file if no file chosen
        }
    };

    // Handles the file upload process
    const handleUpload = async () => {
        if (!selectedFile) {
            showSnackbar('No file selected for upload.', 'error');
            return;
        }

        setLoading(true); // Start loading indicator
        setUploadProgress(0); // Reset progress
        setSnackbarOpen(false); // Hide any previous snackbar

        const formData = new FormData();
        formData.append('anomalies_csv', selectedFile); // Changed field name if backend expects 'anomalies_csv'

        try {
            // Updated API endpoint from /alerts/ingest to /anomalies/ingest
            await api.post('/anomalies/ingest', formData, {
                headers: {
                    // Content-Type will be automatically set to multipart/form-data by Axios
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                },
            });

            showSnackbar('Anomalies ingested successfully!', 'success'); // Updated snackbar message
            setSelectedFile(null); // Clear file after successful upload
            setUploadProgress(0); // Reset progress bar
            onClose(true); // Close dialog and indicate success
            if (onIngestionSuccess) {
                onIngestionSuccess(); // Trigger parent's success callback
            }
        } catch (error: any) {
            console.error('Error ingesting CSV:', error.response?.data || error.message);
            showSnackbar(`Anomaly Ingestion failed: ${error.response?.data?.message || error.message}`, 'error'); // Updated snackbar message
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };

    // Helper function to show a snackbar notification
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // Handles closing the snackbar
    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    // Helper function to get the appropriate icon for the snackbar severity
    const getSnackbarIcon = (severity: 'success' | 'error' | 'info' | 'warning') => {
        switch (severity) {
            case 'success': return <CheckCircleIcon size={20} />;
            case 'error': return <ErrorOutlineIcon size={20} />;
            case 'info': return <InfoIcon size={20} />;
            case 'warning': return <WarningIcon size={20} />;
            default: return null;
        }
    };

    // Helper function to get the appropriate color class for the snackbar severity
    const getSnackbarColorClass = (severity: 'success' | 'error' | 'info' | 'warning') => {
        switch (severity) {
            case 'success': return 'bg-green-500 text-white';
            case 'error': return 'bg-red-500 text-white';
            case 'info': return 'bg-blue-500 text-white';
            case 'warning': return 'bg-yellow-500 text-white';
            default: return '';
        }
    };


    return (
        <>
            {/* Custom Dialog / Modal */}
            {open && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm sm:max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                        {/* Dialog Title */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ingest Anomaly Data (CSV)</h2> {/* Updated text */}
                            <button
                                onClick={() => onClose()}
                                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                                aria-label="Close dialog"
                            >
                                <CloseIcon size={20} />
                            </button>
                        </div>

                        {/* Dialog Content */}
                        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Upload a CSV file containing anomaly data. The file should have columns matching your anomaly schema (e.g., `id`, `transaction_id`, `rule_name`, `severity`, `status`, etc.). {/* Updated text */}
                            </p>

                            <input
                                accept=".csv"
                                className="hidden" // Hide the default file input
                                id="anomaly-csv-file-upload" // Updated ID
                                type="file"
                                onChange={handleFileChange}
                                name="anomalies_csv" // Changed name to match potential backend expectation
                            />
                            <label htmlFor="anomaly-csv-file-upload" className="block cursor-pointer"> {/* Updated htmlFor */}
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-6 text-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                                    <CloudUploadIcon size={60} className="mx-auto text-gray-500 dark:text-gray-400" />
                                    <p className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        {selectedFile ? selectedFile.name : 'Drag & Drop CSV or Click to Browse'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Max file size: 10MB (.csv only)
                                    </p>
                                </div>
                            </label>

                            {/* Progress Bar */}
                            {loading && (
                                <div className="mt-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">{uploadProgress}%</p>
                                </div>
                            )}

                            {/* Upload Status Message */}
                            {!loading && uploadProgress === 100 && snackbarSeverity === 'success' && (
                                <div className="mt-4 flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                                    <CheckCircleIcon size={24} />
                                    <p className="text-lg font-medium">Upload Complete!</p>
                                </div>
                            )}
                        </div>

                        {/* Dialog Actions */}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => onClose()}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || loading}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin mr-2" /> Uploading...
                                    </>
                                ) : (
                                    <>
                                        <CloudUploadIcon size={18} className="mr-2" /> Upload & Ingest
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Snackbar for notifications */}
            {snackbarOpen && (
                <div
                    className={clsx(
                        "fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-xl flex items-center space-x-3 z-50 transition-all duration-300",
                        getSnackbarColorClass(snackbarSeverity)
                    )}
                    role="alert"
                >
                    {getSnackbarIcon(snackbarSeverity)}
                    <p className="text-sm font-medium">{snackbarMessage}</p>
                    <button
                        onClick={handleSnackbarClose}
                        className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
                        aria-label="Close notification"
                    >
                        <CloseIcon size={16} />
                    </button>
                </div>
            )}
        </>
    );
};

export default AnomalyIngestionDialog;
