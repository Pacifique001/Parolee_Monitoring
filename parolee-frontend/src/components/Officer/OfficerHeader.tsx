// src/components/Officer/OfficerHeader.tsx
import React, { useState } from 'react';
import { Search, Bell, UserCircle, ChevronDown, Menu, LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserPermissions } from '../../types/api';

interface OfficerHeaderProps {
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
    userPermissions: UserPermissions;
}

const OfficerHeader: React.FC<OfficerHeaderProps> = ({ 
    onToggleSidebar, 
    isSidebarOpen, 
    userPermissions 
}) => {
    const { user, logout } = useAuth();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    // Update the permission check to use the correct path
    const canViewNotifications = userPermissions?.data_management?.notifications?.view || false;
    const canSearchParolees = userPermissions?.users?.view || false;

    return (
        <header
            className={`fixed top-0 right-0 left-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 z-40 h-16 flex items-center justify-between px-4 sm:px-6 transition-all duration-300 ease-in-out ${
                isSidebarOpen ? 'left-64' : 'left-20'
            }`}
        >
            <div className="flex items-center">
                <button 
                    onClick={onToggleSidebar}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            <div className="flex items-center space-x-4">
                {/* Search - Only show if user has permission */}
                {canSearchParolees && (
                    <div className="relative hidden md:block">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400" />
                        </span>
                        <input 
                            type="search" 
                            placeholder="Search parolees..." 
                            className="input-style pl-10 py-2 text-sm w-56 lg:w-72" 
                        />
                    </div>
                )}

                {/* Notifications - Only show if user has permission */}
                {canViewNotifications && (
                    <button 
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 relative"
                        aria-label="View notifications"
                    >
                        <Bell className="w-6 h-6" />
                        <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
                    </button>
                )}

                {/* Profile Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        className="flex items-center space-x-1 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <UserCircle className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium text-sm text-gray-700 dark:text-gray-200 hidden sm:inline">
                            {user?.name || 'Officer'}
                        </span>
                        <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>

                    {profileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none py-1 z-30">
                            {userPermissions.users.edit && (
                                <Link 
                                    to="/officer/profile" 
                                    className="dropdown-item flex items-center"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Profile Settings
                                </Link>
                            )}
                            <button 
                                onClick={logout} 
                                className="dropdown-item w-full text-left flex items-center"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default OfficerHeader;