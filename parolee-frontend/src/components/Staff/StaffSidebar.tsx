// src/components/Staff/StaffSidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, MessageSquare, Bell as BellIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PanelLogo = () => <svg className="w-8 h-8 text-white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>;

interface SidebarProps {
    isOpen: boolean;
}

const StaffSidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/staff/dashboard', id: 'dashboard' },
        { icon: <ClipboardList size={20} />, label: 'Assessments', path: '/staff/assessments', id: 'assessments' },
        { icon: <MessageSquare size={20} />, label: 'Messages', path: '/staff/messages', id: 'messages' },
        { icon: <BellIcon size={20} />, label: 'Notifications', path: '/staff/notifications', id: 'notifications' },
    ];

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <div className="bg-brand-purple-admin text-purple-200 h-full w-full flex flex-col">
            {/* Header with Logo */}
            <div className="flex items-center justify-center h-16 flex-shrink-0 border-b border-purple-600/40 px-4 overflow-hidden">
                <Link to="/staff/dashboard" className="flex items-center w-full">
                    <PanelLogo />
                    {isOpen && <h1 className="text-xl font-bold text-white ml-2 truncate">Staff Portal</h1>}
                </Link>
            </div>

            {/* Navigation Items */}
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

            {/* Logout Section */}
            <div className="flex-shrink-0 border-t border-purple-700/50">
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

export default StaffSidebar;