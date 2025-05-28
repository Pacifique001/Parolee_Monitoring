// src/App.tsx
import { useEffect, type JSX } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AuthProvider, { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import OfficerLayout from './layouts/OfficerLayout';
import StaffLayout from './layouts/StaffLayout';
import SharedLayout from './layouts/SharedLayout';

// Auth & General Pages
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResetPasswordOtpPage from './pages/ResetPasswordOtpPage';

// Role-Specific Dashboards
import AdminDashboardPage from './pages/admin/DashboardPage';
import OfficerDashboardPage from './pages/officer/DashboardPage';
import StaffDashboardPage from './pages/staff/DashboardPage';

// Shared Pages
import UserManagementPage from './pages/shared/UserManagementPage';
import SystemLogsPage from './pages/shared/SystemLogsPage';
import AssessmentsPage from './pages/shared/AssessmentsPage';
import MessagesPage from './pages/shared/MessagesPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import AiInsightsPage from './pages/shared/AiInsightsPage';
import IotMonitoringPage from './pages/shared/IotMonitoringPage';
import GpsTrackingPage from './pages/shared/GpsTrackingPage';
import NotFoundPage from './pages/shared/NotFoundPage';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    requiredPermissions?: string[];
    children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles = [],
    requiredPermissions = [],
    children
}) => {
    const { isAuthenticated, user, isLoading, hasRole, hasPermission } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) return;

        // Add debug logging
        console.group('Protected Route Check');
        console.log('Path:', location.pathname);
        console.log('User:', user);
        console.log('Required Roles:', allowedRoles);
        console.log('Required Permissions:', requiredPermissions);
        
        if (!isAuthenticated) {
            console.log('Not authenticated, redirecting to login');
            console.groupEnd();
            navigate('/login', { state: { from: location }, replace: true });
            return;
        }

        const hasRequiredRole = allowedRoles.length === 0 || 
            allowedRoles.some(roleName => {
                const roleMatch = hasRole(roleName);
                console.log(`Role Check - ${roleName}:`, roleMatch);
                return roleMatch;
            });

        const hasRequiredPerms = requiredPermissions.length === 0 || 
            requiredPermissions.every(pName => {
                const hasPerm = hasPermission(pName);
                console.log(`Permission Check - ${pName}:`, hasPerm);
                return hasPerm;
            });

        if (!hasRequiredRole || !hasRequiredPerms) {
            console.warn(
                `Access Denied: User ${user?.email} lacks required ` +
                `${!hasRequiredRole ? 'roles' : 'permissions'} for ${location.pathname}`
            );
            console.groupEnd();
            navigate('/', { replace: true });
        }
        console.groupEnd();
    }, [
        isAuthenticated, isLoading, user, allowedRoles, requiredPermissions,
        location, navigate, hasRole, hasPermission
    ]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple-admin"></div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return children;
};

