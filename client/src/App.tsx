// src/App.tsx
import React, { useContext } from 'react';
// Updated imports for react-router-dom v5:
// - BrowserRouter is used as the top-level Router
// - Switch is used instead of Routes
// - Redirect is used instead of Navigate
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // Removed AlertCircle as it was unused

import { AuthProvider, AuthContext } from './context/AuthContext.tsx';
import { SocketProvider } from './context/SocketContext.tsx';

// Page components (assumed refactored to Tailwind/Lucide)
import LoginPage from './pages/LoginPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import AnalyticsPage from './pages/AnalyticsPage.tsx';
import MLPerformancePage from './pages/MLPerformancePage.tsx';
import ReportsPage from './pages/ReportsPage.tsx';
import TransactionsPage from './pages/TransactionsPage.tsx';
import TransactionDetailsPage from './pages/TransactionDetailsPage.tsx';
import FraudCaseReviewPage from './pages/FraudCaseReviewPage.tsx';
import AnomaliesPage from './pages/AnomaliesPage.tsx'; // Renamed import
import AnomalyDetailsPage from './pages/AnomalyDetailsPage.tsx'; // Corrected import from AlertDetailspage.tsx
import UsersPage from './pages/UsersPage.tsx';
import UserDetailsPage from './pages/UserDetailsPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import AuditLogsPage from './pages/AuditLogsPage.tsx';
import RulesPage from './pages/RulesPage.tsx';
import RuleFormPage from './pages/RuleFormPage.tsx';

// Password Recovery Pages
import PasswordResetRequestPage from './pages/PasswordResetRequestPage.tsx';
import PasswordResetPage from './pages/PasswordResetPage.tsx';
import AccountRecoveryPage from './pages/AccountRecoveryPage.tsx';
import ContactAdminPage from './pages/ContactAdminPage.tsx';

// Layout components (assumed refactored to Tailwind/Lucide)
import DashboardLayout from './layouts/DashboardLayout.tsx';
import AuthLayout from './layouts/AuthLayout.tsx';

interface PrivateRouteProps {
    children: React.ReactNode;
    path: string;
    exact?: boolean;
    allowedRoles?: string[];
}

/**
 * PrivateRoute component for protected routes.
 * Checks authentication status and user roles before rendering children.
 * Displays a loading spinner if authentication is in progress.
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, path, exact, allowedRoles }) => {
    const { isAuthenticated, isLoading, user } = useContext(AuthContext);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
                <p className="text-xl font-semibold">Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log(`[PrivateRoute] Not authenticated. Redirecting to /login from ${path}.`);
        return <Redirect to="/login" />; // Use Redirect for v5
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        console.warn(`[PrivateRoute] User "${user.username}" (Role: ${user.role}) is not authorized for ${path}. Redirecting to /dashboard.`);
        return <Redirect to="/dashboard" />; // Use Redirect for v5
    }

    // In React Router v5, the children prop of Route is rendered directly.
    // DashboardLayout wraps the content.
    return (
        <Route path={path} exact={exact}>
            <DashboardLayout>
                {children}
            </DashboardLayout>
        </Route>
    );
};

/**
 * AuthRedirect component to handle initial redirection based on authentication status.
 * Displays a loading spinner while authentication is in progress.
 */
const AuthRedirect: React.FC = () => {
    const { isAuthenticated, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
                <p className="text-xl font-semibold">Loading...</p>
            </div>
        );
    }

    // Use Redirect for v5
    return isAuthenticated ? <Redirect to="/dashboard" /> : <Redirect to="/login" />;
};

/**
 * Main App component responsible for setting up routing and context providers.
 */
