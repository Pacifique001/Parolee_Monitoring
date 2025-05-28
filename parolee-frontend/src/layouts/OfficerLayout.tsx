/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, type ReactNode, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import OfficerHeader from '../components/Officer/OfficerHeader';
import AccessDeniedView from '../components/shared/AccessDeniedView'; // Corrected import
import DynamicSidebar from '../components/shared/DynamicSidebar';

interface OfficerLayoutProps {
    children: ReactNode;
}

const OfficerLayout: React.FC<OfficerLayoutProps> = ({ children }) => {
    // const { user } = useAuth();
    const { permissions: structuredPermissions } = usePermissions();

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('officerSidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('officerSidebarOpen', JSON.stringify(sidebarOpen));
    }, [sidebarOpen]);

    if (!structuredPermissions.portal_access.officer) {
        return <AccessDeniedView portalName="Officer Portal" />;
    }

    const handleToggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-brand-gray-officer-bg">
            <OfficerHeader 
                onToggleSidebar={handleToggleSidebar}
                isSidebarOpen={sidebarOpen}
                userPermissions={structuredPermissions}
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

export default OfficerLayout;