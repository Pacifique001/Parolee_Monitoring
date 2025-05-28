import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from './AdminLayout';
import OfficerLayout from './OfficerLayout';
import StaffLayout from './StaffLayout';
import { Outlet } from 'react-router-dom';

const SharedLayout: React.FC = () => {
    const { hasPermission } = useAuth();

    if (hasPermission('access admin portal')) {
        return <AdminLayout><Outlet /></AdminLayout>;
    }
    if (hasPermission('access officer portal')) {
        return <OfficerLayout><Outlet /></OfficerLayout>;
    }
    if (hasPermission('access staff portal')) {
        return <StaffLayout><Outlet /></StaffLayout>;
    }

    return <div>No access</div>;
};

export default SharedLayout;