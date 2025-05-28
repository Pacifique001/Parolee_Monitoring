// src/layouts/StaffLayout.tsx
import React, { useState, type ReactNode, useEffect } from 'react';
import StaffHeader from '../components/Staff/StaffHeader';
import DynamicSidebar from '../components/shared/DynamicSidebar';
import { usePermissions } from '../hooks/usePermissions';
import AccessDeniedView from '../components/shared/AccessDeniedView';

interface StaffLayoutProps {
    children: ReactNode;
}

const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
    const { permissions: structuredPermissions } = usePermissions();
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('staffSidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('staffSidebarOpen', JSON.stringify(sidebarOpen));
    }, [sidebarOpen]);
    
    if (!structuredPermissions.portal_access.staff) {
        return <AccessDeniedView portalName="Staff Portal" />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
            <StaffHeader 
                onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
                isSidebarOpen={sidebarOpen}
                // Pass userPermissions if StaffHeader needs it
                // userPermissions={structuredPermissions} 
            />
            <div className="flex flex-1 pt-16">
                <div className={`fixed top-16 bottom-0 left-0 transition-all duration-300 ease-in-out z-30 ${
                    sidebarOpen ? 'w-64' : 'w-20'
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

export default StaffLayout;