// src/layouts/StaffLayout.tsx
import React, { useState, type ReactNode } from 'react';
import StaffSidebar from '../components/Staff/StaffSidebar';
import StaffHeader from '../components/Staff/StaffHeader';

interface StaffLayoutProps {
    children: ReactNode;
}

const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Fixed Header */}
            <StaffHeader 
                onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
                isSidebarOpen={sidebarOpen}
            />

            {/* Layout Container */}
            <div className="flex pt-16">
                {/* Fixed Sidebar */}
                <div className={`fixed top-16 bottom-0 bg-brand-purple-admin shadow-lg z-40 transition-all duration-300 ease-in-out ${
                    sidebarOpen ? 'w-64' : 'w-20'
                }`}>
                    <StaffSidebar isOpen={sidebarOpen} />
                </div>

                {/* Main Content with left margin to account for sidebar */}
                <main className="flex-1 overflow-y-auto">
                    {/* The children (e.g., DashboardPage) will have their own padding (like p-6 mt-16) */}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default StaffLayout;