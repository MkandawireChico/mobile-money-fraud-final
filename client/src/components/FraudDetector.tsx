// src/components/FraudDetector.tsx
import React, { useState } from 'react';
import { AlertCircleIcon, CheckCircleIcon, RotateCw, Trash2 } from 'lucide-react'; // Added RotateCw for loading, Trash2 for clear button

// List of cities in Malawi for the dropdown
const cities = [
    'Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba', 'Karonga', 'Mangochi',
    'Salima', 'Kasungu', 'Nkhotakota', 'Chitipa', 'Nsanje', 'Dedza',
    'Ntcheu', 'Balaka', 'Machinga', 'Phalombe', 'Chikwawa', 'Thyolo',
    'Mulanje', 'Mwanza', 'Neno', 'Dowa', 'Mchinji', 'Nkhata Bay',
    'Rumphi', 'Mzimba', 'Likoma', 'Chiradzulu'
];

export default function FraudDetector() {
    // State to manage form input data
    const [formData, setFormData] = useState({
        amount: '',
        riskScore: '',
        timeSinceLastTxn: '',
        smsCount: '',
        locationCity: 'Blantyre', // Default city selected
        uniqueDevicesCount: '',
        amountDeviation: '',
        isNewDevice: false,
    });

    // State to store the fraud detection result
    const [result, setResult] = useState<boolean | null>(null);
    // State to indicate if an API call is in progress
    const [loading, setLoading] = useState(false);
    // State to manage form validation errors for each field
    const [errors, setErrors] = useState<Record<string, string>>({});
    // State to show a general message (e.g., API call failure)
    const [message, setMessage] = useState<string | null>(null);

    // Handles changes for all input fields (text, number, and checkbox)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type, checked } = e.target;
        // Update form data based on input type
        setFormData((prevData) => ({
            ...prevData,
            [id]: type === 'checkbox' ? checked : value,
        }));
        // Clear error for the specific field as user types
        setErrors((prevErrors) => ({
            ...prevErrors,
            [id]: '',
        }));
        setMessage(null); // Clear general message on input change
    };

    // Performs basic frontend validation before submitting the form
    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        // Required fields validation
        if (!formData.amount) {
            newErrors.amount = 'Amount is required.';
            isValid = false;
        } else if (parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be positive.';
            isValid = false;
        }

        if (!formData.riskScore) {
            newErrors.riskScore = 'Risk Score is required.';
            isValid = false;
        } else {
            const score = parseInt(formData.riskScore);
            if (isNaN(score) || score < 0 || score > 100) {
                newErrors.riskScore = 'Risk Score must be between 0 and 100.';
                isValid = false;
            }
        }

        if (!formData.timeSinceLastTxn) {
            newErrors.timeSinceLastTxn = 'Time Since Last Txn is required.';
            isValid = false;
        } else if (parseInt(formData.timeSinceLastTxn) < 0) {
            newErrors.timeSinceLastTxn = 'Time must be non-negative.';
            isValid = false;
        }

        if (!formData.smsCount) {
            newErrors.smsCount = 'SMS Count is required.';
            isValid = false;
        } else if (parseInt(formData.smsCount) < 0) {
            newErrors.smsCount = 'SMS Count cannot be negative.';
            isValid = false;
        }

        if (!formData.uniqueDevicesCount) {
            newErrors.uniqueDevicesCount = 'Unique Devices Count is required.';
            isValid = false;
        } else if (parseInt(formData.uniqueDevicesCount) <= 0) {
            newErrors.uniqueDevicesCount = 'Must be at least 1 unique device.';
            isValid = false;
        }

        if (!formData.amountDeviation) {
            newErrors.amountDeviation = 'Amount Deviation is required.';
            isValid = false;
        } else if (parseFloat(formData.amountDeviation) < 0) {
            newErrors.amountDeviation = 'Amount Deviation cannot be negative.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handles form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default form submission behavior
        setResult(null);    // Clear previous results
        setMessage(null);   // Clear previous messages

        // Run frontend validation
        if (!validateForm()) {
            setMessage('Please correct the errors in the form.');
            return; // Stop submission if validation fails
        }

        setLoading(true); // Indicate that an API call is in progress

        try {
            // Making the actual API call to your Flask backend
            const response = await fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(formData.amount),
                    riskScore: parseInt(formData.riskScore),
                    timeSinceLastTxn: parseInt(formData.timeSinceLastTxn),
                    smsCount: parseInt(formData.smsCount),
                    locationCity: formData.locationCity,
                    uniqueDevicesCount: parseInt(formData.uniqueDevicesCount),
                    amountDeviation: parseFloat(formData.amountDeviation),
                    isNewDevice: formData.isNewDevice,
                }),
            });

            // Check if the network response was successful
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setResult(data.isFraud); // Update result with API response
        } catch (error: any) {
            console.error("API call failed:", error);
            setMessage(error.message || "Failed to connect to the fraud detection service. Please ensure the backend is running.");
            setResult(null); // Clear result on error
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    // Clears all form fields and results
    const handleClearForm = () => {
        setFormData({
            amount: '',
            riskScore: '',
            timeSinceLastTxn: '',
            smsCount: '',
            locationCity: 'Blantyre',
            uniqueDevicesCount: '',
            amountDeviation: '',
            isNewDevice: false,
        });
        setResult(null);
        setErrors({});
        setMessage(null);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 font-sans">
            <div className="w-full max-w-xl shadow-lg rounded-xl bg-white dark:bg-gray-800 p-8">
                {/* Header Section */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Fraud Detector 🕵️</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Enter transaction details to check for potential fraud.
                    </p>
                </div>

                {/* General Message/Error Display */}
                {message && (
                    <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                        {message}
                    </div>
                )}

                {/* Fraud Detection Form */}
                <form onSubmit={handleSubmit} className="space-y-6"> {/* Increased spacing */}
                    {/* Input fields for Amount and Risk Score */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount (MWK)</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                                    MWK
                                </span>
                                <input
                                    id="amount"
                                    type="number"
                                    step="0.01" // Allow decimal amounts
                                    placeholder="e.g., 50000.00"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                                        errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                    required
                                    aria-invalid={errors.amount ? 'true' : 'false'}
                                    aria-describedby="amount-error"
                                />
                            </div>
                            {errors.amount && <p id="amount-error" className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                        </div>
                        {/* Risk Score Input */}
                        <div className="space-y-2">
                            <label htmlFor="riskScore" className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Score (0-100)</label>
                            <input
                                id="riskScore"
                                type="number"
                                placeholder="e.g., 85"
                                value={formData.riskScore}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                                    errors.riskScore ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                required
                                min="0" max="100" // HTML5 validation for range
                                aria-invalid={errors.riskScore ? 'true' : 'false'}
                                aria-describedby="riskScore-error"
                            />
                            {errors.riskScore && <p id="riskScore-error" className="text-red-500 text-xs mt-1">{errors.riskScore}</p>}
                        </div>
                    </div>

                    {/* Input fields for Time Since Last Txn and SMS Count */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Time Since Last Txn Input */}
                        <div className="space-y-2">
                            <label htmlFor="timeSinceLastTxn" className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Since Last Txn (seconds)</label>
                            <input
                                id="timeSinceLastTxn"
                                type="number"
                                placeholder="e.g., 60"
                                value={formData.timeSinceLastTxn}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                                    errors.timeSinceLastTxn ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                required
                                min="0" // HTML5 validation for non-negative
                                aria-invalid={errors.timeSinceLastTxn ? 'true' : 'false'}
                                aria-describedby="timeSinceLastTxn-error"
                            />
                            {errors.timeSinceLastTxn && <p id="timeSinceLastTxn-error" className="text-red-500 text-xs mt-1">{errors.timeSinceLastTxn}</p>}
                        </div>
                        {/* SMS Count Input */}
                        <div className="space-y-2">
                            <label htmlFor="smsCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Count</label>
                            <input
                                id="smsCount"
                                type="number"
                                placeholder="e.g., 1"
                                value={formData.smsCount}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                                    errors.smsCount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                required
                                min="0" // HTML5 validation for non-negative
                                aria-invalid={errors.smsCount ? 'true' : 'false'}
                                aria-describedby="smsCount-error"
                            />
                            {errors.smsCount && <p id="smsCount-error" className="text-red-500 text-xs mt-1">{errors.smsCount}</p>}
                        </div>
                    </div>

                    {/* Input fields for Location City and Unique Devices Count */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Location City Select */}
                        <div className="space-y-2 relative">
                            <label htmlFor="locationCity" className="text-sm font-medium text-gray-700 dark:text-gray-300">Location City</label>
                            <select
                                id="locationCity"
                                value={formData.locationCity}
                                onChange={handleInputChange} // Consolidated handler
                                className={`w-full px-3 py-2 border rounded-md appearance-none focus:outline-none focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                                    errors.locationCity ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                required
                                aria-invalid={errors.locationCity ? 'true' : 'false'}
                                aria-describedby="locationCity-error"
                            >
                                {cities.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            {/* Custom dropdown arrow */}
                            <div className="pointer-events-none absolute inset-y-0 right-0 top-7 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                            {errors.locationCity && <p id="locationCity-error" className="text-red-500 text-xs mt-1">{errors.locationCity}</p>}
                        </div>
                        {/* Unique Devices Count Input */}
                        <div className="space-y-2">
                            <label htmlFor="uniqueDevicesCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Unique Devices Count</label>
                            <input
                                id="uniqueDevicesCount"
                                type="number"
                                placeholder="e.g., 1"
                                value={formData.uniqueDevicesCount}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                                    errors.uniqueDevicesCount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                required
                                min="1" // HTML5 validation for minimum value
                                aria-invalid={errors.uniqueDevicesCount ? 'true' : 'false'}
                                aria-describedby="uniqueDevicesCount-error"
                            />
                            {errors.uniqueDevicesCount && <p id="uniqueDevicesCount-error" className="text-red-500 text-xs mt-1">{errors.uniqueDevicesCount}</p>}
                        </div>
                    </div>

                    {/* Input fields for Amount Deviation and New Device checkbox */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start"> {/* Align items to start */}
                        {/* Amount Deviation Input */}
                        <div className="space-y-2">
                            <label htmlFor="amountDeviation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Deviation</label>
                            <input
                                id="amountDeviation"
                                type="number"
                                step="0.01" // Allow decimal deviations
                                placeholder="e.g., 15000"
                                value={formData.amountDeviation}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                                    errors.amountDeviation ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                required
                                min="0" // HTML5 validation for non-negative
                                aria-invalid={errors.amountDeviation ? 'true' : 'false'}
                                aria-describedby="amountDeviation-error"
                            />
                            {errors.amountDeviation && <p id="amountDeviation-error" className="text-red-500 text-xs mt-1">{errors.amountDeviation}</p>}
                        </div>
                        {/* Is New Device Checkbox */}
                        <div className="flex items-center pt-8"> {/* Added padding top to align with other inputs */}
                            <input
                                type="checkbox"
                                id="isNewDevice"
                                checked={formData.isNewDevice}
                                onChange={handleInputChange} // Consolidated handler
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                aria-checked={formData.isNewDevice}
                            />
                            <label htmlFor="isNewDevice" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Is New Device?</label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {/* Clear Form Button */}
                        <button
                            type="button" // Important: type="button" to prevent form submission
                            onClick={handleClearForm}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200 flex items-center"
                        >
                            <Trash2 size={16} className="mr-2" /> Clear Form
                        </button>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="px-6 py-2 text-lg text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            disabled={loading} // Disable button when loading
                        >
                            {loading ? (
                                <>
                                    <RotateCw size={20} className="animate-spin" /> {/* Loading spinner */}
                                    <span>Checking...</span>
                                </>
                            ) : (
                                <span>Check for Fraud</span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Result Display Section */}
                <div className="mt-8">
                    {result !== null && (
                        <div
                            className={`p-5 rounded-lg text-center transition-all duration-300 ease-in-out transform scale-105 ${
                                result ? 'bg-red-600 text-white shadow-xl' : 'bg-green-600 text-white shadow-xl'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-3 mb-2">
                                {result ? (
                                    <AlertCircleIcon className="h-8 w-8 text-white animate-pulse" /> // Alert icon with pulse animation
                                ) : (
                                    <CheckCircleIcon className="h-8 w-8 text-white" /> // Check icon
                                )}
                                <h3 className="font-extrabold text-2xl">
                                    {result ? 'Potential Fraud Detected! 🚨' : 'Transaction is Legitimate ✅'}
                                </h3>
                            </div>
                            <p className="mt-2 text-base">
                                {result
                                    ? 'This transaction has been flagged as high-risk. Further investigation is recommended.'
                                    : 'This transaction appears to be safe based on the provided data.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
