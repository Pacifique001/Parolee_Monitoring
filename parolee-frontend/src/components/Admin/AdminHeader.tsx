// src/components/Admin/AdminHeader.tsx
import React, { useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, UserCircle, ChevronDown, Menu, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import type { UserPermissions } from '../../types/api';

interface AdminHeaderProps {
    onToggleSidebar: () => void;
    userPermissions: UserPermissions;
    isSidebarOpen: boolean;
    
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, loading } = useNotifications();
    const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <header className="bg-white dark:bg-brand-gray-admin-card shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 fixed top-0 right-0 left-0 z-20 transition-all duration-300 ease-in-out border-b dark:border-gray-700">
            <div className="flex items-center">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-purple-admin"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative hidden md:block">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </span>
                    <input
                        type="search"
                        placeholder="Search..."
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-brand-purple-admin sm:text-sm"
                    />
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-brand-purple-admin relative" 
                        aria-label="View notifications"
                    >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                        )}
                    </button>

                    {notificationMenuOpen && (
                        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none py-1 z-30">
                            <div className="px-4 py-2 border-b dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                                <div className="flex space-x-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-brand-purple-admin hover:text-brand-purple-admin-dark"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={clearNotifications}
                                            className="text-xs text-red-600 hover:text-red-700"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        Loading notifications...
                                    </div>
                                ) : notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                                                !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                            onClick={() => {
                                                markAsRead(notification.id);
                                                if (notification.link) {
                                                    navigate(notification.link);
                                                }
                                            }}
                                        >
                                            <div className="flex items-start">
                                                <div className={`flex-shrink-0 w-2 h-2 mt-1.5 rounded-full ${
                                                    notification.type === 'error' ? 'bg-red-500' :
                                                    notification.type === 'warning' ? 'bg-yellow-500' :
                                                    notification.type === 'success' ? 'bg-green-500' :
                                                    'bg-blue-500'
                                                }`} />
                                                <div className="ml-3">
                                                    <p className="text-sm text-gray-900 dark:text-gray-100">{notification.message}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {new Date(notification.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        No notifications
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        className="flex items-center space-x-2 p-1 pr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-brand-purple-admin"
                    >
                        <UserCircle className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium text-sm text-gray-700 dark:text-gray-200 hidden sm:inline">
                            {user?.name || 'Admin'}
                        </span>
                        <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 hidden sm:inline" />
                    </button>

                    {profileMenuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none py-1 z-30"
                            onClick={() => setProfileMenuOpen(false)}
                        >
                            <Link
                                to="/admin/profile"
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <SettingsIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                                Profile Settings
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <LogOut className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;