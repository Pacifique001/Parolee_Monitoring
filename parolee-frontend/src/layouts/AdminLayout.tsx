/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, type ReactNode, useEffect } from 'react';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminHeader from '../components/Admin/AdminHeader';

interface AdminLayoutProps {
    children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    // Persist sidebar state in localStorage
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const savedState = localStorage.getItem('adminSidebarOpen');
        return savedState !== null ? JSON.parse(savedState) : true; // Default to open
    });

    useEffect(() => {
        localStorage.setItem('adminSidebarOpen', JSON.stringify(sidebarOpen));
    }, [sidebarOpen]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-brand-gray-admin-bg">
            {/* Fixed Header */}
            
            <AdminHeader onToggleSidebar={() => setSidebarOpen((prev: any) => !prev)} />

            {/* Main Content Area with Sidebar */}
            <div className="flex flex-1 pt-16"> {/* Added pt-16 for header height */}
                {/* Sidebar */}
                <div className={`fixed top-16 bottom-0 transition-all duration-300 ease-in-out ${
                    sidebarOpen ? 'w-64' : 'w-20'
                }`}>
                    <AdminSidebar isOpen={sidebarOpen} />
                </div>

                {/* Main Content */}
                 {/* Page Content Area */}
                 <main className="flex-1 overflow-y-auto">
                    {/* The children (e.g., DashboardPage) will have their own padding (like p-6 mt-16) */}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;