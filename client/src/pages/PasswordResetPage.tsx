import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { 
    Lock, 
    Eye, 
    EyeOff, 
    CheckCircle, 
    AlertCircle, 
    Loader2,
    Shield,
    ArrowLeft
} from 'lucide-react';
import clsx from 'clsx';
import api from '../api/axios.ts';

const PasswordResetPage: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const [token, setToken] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        // Extract token from URL query parameters
        const urlParams = new URLSearchParams(location.search);
        const resetToken = urlParams.get('token');
        
        if (resetToken) {
            setToken(resetToken);
        } else {
            setError('Invalid reset link. Please request a new password reset.');
        }
    }, [location]);

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return errors;
    };

    const handlePasswordChange = (password: string) => {
        setNewPassword(password);
        const errors = validatePassword(password);
        setValidationErrors(errors);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        if (!token) {
            setError('Invalid reset token. Please request a new password reset.');
            return;
        }

        if (!newPassword || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            setError('Please fix the password requirements below.');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/recovery/reset-password', {
                token,
                newPassword
            });
            setIsSuccess(true);
        } catch (err: any) {
            console.error('Password reset error:', err);
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <CheckCircle size={64} className="text-green-600 dark:text-green-400 mx-auto mb-6" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            Password Reset Successful
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            Your password has been successfully reset. You can now log in with your new password.
                        </p>
                        
                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                For security reasons, all existing sessions have been terminated. 
                                Please log in again with your new password.
                            </p>
                        </div>

                        <button
                            onClick={() => history.push('/login')}
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-colors duration-200"
                        >
                            Continue to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="text-center mb-8">
                    <button
                        onClick={() => history.push('/login')}
                        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors duration-200"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Login
                    </button>
                    
                    <Shield size={64} className="text-blue-600 dark:text-blue-400 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Set New Password
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Please enter your new password below.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* New Password */}
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                disabled={isLoading}
                                className={clsx(
                                    "w-full pl-10 pr-12 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg",
                                    "focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 focus:border-transparent",
                                    "disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed",
                                    "dark:bg-gray-700 dark:text-gray-100 text-gray-900 placeholder-gray-500 dark:placeholder-gray-400",
                                    "transition-all duration-200"
                                )}
                                placeholder="Enter new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                className={clsx(
                                    "w-full pl-10 pr-12 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg",
                                    "focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 focus:border-transparent",
                                    "disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed",
                                    "dark:bg-gray-700 dark:text-gray-100 text-gray-900 placeholder-gray-500 dark:placeholder-gray-400",
                                    "transition-all duration-200"
                                )}
                                placeholder="Confirm new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                disabled={isLoading}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    {newPassword && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Password Requirements:
                            </h4>
                            <ul className="space-y-1">
                                {[
                                    { text: 'At least 8 characters', valid: newPassword.length >= 8 },
                                    { text: 'One uppercase letter', valid: /[A-Z]/.test(newPassword) },
                                    { text: 'One lowercase letter', valid: /[a-z]/.test(newPassword) },
                                    { text: 'One number', valid: /[0-9]/.test(newPassword) },
                                    { text: 'One special character', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) }
                                ].map((req, index) => (
                                    <li key={index} className="flex items-center text-xs">
                                        <CheckCircle 
                                            size={14} 
                                            className={clsx(
                                                "mr-2",
                                                req.valid 
                                                    ? "text-green-600 dark:text-green-400" 
                                                    : "text-gray-400 dark:text-gray-500"
                                            )} 
                                        />
                                        <span className={clsx(
                                            req.valid 
                                                ? "text-green-700 dark:text-green-300" 
                                                : "text-gray-600 dark:text-gray-400"
                                        )}>
                                            {req.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Error Messages */}
                    {error && (
                        <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                            <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !newPassword || !confirmPassword || validationErrors.length > 0}
                        className={clsx(
                            "w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg",
                            "hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2",
                            "disabled:bg-blue-400 dark:disabled:bg-blue-700 disabled:cursor-not-allowed",
                            "transition-all duration-200 flex items-center justify-center"
                        )}
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <Loader2 size={20} className="animate-spin mr-2" />
                                Resetting Password...
                            </span>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordResetPage;
