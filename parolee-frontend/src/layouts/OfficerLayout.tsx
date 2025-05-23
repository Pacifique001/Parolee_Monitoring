// src/layouts/OfficerLayout.tsx
import React, { useState, type ReactNode } from 'react';
import OfficerSidebar from '../components/Officer/OfficerSidebar'; // Create this
import OfficerHeader from '../components/Officer/OfficerHeader';   // Create this

interface OfficerLayoutProps { children: ReactNode; }

const OfficerLayout: React.FC<OfficerLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('officerSidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    React.useEffect(() => {
        localStorage.setItem('officerSidebarOpen', JSON.stringify(sidebarOpen));
    }, [sidebarOpen]);

    return (
        <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
            <OfficerSidebar isOpen={sidebarOpen} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-60' : 'ml-20'}`}> {/* Adjusted ml for w-60 */}
                <OfficerHeader
                    onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                    isSidebarOpen={sidebarOpen}
                />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16">
                    {children}
                </main>
            </div>
        </div>
    );
};
export default OfficerLayout;