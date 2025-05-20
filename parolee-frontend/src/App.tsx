import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import SystemLogsPage from './pages/admin/SystemLogsPage';
import { NotificationProvider } from './contexts/NotificationContext';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResetPasswordOtpPage from './pages/ResetPasswordOtpPage';

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
    const { isAuthenticated, isLoading, hasRole } = useAuth();

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading application...</div>;
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Landing Page Route */}
                <Route path="/" element={<LandingPage />} />

                {/* Login Route */}
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/admin/dashboard" />} />
                <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/admin/dashboard" />} />
                <Route path="/reset-password" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/admin/dashboard" />} />
                <Route path="/reset-password-otp" element={!isAuthenticated ? <ResetPasswordOtpPage /> : <Navigate to="/admin/dashboard" />} />
                
                {/* Protected Admin Routes */}
                <Route
                    path="/admin/*"
                    element={
                        isAuthenticated && hasRole('System Administrator') ? (
                            <AdminLayout>
                                <Routes>
                                    <Route path="dashboard" element={<DashboardPage />} />
                                    <Route path="user-management" element={<UserManagementPage />} />
                                    <Route path="system-logs" element={<SystemLogsPage />} />
                                    <Route path="*" element={<Navigate to="dashboard" />} />
                                </Routes>
                            </AdminLayout>
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;