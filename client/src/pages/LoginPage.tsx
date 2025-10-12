// client/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

// Import Lucide React icons for a modern and consistent look
import { Loader2, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import clsx from 'clsx'; // Utility for conditionally joining class names

const LoginPage: React.FC = () => {
    const history = useHistory();
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // Handles the form submission for login
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        // Basic client-side validation
        if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');
            return;
        }

        try {
            await login(email, password);
            history.push('/dashboard');
        } catch (err: any) {
            console.error('Login component caught error during login attempt:', err);

            let errorMessage = 'Login failed. Please check your credentials.';
            if (err.response?.data?.message) {
                if (typeof err.response.data.message === 'string') {
                    errorMessage = err.response.data.message;
                } else if (typeof err.response.data.message === 'object') {
                    try {
                        errorMessage = JSON.stringify(err.response.data.message);
                    } catch (e) {
                        errorMessage = 'An unknown error occurred during login.';
                    }
                }
            } else if (err.message && typeof err.message === 'string') {
                errorMessage = err.message;
            }

            console.log('Setting error:', errorMessage);
            setError(errorMessage);
        }
    };

    return (
        // The outer div with min-h-screen, flex, justify-center, items-center, bg-gray-100 is now handled by AuthLayout.tsx
        // This component focuses purely on the content *inside* the authentication card.
        <div className="w-full"> {/* Ensures this content takes full width within the AuthLayout card */}
            <div className="mb-8 flex flex-col items-center text-center">
                <Lock size={72} className="text-blue-600 dark:text-blue-400 mb-6 drop-shadow-lg" /> {/* Increased icon size */}
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-3 tracking-tight">Sign In To</h1>
                <p className="text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400">Mobile Money Fraud Detection</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-6"> {/* Adjusted space-y for better spacing */}
                <div>
                    <label htmlFor="email" className="block text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Email Address</label> {/* Adjusted label spacing */}
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
                            "w-full px-5 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl",
                            "focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 focus:border-transparent",
                            "disabled:bg-gray-100 dark:disabled:bg-gray-700",
                            "dark:bg-gray-700 dark:text-gray-100 text-gray-900 placeholder-gray-500 dark:placeholder-gray-400",
                            "text-lg shadow-sm transition-all duration-200 ease-in-out"
                        )}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Password</label> {/* Adjusted label spacing */}
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className={clsx(
                                "w-full px-5 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl pr-14", // Increased right padding for eye icon
                                "focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 focus:border-transparent",
                                "disabled:bg-gray-100 dark:disabled:bg-gray-700",
                                "dark:bg-gray-700 dark:text-gray-100 text-gray-900 placeholder-gray-500 dark:placeholder-gray-400",
                                "text-lg shadow-sm transition-all duration-200 ease-in-out"
                            )}
                            placeholder="Enter your password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={clsx(
                                "absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 dark:text-gray-400",
                                "hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
                                "rounded-r-xl transition-colors duration-200"
                            )}
                            disabled={isLoading}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 text-base sm:text-lg text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-100 rounded-xl border-2 border-red-300 dark:border-red-700 animate-fade-in" role="alert">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className={clsx(
                        "w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg",
                        "hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800",
                        "disabled:bg-blue-400 dark:disabled:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-blue-800",
                        "transition-all duration-200 flex items-center justify-center text-xl sm:text-2xl transform hover:-translate-y-0.5"
                    )}
                    disabled={isLoading || !email.trim() || !password.trim()}
                >
                    {isLoading ? (
                        <span className="flex items-center">
                            <Loader2 size={28} className="animate-spin mr-3" />
                            Logging in...
                        </span>
                    ) : (
                        'Sign In'
                    )}
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-center text-base sm:text-lg space-y-3 sm:space-y-0 mt-6"> {/* Adjusted space-y */}
                    <Link to="/password-reset-request" className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200">Forgot password?</Link>
                    <Link to="/contact-admin" className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200">Don't have an account? Contact Admin</Link>
                </div>
                
                {/* Additional Recovery Options */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Admin or Analyst? Need account recovery?
                        </p>
                        <Link 
                            to="/account-recovery" 
                            className="inline-flex items-center text-sm text-amber-600 dark:text-amber-400 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
                        >
                            <Shield size={16} className="mr-1" />
                            Account Recovery (OTP)
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;