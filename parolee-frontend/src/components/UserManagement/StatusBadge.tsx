// src/components/UserManagement/StatusBadge.tsx
import React from 'react';

// Define the possible status values based on your ApiUser type
type UserStatus = 'active' | 'pending' | 'suspended' | 'inactive' | 'high_risk' | 'violation' | string; // Add string for flexibility

interface StatusBadgeProps {
    status: UserStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; // Default
    let text = status.replace('_', ' ');

    switch (status.toLowerCase()) {
        case 'active':
            colorClasses = 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200';
            break;
        case 'pending':
            colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200';
            break;
        case 'suspended':
            colorClasses = 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-200';
            break;
        case 'inactive':
            colorClasses = 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300';
            break;
        case 'high_risk':
            colorClasses = 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200 border border-red-300 dark:border-red-600';
            text = 'High Risk'; // Custom text
            break;
        case 'violation':
            colorClasses = 'bg-pink-100 text-pink-800 dark:bg-pink-700 dark:text-pink-200 border border-pink-300 dark:border-pink-600';
            break;
        default:
            text = 'Unknown';
            break;
    }

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClasses}`}>
            {text}
        </span>
    );
};

export default StatusBadge;