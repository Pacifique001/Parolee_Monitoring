import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Users, Brain, Activity, MapPin, FileText as LogIcon, Settings, LayoutDashboard, ShieldCheck, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Replace with your actual logo or a component
const PanelLogo = () => <ShieldCheck className="w-8 h-8 text-white" />;

interface SidebarProps {
    isOpen: boolean;
}

const AdminSidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    const location = useLocation();
    const { logout, user } = useAuth();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard', id: 'dashboard' },
        { icon: <Users size={20} />, label: 'User Management', path: '/admin/user-management', id: 'user-management' },
        { icon: <Brain size={20} />, label: 'AI Insights', path: '/admin/ai-insights', id: 'ai-insights' },
        { icon: <Activity size={20} />, label: 'IoT Monitoring', path: '/admin/iot-monitoring', id: 'iot-monitoring' },
        { icon: <MapPin size={20} />, label: 'GPS Tracking', path: '/admin/gps-tracking', id: 'gps-tracking' },
        { icon: <LogIcon size={20} />, label: 'System Logs', path: '/admin/system-logs', id: 'system-logs' },
    ];
    const settingsItem = { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings', id: 'settings' };

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <div className="bg-brand-purple-admin text-purple-200 h-full w-full flex flex-col">
            <div className="flex items-center justify-center h-16 flex-shrink-0 border-b border-purple-600/40 px-4 overflow-hidden">
                <Link to="/admin/dashboard" className="flex items-center w-full">
                    <PanelLogo />
                    {isOpen && <h1 className="text-xl font-bold text-white ml-2 truncate">Admin Portal</h1>}
                </Link>
            </div>

            <nav className="mt-4 flex-grow overflow-y-auto overflow-x-hidden sidebar-scrollable pb-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.id}
                        to={item.path}
                        title={!isOpen ? item.label : undefined}
                        className={`w-full flex items-center px-4 py-3 text-sm hover:bg-purple-700 focus:bg-purple-700 focus:outline-none transition-colors duration-150 relative group
                            ${isActive(item.path) ? 'bg-purple-700 font-semibold text-white' : 'text-purple-200 hover:text-white'}`}
                    >
                        <span className="mr-3 flex-shrink-0">{item.icon}</span>
                        {isOpen && (
                            <span className="overflow-hidden whitespace-nowrap transition-opacity duration-300">
                                {item.label}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>

            <div className="flex-shrink-0 border-t border-purple-700/50">
                <Link
                    to="/admin/settings"
                    title={!isOpen ? settingsItem.label : undefined}
                    className={`w-full flex items-center px-4 py-3 text-sm hover:bg-purple-700 focus:bg-purple-700 focus:outline-none transition-colors duration-150 relative group
                        ${isActive(settingsItem.path) ? 'bg-purple-700 font-semibold text-white' : 'text-purple-200 hover:text-white'}`}
                >
                    <span className="mr-3 flex-shrink-0">{settingsItem.icon}</span>
                    {isOpen && <span className="overflow-hidden whitespace-nowrap">{settingsItem.label}</span>}
                </Link>
                <button
                    onClick={logout}
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

export default AdminSidebar;