const AuthenticatedRedirect = () => {
    const { user, hasRole } = useAuth();

    if (hasRole('System Administrator')) {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (hasRole('Parole Officer')) {
        return <Navigate to="/officer/dashboard" replace />;
    }
    if (hasRole('Case Manager') || hasRole('Support Staff')) {
        return <Navigate to="/staff/dashboard" replace />;
    }
    // Fallback if user is authenticated but doesn't match known roles with dashboards
    console.warn("Authenticated user with no specific dashboard redirect:", user?.email, user?.roles);
    return <Navigate to="/" replace />;
};

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <NotificationProvider>
                    <RouterSetup />
                </NotificationProvider>
            </AuthProvider>
        </ErrorBoundary>
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
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <AuthenticatedRedirect />} />
                <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <AuthenticatedRedirect />} />
                <Route path="/reset-password-otp" element={!isAuthenticated ? <ResetPasswordOtpPage /> : <AuthenticatedRedirect />} />
                <Route path="/reset-password" element={!isAuthenticated ? <ResetPasswordPage /> : <AuthenticatedRedirect />} />

                {/* Admin Portal */}
                <Route path="/admin" element={
                    <ProtectedRoute 
                        allowedRoles={['System Administrator']} 
                        requiredPermissions={['access admin portal']}
                    >
                        <AdminLayout><Outlet /></AdminLayout>
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    
                    <Route path="dashboard" element={
                        <ProtectedRoute requiredPermissions={['view admin dashboard']}>
                            <AdminDashboardPage />
                        </ProtectedRoute>
                    } />
                    
                    {/* Admin Shared Pages Routes */}
                    <Route path="user-management" element={
                        <ProtectedRoute requiredPermissions={['view users', 'manage users']}>
                            <UserManagementPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="system-logs" element={
                        <ProtectedRoute requiredPermissions={['view system logs']}>
                            <SystemLogsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="ai-insights" element={
                        <ProtectedRoute requiredPermissions={['view ai insights']}>
                            <AiInsightsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="iot-monitoring" element={
                        <ProtectedRoute requiredPermissions={['view iot data']}>
                            <IotMonitoringPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="gps-tracking" element={
                        <ProtectedRoute requiredPermissions={['view gps tracking']}>
                            <GpsTrackingPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="assessments" element={
                        <ProtectedRoute requiredPermissions={['view assessments']}>
                            <AssessmentsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="messages" element={
                        <ProtectedRoute requiredPermissions={['manage staff messages']}>
                            <MessagesPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="notifications" element={
                        <ProtectedRoute requiredPermissions={['view staff notifications']}>
                            <NotificationsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Officer Portal */}
                <Route path="/officer" element={
                    <ProtectedRoute 
                        allowedRoles={['Parole Officer']} 
                        requiredPermissions={['access officer portal']}
                    >
                        <OfficerLayout><Outlet /></OfficerLayout>
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    
                    <Route path="dashboard" element={
                        <ProtectedRoute requiredPermissions={['view officer dashboard']}>
                            <OfficerDashboardPage />
                        </ProtectedRoute>
                    } />
                    
                    {/* Officer Shared Pages Routes */}
                    <Route path="gps-tracking" element={
                        <ProtectedRoute requiredPermissions={['view gps tracking']}>
                            <GpsTrackingPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="iot-monitoring" element={
                        <ProtectedRoute requiredPermissions={['view iot data']}>
                            <IotMonitoringPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="ai-insights" element={
                        <ProtectedRoute requiredPermissions={['view ai insights']}>
                            <AiInsightsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="assessments" element={
                        <ProtectedRoute requiredPermissions={['view assessments']}>
                            <AssessmentsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="messages" element={
                        <ProtectedRoute requiredPermissions={['manage staff messages']}>
                            <MessagesPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="notifications" element={
                        <ProtectedRoute requiredPermissions={['view staff notifications']}>
                            <NotificationsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="system-logs" element={
                        <ProtectedRoute requiredPermissions={['view system logs']}>
                            <SystemLogsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="user-management" element={
                        <ProtectedRoute requiredPermissions={['view users']}>
                            <UserManagementPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Staff Portal */}
                <Route path="/staff" element={
                    <ProtectedRoute 
                        allowedRoles={['Case Manager', 'Support Staff']} 
                        requiredPermissions={['access staff portal']}
                    >
                        <StaffLayout><Outlet /></StaffLayout>
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    
                    <Route path="dashboard" element={
                        <ProtectedRoute requiredPermissions={['view staff dashboard']}>
                            <StaffDashboardPage />
                        </ProtectedRoute>
                    } />
                    
                    {/* Staff Shared Pages Routes */}
                    <Route path="assessments" element={
                        <ProtectedRoute requiredPermissions={['view assessments']}>
                            <AssessmentsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="messages" element={
                        <ProtectedRoute requiredPermissions={['manage staff messages']}>
                            <MessagesPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="notifications" element={
                        <ProtectedRoute requiredPermissions={['view staff notifications']}>
                            <NotificationsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="ai-insights" element={
                        <ProtectedRoute requiredPermissions={['view ai insights']}>
                            <AiInsightsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="iot-monitoring" element={
                        <ProtectedRoute requiredPermissions={['view iot data']}>
                            <IotMonitoringPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="gps-tracking" element={
                        <ProtectedRoute requiredPermissions={['view gps tracking']}>
                            <GpsTrackingPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="system-logs" element={
                        <ProtectedRoute requiredPermissions={['view system logs']}>
                            <SystemLogsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="user-management" element={
                        <ProtectedRoute requiredPermissions={['view users']}>
                            <UserManagementPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Shared Routes (Optional - for direct access if needed) */}
                <Route path="/shared" element={
                    <ProtectedRoute requiredPermissions={['access portal']}>
                        <SharedLayout />
                    </ProtectedRoute>
                }>
                    <Route path="user-management" element={
                        <ProtectedRoute requiredPermissions={['view users']}>
                            <UserManagementPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="ai-insights" element={
                        <ProtectedRoute requiredPermissions={['view ai insights']}>
                            <AiInsightsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="iot-monitoring" element={
                        <ProtectedRoute requiredPermissions={['view iot data']}>
                            <IotMonitoringPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="gps-tracking" element={
                        <ProtectedRoute requiredPermissions={['view gps tracking']}>
                            <GpsTrackingPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="assessments" element={
                        <ProtectedRoute requiredPermissions={['view assessments']}>
                            <AssessmentsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="messages" element={
                        <ProtectedRoute requiredPermissions={['manage staff messages']}>
                            <MessagesPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="notifications" element={
                        <ProtectedRoute requiredPermissions={['view staff notifications']}>
                            <NotificationsPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="system-logs" element={
                        <ProtectedRoute requiredPermissions={['view system logs']}>
                            <SystemLogsPage />
                        </ProtectedRoute>
                    } />
                </Route>

                {/* Portal-specific fallbacks */}
                <Route path="/admin/*" element={
                    <ProtectedRoute 
                        allowedRoles={['System Administrator']} 
                        requiredPermissions={['access admin portal']}
                    >
                        <NotFoundPage />
                    </ProtectedRoute>
                } />

                <Route path="/officer/*" element={
                    <ProtectedRoute 
                        allowedRoles={['Parole Officer']} 
                        requiredPermissions={['access officer portal']}
                    >
                        <NotFoundPage />
                    </ProtectedRoute>
                } />

                <Route path="/staff/*" element={
                    <ProtectedRoute 
                        allowedRoles={['Case Manager', 'Support Staff']} 
                        requiredPermissions={['access staff portal']}
                    >
                        <NotFoundPage />
                    </ProtectedRoute>
                } />

                {/* Global fallback */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;