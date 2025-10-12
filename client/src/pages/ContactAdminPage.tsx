import React from 'react';
import { useHistory } from 'react-router-dom';
import { 
    ArrowLeft, 
    Mail, 
    Phone, 
    MessageSquare, 
    Shield, 
    Clock,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';

const ContactAdminPage: React.FC = () => {
    const history = useHistory();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
                    <button
                        onClick={() => history.push('/login')}
                        className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors duration-200"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Login
                    </button>
                    
                    <div className="text-center">
                        <Shield size={64} className="text-blue-100 mx-auto mb-6" />
                        <h1 className="text-4xl font-bold mb-4">
                            Contact System Administrator
                        </h1>
                        <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                            Need help accessing your account or have technical issues? Contact our support team.
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 space-y-8">

                {/* Analyst Account Recovery Notice */}
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                        <Shield size={20} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Analyst Account Recovery
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                If you're an analyst who has lost access to your account, please contact the system administrator. 
                                OTP recovery is restricted to administrators only for security reasons.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Emergency Notice */}
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle size={20} className="text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                Emergency Fraud Detection Issues
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                For urgent fraud detection system issues that require immediate attention, 
                                please call the emergency hotline directly.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Methods */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Email Support */}
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                            <Mail size={24} className="text-blue-600 dark:text-blue-400 mr-3" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Email Support
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                    General Support:
                                </p>
                                <a href="mailto:support@frauddetection.system" className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                                    support@frauddetection.system
                                </a>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                    Account Issues:
                                </p>
                                <a href="mailto:accounts@frauddetection.system" className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                                    accounts@frauddetection.system
                                </a>
                            </div>
                            <div className="flex items-center mt-3 text-xs text-gray-600 dark:text-gray-400">
                                <Clock size={14} className="mr-1" />
                                Response time: 2-4 hours
                            </div>
                        </div>
                    </div>

                    {/* Phone Support */}
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                            <Phone size={24} className="text-green-600 dark:text-green-400 mr-3" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Phone Support
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                    Main Support:
                                </p>
                                <a href="tel:+265995837735" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                                    +265 995 837 735
                                </a>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                    Emergency Hotline:
                                </p>
                                <a href="tel:+265880287483" className="text-sm text-red-600 dark:text-red-400 hover:underline font-semibold">
                                    +265 880 287 483
                                </a>
                            </div>
                            <div className="flex items-center mt-3 text-xs text-gray-600 dark:text-gray-400">
                                <Clock size={14} className="mr-1" />
                                Available: Mon-Fri 8AM-6PM
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Recovery Options */}
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <MessageSquare size={20} className="mr-2 text-amber-600 dark:text-amber-400" />
                        Self-Service Options
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <CheckCircle size={16} className="text-green-600 dark:text-green-400 mt-1" />
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    Password Reset
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Use the "Forgot Password" link on the login page for standard password resets.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <CheckCircle size={16} className="text-green-600 dark:text-green-400 mt-1" />
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    Account Recovery (Admin/Analyst)
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Use the "Account Recovery (OTP)" option for high-privilege account recovery.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Information Required */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        When Contacting Support, Please Provide:
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-start">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            Your full name and employee ID (if applicable)
                        </li>
                        <li className="flex items-start">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            Email address associated with your account
                        </li>
                        <li className="flex items-start">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            Department and role (Admin, Analyst, Viewer)
                        </li>
                        <li className="flex items-start">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            Detailed description of the issue
                        </li>
                        <li className="flex items-start">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            Screenshots or error messages (if applicable)
                        </li>
                    </ul>
                </div>

                {/* Business Hours */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                Support Hours
                            </h4>
                            <p className="text-sm text-blue-600 dark:text-blue-300">
                                Monday - Friday: 8:00 AM - 6:00 PM (CAT)
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                Emergency Support
                            </h4>
                            <p className="text-sm text-blue-600 dark:text-blue-300">
                                24/7 for critical fraud detection issues
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back to Login Button */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => history.push('/login')}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Back to Login
                    </button>
                </div>
                
                </div>
            </div>
        </div>
    );
};

export default ContactAdminPage;
