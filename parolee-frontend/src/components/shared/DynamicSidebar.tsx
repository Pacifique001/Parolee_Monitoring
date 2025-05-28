/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Shared/DynamicSidebar.tsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Users, Brain, Activity, MapPin, FileText as LogIcon, Settings,
    LayoutDashboard, ShieldCheck, LogOut, MessageCircle, ClipboardList,
    MessageSquare, Bell, Database, AlertTriangle, BarChart3,
    Shield, Zap, Radio, PlusCircle, Edit, Trash2, Eye, UserCheck,
    UserX, RefreshCw, Download, Share, Calendar, Send, Key
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

const PanelLogo = () => <ShieldCheck className="w-8 h-8 text-white" />;

interface SidebarProps {
    isOpen: boolean;
    onNavigate?: () => void;
}

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    pathKey: string; // Instead of fixed path, use a key to generate role-specific paths
    id: string;
    requiredRawPermissions?: string[];
    requiredAnyRawPermission?: string[];
    children?: MenuItem[];
}

const DynamicSidebar: React.FC<SidebarProps> = ({ isOpen, onNavigate }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout: authLogout, permissions: structuredPermissions, hasPermission, hasAnyPermission } = useAuth();

    // Get current user's role-based path prefix
    const getCurrentRolePrefix = (): string => {
        if (structuredPermissions.portal_access.admin) return '/admin';
        if (structuredPermissions.portal_access.officer) return '/officer';
        if (structuredPermissions.portal_access.staff) return '/staff';
        return '/shared'; // Fallback to shared routes
    };

    // Generate role-specific path
    const generatePath = (pathKey: string): string => {
        if (pathKey === 'dashboard') {
            const prefix = getCurrentRolePrefix();
            return `${prefix}/dashboard`;
        }
        
        // For shared pages, use the current role's prefix
        const prefix = getCurrentRolePrefix();
        return `${prefix}/${pathKey}`;
    };

    // Define all possible menu items with pathKey instead of fixed paths
    const allMenuItems: MenuItem[] = [
        // Dashboard - will be generated based on user's role
        {
            icon: <LayoutDashboard size={20} />,
            label: 'Dashboard',
            pathKey: 'dashboard',
            id: 'dashboard',
            requiredAnyRawPermission: ['view admin dashboard', 'view officer dashboard', 'view staff dashboard']
        },

        // Shared pages - paths will be generated with role prefix
        {
            icon: <Users size={20} />,
            label: 'User Management',
            pathKey: 'user-management',
            id: 'user-management',
            requiredAnyRawPermission: ['manage users', 'view users', 'create users', 'edit users', 'delete users']
        },
        {
            icon: <Brain size={20} />,
            label: 'AI Insights',
            pathKey: 'ai-insights',
            id: 'ai-insights',
            requiredRawPermissions: ['view ai insights']
        },
        {
            icon: <Activity size={20} />,
            label: 'IoT Monitoring',
            pathKey: 'iot-monitoring',
            id: 'iot-monitoring',
            requiredRawPermissions: ['view iot data']
        },
        {
            icon: <MapPin size={20} />,
            label: 'GPS Tracking',
            pathKey: 'gps-tracking',
            id: 'gps-tracking',
            requiredRawPermissions: ['view gps tracking']
        },
        {
            icon: <ClipboardList size={20} />,
            label: 'Assessments',
            pathKey: 'assessments',
            id: 'assessments',
            requiredRawPermissions: ['view assessments']
        },
        {
            icon: <MessageSquare size={20} />,
            label: 'Messages',
            pathKey: 'messages',
            id: 'messages',
            requiredRawPermissions: ['manage staff messages']
        },
        {
            icon: <Bell size={20} />,
            label: 'Notifications',
            pathKey: 'notifications',
            id: 'notifications',
            requiredRawPermissions: ['view staff notifications']
        },
        {
            icon: <LogIcon size={20} />,
            label: 'System Logs',
            pathKey: 'system-logs',
            id: 'system-logs',
            requiredRawPermissions: ['view system logs']
        },
    ];

    // Filter menu items based on user permissions and role-specific access
    const visibleMenuItems = allMenuItems.filter(item => {
        let itemHasAccess = true;
        
        // Check portal access based on current role
        const rolePrefix = getCurrentRolePrefix();
        if (rolePrefix === '/admin' && !hasPermission('access admin portal')) return false;
        if (rolePrefix === '/officer' && !hasPermission('access officer portal')) return false;
        if (rolePrefix === '/staff' && !hasPermission('access staff portal')) return false;

        // Check specific permissions
        if (item.requiredRawPermissions) {
            itemHasAccess = item.requiredRawPermissions.every(permission => hasPermission(permission));
        }
        if (itemHasAccess && item.requiredAnyRawPermission) {
            itemHasAccess = hasAnyPermission(item.requiredAnyRawPermission);
        }
        
        return itemHasAccess;
    }).map(item => ({
        ...item,
        path: generatePath(item.pathKey) // Generate the actual path
    }));

    const isActive = (path: string) => {
        return location.pathname === path || 
               (path !== '/' && location.pathname.startsWith(path) && path.split('/').length > 1);
    };

    const getPortalTitle = () => {
        if (structuredPermissions.portal_access.admin) return 'Admin Portal';
        if (structuredPermissions.portal_access.officer) return 'Officer Portal';
        if (structuredPermissions.portal_access.staff) return 'Staff Portal';
        return 'Application';
    };

    const getDashboardPath = () => {
        if (structuredPermissions.portal_access.admin && hasPermission('view admin dashboard')) return '/admin/dashboard';
        if (structuredPermissions.portal_access.officer && hasPermission('view officer dashboard')) return '/officer/dashboard';
        if (structuredPermissions.portal_access.staff && hasPermission('view staff dashboard')) return '/staff/dashboard';
        return '/';
    };

    const handleLogout = async () => {
        await authLogout();
        navigate('/login');
    };

    return (
        <div className="bg-brand-purple-admin text-purple-200 h-full w-full flex flex-col">
            <div className="flex items-center justify-center h-16 flex-shrink-0 border-b border-purple-600/40 px-4 overflow-hidden">
                <Link to={getDashboardPath()} className="flex items-center w-full" onClick={onNavigate}>
                    <PanelLogo />
                    {isOpen && <h1 className="text-xl font-bold text-white ml-2 truncate">{getPortalTitle()}</h1>}
                </Link>
            </div>

            <nav className="mt-4 flex-grow overflow-y-auto overflow-x-hidden sidebar-scrollable pb-4">
                {visibleMenuItems.map((item) => (
                    <Link
                        key={item.id}
                        to={item.path}
                        title={!isOpen ? item.label : undefined}
                        onClick={onNavigate}
                        className={`w-full flex items-center px-4 py-3 text-sm hover:bg-purple-700 focus:bg-purple-700 focus:outline-none transition-colors duration-150 relative group
                            ${isActive(item.path) ? 'bg-purple-700 font-semibold text-white' : 'text-purple-200 hover:text-white'}`}
                    >
                        <span className="mr-3 flex-shrink-0">{item.icon}</span>
                        {isOpen && (
                            <span className="overflow-hidden whitespace-nowrap transition-opacity duration-300">
                                {item.label}
                            </span>
                        )}
                        {!isOpen && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                            </div>
                        )}
                    </Link>
                ))}
            </nav>

            {isOpen && user && (
                <div className="px-4 py-3 border-t border-purple-700/50">
                    <div className="text-xs text-purple-300">
                        <div className="font-medium text-white truncate">{user.name}</div>
                        <div className="truncate">{user.email}</div>
                        {user.roles && user.roles.length > 0 && (
                            <div className="truncate text-purple-400">
                                {user.roles.map(role => role.name).join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-shrink-0 border-t border-purple-700/50">
                <button
                    onClick={handleLogout}
                    title={!isOpen ? 'Logout' : undefined}
                    className="w-full flex items-center px-4 py-3 text-sm text-purple-200 hover:bg-red-600 hover:text-white focus:bg-red-700 focus:text-white focus:outline-none transition-colors duration-150"
                >
                    <LogOut size={20} className="mr-3 flex-shrink-0" />
                    {isOpen && <span className="overflow-hidden whitespace-nowrap">Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default DynamicSidebar;