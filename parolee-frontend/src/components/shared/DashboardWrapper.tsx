import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../layouts/AdminLayout';
import OfficerLayout from '../../layouts/OfficerLayout';
import StaffLayout from '../../layouts/StaffLayout';

interface DashboardWrapperProps {
    children: React.ReactNode;
}

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ children }) => {
    const { user } = useAuth();
    
    // Determine which layout to use based on user's primary role
    if (user?.roles?.some(role => role.name === 'System Administrator')) {
        return <AdminLayout>{children}</AdminLayout>;
    }
    
    if (user?.roles?.some(role => role.name === 'Parole Officer')) {
        return <OfficerLayout>{children}</OfficerLayout>;
    }
    
    if (user?.roles?.some(role => ['Case Manager', 'Support Staff'].includes(role.name))) {
        return <StaffLayout>{children}</StaffLayout>;
    }
    
    // Fallback layout or error state
    return <div>Access Denied</div>;
};

export default DashboardWrapper;