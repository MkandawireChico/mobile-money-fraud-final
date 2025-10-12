import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { 
    Mail, 
    ArrowLeft, 
    Shield, 
    Clock, 
    CheckCircle, 
    AlertCircle,
    Loader2,
    X,
    UserX,
    ExternalLink
} from 'lucide-react';
import clsx from 'clsx';
import api from '../api/axios.ts';

const PasswordResetRequestPage: React.FC = () => {
    const history = useHistory();
    const [email, setEmail] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showContactAdminModal, setShowContactAdminModal] = useState<boolean>(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!email.trim()) {
            setError('Email address is required.');
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/recovery/initiate-reset', { email: email.trim() });
            setIsSuccess(true);
        } catch (err: any) {
            console.error('Password reset request error:', err);
            const errorMessage = err.response?.data?.message || 'Failed to send reset email. Please try again.';
            
            // Check if this is an analyst restriction error
            if (err.response?.status === 403 && err.response?.data?.contactAdmin) {
                setError(errorMessage);
                // Show custom styled modal instead of browser confirm
                setTimeout(() => {
                    setShowContactAdminModal(true);
                }, 500);
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToContactAdmin = () => {
        setShowContactAdminModal(false);
        history.push('/contact-admin');
    };

    const handleCloseModal = () => {
        setShowContactAdminModal(false);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <CheckCircle size={64} className="text-green-600 dark:text-green-400 mx-auto mb-6" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            Check Your Email
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            If an account with that email exists, we've sent you a password reset link. 
                            Please check your email and follow the instructions.
                        </p>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <Clock size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                        Reset Link Expires in 30 Minutes
                                    </p>
                                    <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                                        For security reasons, the reset link will expire after 30 minutes.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => history.push('/login')}
                                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-colors duration-200"
                            >
                                Back to Login
                            </button>
                            
                            <button
                                onClick={() => {
                                    setIsSuccess(false);
                                    setEmail('');
                                }}
                                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors duration-200"
                            >
                                Send Another Reset Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Custom Contact Admin Modal
    const ContactAdminModal = () => {
        if (!showContactAdminModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-t-2xl relative">
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors duration-200"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-full">
                                <UserX size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Access Restricted</h3>
                                <p className="text-amber-100 text-sm">Analyst Account Limitation</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="mb-6">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                Password reset is not available for analyst accounts. This is a security measure to ensure proper administrative oversight.
                            </p>
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                    💡 What you can do:
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Contact your system administrator who can reset your password or provide alternative access methods.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            <button
                                onClick={handleGoToContactAdmin}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 flex items-center justify-center space-x-2"
                            >
                                <ExternalLink size={18} />
                                <span>Contact Admin</span>
                            </button>
                            <button
                                onClick={handleCloseModal}
                                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <ContactAdminModal />
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
                        Reset Password
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className={clsx(
                                    "w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg",
                                    "focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 focus:border-transparent",
                                    "disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed",
                                    "dark:bg-gray-700 dark:text-gray-100 text-gray-900 placeholder-gray-500 dark:placeholder-gray-400",
                                    "transition-all duration-200"
                                )}
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                            <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !email.trim()}
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
                                Sending Reset Email...
                            </span>
                        ) : (
                            'Send Reset Email'
                        )}
                    </button>
                </form>

                {/* Additional Options */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Need additional help?
                        </p>
                        <div className="space-y-2">
                            <Link
                                to="/account-recovery"
                                className="block text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                Account Recovery (Admin/Analyst)
                            </Link>
                            <Link
                                to="/contact-admin"
                                className="block text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                Contact System Administrator
                            </Link>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </>
    );
};

export default PasswordResetRequestPage;
