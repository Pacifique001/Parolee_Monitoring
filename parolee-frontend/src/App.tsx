// src/App.tsx
import { type JSX } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
// General Pages
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage'; // If using traditional token reset links
import ResetPasswordOtpPage from './pages/ResetPasswordOtpPage'; // For OTP flow

// Admin Portal Components
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/DashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import SystemLogsPage from './pages/admin/SystemLogsPage';

// Officer Portal Components
import OfficerLayout from './layouts/OfficerLayout';
import OfficerDashboardPage from './pages/officer/DashboardPage';

// Staff Portal Components
import StaffLayout from './layouts/StaffLayout';
import StaffDashboardPage from './pages/staff/DashboardPage';
import StaffAssessmentsPage from './pages/staff/AssessmentsPage';
import StaffMessagesPage from './pages/staff/MessagesPage';
import StaffNotificationsPage from './pages/staff/NotificationsPage';

// Import NotificationProvider
import { NotificationProvider } from './contexts/NotificationContext';

// Helper component for protected routes
const ProtectedRoute = ({ allowedRoles, children }: { allowedRoles: string[]; children: JSX.Element }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple-admin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const userHasRequiredRole = user?.roles?.some(role => allowedRoles.includes(role.name));

    if (!userHasRequiredRole) {
        console.warn(`Access Denied: User ${user?.email} not authorized for roles: ${allowedRoles.join(', ')}.`);
        return <Navigate to="/" replace />;
    }

    return children;
};

// Component to determine initial redirect after login or if already logged in
const AuthenticatedRedirect = () => {
    const { user, hasRole } = useAuth();

    if (user?.user_type === 'admin' && hasRole('System Administrator')) {
        return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.user_type === 'officer' && hasRole('Parole Officer')) {
        return <Navigate to="/officer/dashboard" replace />;
    } else if (user?.user_type === 'staff' && (hasRole('Case Manager') || hasRole('Support Staff'))) {
        return <Navigate to="/staff/dashboard" replace />;
    }

    console.warn("Authenticated user without a designated portal role. Redirecting to landing.");
    return <Navigate to="/" replace />;
};

function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <RouterSetup />
            </NotificationProvider>
        </AuthProvider>
    );
}

function RouterSetup() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-purple-admin"></div>
                <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Loading Application...</p>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes - Landing page is always accessible */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Auth Routes - Redirect to dashboard if authenticated */}
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <AuthenticatedRedirect />} />
                <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <AuthenticatedRedirect />} />
                <Route path="/reset-password-otp" element={!isAuthenticated ? <ResetPasswordOtpPage /> : <AuthenticatedRedirect />} />
                <Route path="/reset-password" element={!isAuthenticated ? <ResetPasswordPage /> : <AuthenticatedRedirect />} />

                {/* Protected Routes - Only accessible when authenticated */}
                <Route path="/admin/*" element={
                    <ProtectedRoute allowedRoles={['System Administrator']}>
                        <AdminLayout>
                            <Routes>
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<AdminDashboardPage />} />
                                <Route path="user-management" element={<UserManagementPage />} />
                                <Route path="system-logs" element={<SystemLogsPage />} />
                                <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                        </AdminLayout>
                    </ProtectedRoute>
                } />

                {/* Officer Portal */}
                <Route path="/officer/*" element={
                    <ProtectedRoute allowedRoles={['Parole Officer']}>
                        <OfficerLayout>
                            <Routes>
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<OfficerDashboardPage />} />
                                <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                        </OfficerLayout>
                    </ProtectedRoute>
                } />

                {/* Staff Portal */}
                <Route path="/staff/*" element={
                    <ProtectedRoute allowedRoles={['Case Manager', 'Support Staff']}>
                        <StaffLayout>
                            <Routes>
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<StaffDashboardPage />} />
                                <Route path="assessments" element={<StaffAssessmentsPage />} />
                                <Route path="messages" element={<StaffMessagesPage />} />
                                <Route path="notifications" element={<StaffNotificationsPage />} />
                                <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                        </StaffLayout>
                    </ProtectedRoute>
                } />

                {/* Change the fallback route to always go to landing page */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;