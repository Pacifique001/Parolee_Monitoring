// src/components/Staff/StaffHeader.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Assuming you might want a link to a staff profile page
import { Search, Bell, UserCircle, ChevronDown, Menu, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; // To get user info and logout function

interface StaffHeaderProps {
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const StaffHeader: React.FC<StaffHeaderProps> = ({ onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm h-16 fixed top-0 left-0 right-0 z-50 border-b dark:border-gray-700">
            <div className="flex items-center justify-between h-full px-4 sm:px-6">
                {/* Left section with toggle and brand */}
                <div className="flex items-center">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple-admin"
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    
                    <span className="ml-4 text-lg font-semibold text-gray-900 dark:text-gray-100 hidden sm:inline">
                        
                    </span>
                </div>

                {/* Right section */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    {/* Search - Only show on larger screens */}
                    <div className="hidden lg:block relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400" />
                        </span>
                        <input
                            type="search"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-purple-admin focus:border-brand-purple-admin bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <Bell className="w-6 h-6" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className="flex items-center space-x-2 p-1 pr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-brand-purple-admin"
                            id="staff-user-menu-button" aria-expanded={profileMenuOpen} aria-haspopup="true"
                        >
                            <UserCircle className="w-8 h-8 text-gray-600 dark:text-gray-300" /> {/* Placeholder avatar */}
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-200 hidden sm:inline">
                                {user?.name || 'Staff Member'}
                            </span>
                            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 hidden sm:inline" />
                        </button>

                        {profileMenuOpen && (
                            <div
                                className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none py-1 z-30"
                                role="menu" aria-orientation="vertical" aria-labelledby="staff-user-menu-button" tabIndex={-1}
                                onClick={() => setProfileMenuOpen(false)} // Close menu on item click
                            >
                                <Link
                                    to="/staff/profile-settings" // Define this route in App.tsx for staff
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    role="menuitem" tabIndex={-1}
                                >
                                    <SettingsIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                                    Profile Settings
                                </Link>
                                <button
                                    onClick={logout}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    role="menuitem" tabIndex={-1}
                                >
                                    <LogOut className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default StaffHeader;