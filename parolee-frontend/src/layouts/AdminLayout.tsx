/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, type ReactNode, useEffect } from 'react';
import AdminHeader from '../components/Admin/AdminHeader';
import DynamicSidebar from '../components/shared/DynamicSidebar';
// import { useAuth } from '../contexts/AuthContext'; // Not directly needed if usePermissions is used
import { usePermissions } from '../hooks/usePermissions';
import AccessDeniedView from '../components/shared/AccessDeniedView'; // Corrected import

interface AdminLayoutProps {
    children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    // const { user } = useAuth();
    const { permissions: structuredPermissions } = usePermissions(); // Use structured permissions
    
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const savedState = localStorage.getItem('adminSidebarOpen');
        return savedState !== null ? JSON.parse(savedState) : true;
    });

    useEffect(() => {
        localStorage.setItem('adminSidebarOpen', JSON.stringify(sidebarOpen));
    }, [sidebarOpen]);

    // Check admin portal access using structured permissions
    if (!structuredPermissions.portal_access.admin) {
        return <AccessDeniedView portalName="Admin Portal" />; // Pass portalName
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-brand-gray-admin-bg">
            <AdminHeader 
                onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
                isSidebarOpen={sidebarOpen}
                userPermissions={structuredPermissions} // Pass structured permissions
            />
            <div className="flex flex-1 pt-16"> {/* pt-16 for fixed header height */}
                <div className={`fixed top-16 bottom-0 left-0 transition-all duration-300 ease-in-out z-30 ${
                    sidebarOpen ? 'w-64' : 'w-20' // Standard sidebar widths
                }`}>
                    <DynamicSidebar isOpen={sidebarOpen} />
                </div>
                <main className="flex-1 overflow-y-auto">
                    {/* The children (e.g., DashboardPage) will have their own padding (like p-6 mt-16) */}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;