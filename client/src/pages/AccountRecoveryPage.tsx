import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { 
    Shield, 
    Mail, 
    Key, 
    ArrowLeft, 
    CheckCircle, 
    AlertCircle, 
    Loader2,
    Clock,
    User,
    AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import api from '../api/axios.ts';

interface RecoveryStep {
    step: 'email' | 'otp' | 'success';
}

const AccountRecoveryPage: React.FC = () => {
    const history = useHistory();
    const [currentStep, setCurrentStep] = useState<RecoveryStep['step']>('email');
    const [email, setEmail] = useState<string>('');
    const [employeeId, setEmployeeId] = useState<string>('');
    const [otp, setOtp] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [recoveryToken, setRecoveryToken] = useState<string>('');
    const [user, setUser] = useState<any>(null);

    const handleRequestOTP = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!email.trim() || !employeeId.trim()) {
            setError('Email and Employee ID are required.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/recovery/generate-otp', {
                email: email.trim(),
                employeeId: employeeId.trim()
            });

            console.log('OTP generation response:', response.data);
            setCurrentStep('otp');
        } catch (err: any) {
            console.error('OTP generation error:', err);
            setError(err.response?.data?.message || 'Failed to generate OTP. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!otp.trim()) {
            setError('OTP is required.');
            setIsLoading(false);
            return;
        }

        if (otp.length !== 6) {
            setError('OTP must be 6 digits.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/recovery/verify-otp', {
                email: email.trim(),
                otp: otp.trim(),
                employeeId: employeeId.trim()
            });

            console.log('OTP verification response:', response.data);
            setRecoveryToken(response.data.recoveryToken);
            setUser(response.data.user);
            
            // Store recovery token for temporary access
            localStorage.setItem('recoveryToken', response.data.recoveryToken);
            localStorage.setItem('recoveryUser', JSON.stringify(response.data.user));
            
            setCurrentStep('success');
        } catch (err: any) {
            console.error('OTP verification error:', err);
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProceedToDashboard = () => {
        // Redirect to dashboard with recovery token
        window.location.href = '/dashboard?recovery=true';
    };

    const renderEmailStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <Shield size={64} className="text-amber-600 dark:text-amber-400 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Account Recovery
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    For Administrator accounts only. Enter your credentials to receive an OTP.
                </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                    <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Administrator Account Recovery Only
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            This recovery method is restricted to Administrator accounts only. 
                            Analysts should contact their system administrator for assistance.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleRequestOTP} className="space-y-6">
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
                                "focus:outline-none focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-700 focus:border-transparent",
                                "disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed",
                                "dark:bg-gray-700 dark:text-gray-100 text-gray-900 placeholder-gray-500 dark:placeholder-gray-400",
                                "transition-all duration-200"
                            )}
                            placeholder="Enter your work email"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="employeeId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Employee ID
                    </label>
                    <div className="relative">
                        <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            id="employeeId"
                            name="employeeId"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            disabled={isLoading}
                            className={clsx(
                                "w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg",
                                "focus:outline-none focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-700 focus:border-transparent",
                                "disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed",
                                "dark:bg-gray-700 dark:text-gray-100 text-gray-900 placeholder-gray-500 dark:placeholder-gray-400",
                                "transition-all duration-200"
                            )}
                            placeholder="Enter your Employee ID (e.g., EMP001)"
                            required
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Your Employee ID as registered in the HR system
                    </p>
                </div>

                {error && (
                    <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                        <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !email.trim() || !employeeId.trim()}
                    className={clsx(
                        "w-full py-3 bg-amber-600 text-white font-semibold rounded-lg shadow-lg",
                        "hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300 focus:ring-offset-2",
                        "disabled:bg-amber-400 dark:disabled:bg-amber-700 disabled:cursor-not-allowed",
                        "transition-all duration-200 flex items-center justify-center"
                    )}
                >
                    {isLoading ? (
                        <span className="flex items-center">
                            <Loader2 size={20} className="animate-spin mr-2" />
                            Sending OTP...
                        </span>
                    ) : (
                        'Send Recovery OTP'
                    )}
                </button>
            </form>
        </div>
    );

    const renderOTPStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <Key size={64} className="text-blue-600 dark:text-blue-400 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Enter OTP
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    We've sent a 6-digit code to <strong>{email}</strong>
                </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                    <Clock size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            OTP Valid for 10 Minutes
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                            Please enter the 6-digit code sent to your email. Check your spam folder if you don't see it.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                    <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        6-Digit OTP
                    </label>
                    <input
                        type="text"
                        id="otp"
                        name="otp"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        disabled={isLoading}
                        className={clsx(
                            "w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl font-mono tracking-widest",
                            "focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 focus:border-transparent",
                            "disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed",
                            "dark:bg-gray-700 dark:text-gray-100 text-gray-900 placeholder-gray-500 dark:placeholder-gray-400",
                            "transition-all duration-200"
                        )}
                        placeholder="000000"
                        autoFocus
                        required
                    />
                </div>

                {error && (
                    <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                        <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        type="submit"
                        disabled={isLoading || otp.length !== 6}
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
                                Verifying OTP...
                            </span>
                        ) : (
                            'Verify OTP'
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setCurrentStep('email')}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors duration-200"
                        disabled={isLoading}
                    >
                        Back to Email Step
                    </button>
                </div>
            </form>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <CheckCircle size={64} className="text-green-600 dark:text-green-400 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Recovery Successful
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Welcome back, <strong>{user?.username}</strong>! You now have temporary access to the system.
                </p>
                
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                        <Clock size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="text-left">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Temporary Access - 15 Minutes
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                                Please change your password immediately after logging in. This session will expire in 15 minutes.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Important:</strong> This recovery session is logged and monitored. 
                        Please update your password and security settings as soon as possible.
                    </p>
                </div>

                <button
                    onClick={handleProceedToDashboard}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-colors duration-200"
                >
                    Continue to Dashboard
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                {/* Back Button */}
                <button
                    onClick={() => history.push('/login')}
                    className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors duration-200"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Login
                </button>

                {/* Render Current Step */}
                {currentStep === 'email' && renderEmailStep()}
                {currentStep === 'otp' && renderOTPStep()}
                {currentStep === 'success' && renderSuccessStep()}

                {/* Additional Help */}
                {currentStep !== 'success' && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Need additional help?
                            </p>
                            <button
                                onClick={() => history.push('/contact-admin')}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                Contact System Administrator
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountRecoveryPage;