const App: React.FC = () => {
    return (
        <Router> {/* Use BrowserRouter as Router */}
            <AuthProvider>
                <SocketProvider>
                    <Switch> {/* Use Switch for v5 */}
                        {/* Public routes for authentication and password recovery */}
                        {/* In v5, `element` prop is not used. Render children directly. */}
                        <Route path="/login" exact>
                            <AuthLayout><LoginPage /></AuthLayout>
                        </Route>
                        <Route path="/password-reset-request" exact>
                            <AuthLayout><PasswordResetRequestPage /></AuthLayout>
                        </Route>
                        <Route path="/reset-password" exact>
                            <AuthLayout><PasswordResetPage /></AuthLayout>
                        </Route>
                        <Route path="/account-recovery" exact>
                            <AuthLayout><AccountRecoveryPage /></AuthLayout>
                        </Route>
                        <Route path="/contact-admin" exact>
                            <AuthLayout><ContactAdminPage /></AuthLayout>
                        </Route>

                        {/* Private routes requiring authentication and specific roles */}
                        {/* PrivateRoute component handles its own Route rendering */}
                        <PrivateRoute path="/dashboard" exact allowedRoles={['admin', 'analyst', 'viewer']}>
                            <DashboardPage />
                        </PrivateRoute>
                        <PrivateRoute path="/transactions" exact allowedRoles={['admin', 'analyst', 'viewer']}>
                            <TransactionsPage />
                        </PrivateRoute>
                        <PrivateRoute path="/transactions/:id" exact allowedRoles={['admin', 'analyst', 'viewer']}>
                            <TransactionDetailsPage />
                        </PrivateRoute>
                        <PrivateRoute path="/case-review/:id" exact allowedRoles={['admin', 'analyst']}>
                            <FraudCaseReviewPage />
                        </PrivateRoute>
                        <PrivateRoute path="/analytics" exact allowedRoles={['admin', 'analyst', 'viewer']}>
                            <AnalyticsPage />
                        </PrivateRoute>
                        <PrivateRoute path="/ml-performance" exact allowedRoles={['admin', 'analyst', 'viewer']}>
                            <MLPerformancePage />
                        </PrivateRoute>
                        <PrivateRoute path="/reports" exact allowedRoles={['admin']}>
                            <ReportsPage />
                        </PrivateRoute>
                        {/* Updated routes for alerts/anomalies - supporting both paths */}
                        <PrivateRoute path="/alerts" exact allowedRoles={['admin', 'analyst', 'viewer']}>
                            <AnomaliesPage /> {/* Alerts page using AnomaliesPage component */}
                        </PrivateRoute>
                        <PrivateRoute path="/anomalies" exact allowedRoles={['admin', 'analyst', 'viewer']}>
                            <AnomaliesPage /> {/* Anomalies page using same AnomaliesPage component */}
                        </PrivateRoute>
                        <PrivateRoute path="/alerts/:id" exact allowedRoles={['admin', 'analyst', 'viewer']}>
                            <AnomalyDetailsPage /> {/* Alert details using AnomalyDetailsPage component */}
                        </PrivateRoute>
                        <PrivateRoute path="/anomalies/:id" exact allowedRoles={['admin', 'analyst', 'viewer']}>
                            <AnomalyDetailsPage /> {/* Anomaly details using same AnomalyDetailsPage component */}
                        </PrivateRoute>
                        <PrivateRoute path="/users" exact allowedRoles={['admin']}>
                            <UsersPage />
                        </PrivateRoute>
                        <PrivateRoute path="/users/:id" exact allowedRoles={['admin']}>
                            <UserDetailsPage />
                        </PrivateRoute>
                        {/* Settings path is optional, so `exact` is not passed for the :tab? route in v5 */}
                        <PrivateRoute path="/settings/:tab?" allowedRoles={['admin']}>
                            <SettingsPage />
                        </PrivateRoute>
                        <PrivateRoute path="/audit-logs" exact allowedRoles={['admin']}>
                            <AuditLogsPage />
                        </PrivateRoute>
                        <PrivateRoute path="/rules" exact allowedRoles={['admin']}>
                            <RulesPage />
                        </PrivateRoute>
                        <PrivateRoute path="/rules/create" exact allowedRoles={['admin']}>
                            <RuleFormPage />
                        </PrivateRoute>
                        <PrivateRoute path="/rules/edit/:id" exact allowedRoles={['admin']}>
                            <RuleFormPage />
                        </PrivateRoute>

                        {/* Default route that redirects based on authentication status */}
                        {/* Render AuthRedirect directly as a child of Route */}
                        <Route path="/" exact>
                            <AuthRedirect />
                        </Route>
                    </Switch>
                </SocketProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;
