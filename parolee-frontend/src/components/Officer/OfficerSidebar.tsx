// src/components/Officer/OfficerSidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, MapPin as GpsIcon, LogOut } from 'lucide-react'; // GpsIcon alias
import { useAuth } from '../../contexts/AuthContext'; // Assuming useAuth provides logout

// Replace with your actual logo or a component
const PanelLogo = () => <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>;


interface SidebarProps { isOpen: boolean; }

const OfficerSidebar: React.FC<SidebarProps> = ({ isOpen }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/officer/dashboard' },
        { icon: <MessageCircle size={20} />, label: 'Communication Panel', path: '/officer/communication' },
        { icon: <GpsIcon size={20} />, label: 'GPS Tracking', path: '/officer/gps-tracking' },
    ];

    const isActive = (path: string) => location.pathname === path || (path !== '/officer/dashboard' && location.pathname.startsWith(path));


    return (
        <div className={`bg-brand-purple-admin text-purple-100 h-screen fixed left-0 top-0 transition-all duration-300 ease-in-out z-30 flex flex-col ${isOpen ? 'w-60' : 'w-20'}`}> {/* Adjusted width to w-60 */}
            <div className="flex items-center justify-center h-16 flex-shrink-0 border-b border-purple-700/50 px-4 overflow-hidden">
                <Link to="/officer/dashboard" className="flex items-center w-full">
                    <PanelLogo />
                    {isOpen && <h1 className="text-lg font-bold text-white ml-2 truncate">Officer Portal</h1>}
                </Link>
            </div>
            <nav className="mt-4 flex-grow overflow-y-auto sidebar-scrollable pb-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        title={!isOpen ? item.label : undefined}
                        className={`w-full flex items-center px-4 py-3 text-sm hover:bg-purple-700 focus:bg-purple-700 focus:outline-none transition-colors duration-150
                            ${isActive(item.path) ? 'bg-purple-700 font-semibold text-white' : 'text-purple-200 hover:text-white'}`}
                    >
                        <span className="mr-3 flex-shrink-0">{item.icon}</span>
                        {isOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                ))}
            </nav>
            <div className="flex-shrink-0 border-t border-purple-700/50">
                <button
                    onClick={logout}
                    title={!isOpen ? 'Logout' : undefined}
                    className="w-full flex items-center px-4 py-3 text-sm text-purple-200 hover:bg-red-600 hover:text-white focus:bg-red-700 focus:text-white focus:outline-none transition-colors duration-150"
                >
                    <LogOut size={20} className="mr-3 flex-shrink-0" />
                    {isOpen && <span className="truncate">Logout</span>}
                </button>
            </div>
        </div>
    );
};
export default OfficerSidebar;