// src/components/shared/AccessDeniedView.tsx
import React from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AccessDeniedViewProps {
  message?: string;
  portalName?: string; // e.g., "Admin Portal", "User Management"
}

const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({ message, portalName }) => {
  const defaultMessage = portalName 
    ? `You do not have sufficient permissions to access the ${portalName}.`
    : "You do not have sufficient permissions to access this page or feature.";

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <Lock className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Access Denied</h1>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        {message || defaultMessage}
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-brand-purple-600 text-white rounded hover:bg-brand-purple-700 transition-colors"
      >
        Go to Homepage
      </Link>
    </div>
  );
};

export default AccessDeniedView;