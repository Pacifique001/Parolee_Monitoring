import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HomeIcon, ArrowLeftIcon } from 'lucide-react';

const NotFoundPage: React.FC = () => {
    const { hasRole, isAuthenticated } = useAuth();
    const location = useLocation();

    const getDashboardLink = () => {
        if (!isAuthenticated) return '/';
        if (hasRole('System Administrator')) return '/admin/dashboard';
        if (hasRole('Parole Officer')) return '/officer/dashboard';
        if (hasRole('Case Manager') || hasRole('Support Staff')) return '/staff/dashboard';
        return '/';
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                <div className="mb-8">
                    <h1 className="text-8xl font-bold text-brand-purple-admin mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Page Not Found
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        The page <span className="font-mono bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                            {location.pathname}
                        </span> could not be found.
                    </p>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Please check the URL or navigate back to your dashboard.
                    </p>
                    
                    <div className="flex justify-center space-x-4">
                        <button 
                            onClick={() => window.history.back()}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Go Back
                        </button>
                        
                        <Link 
                            to={getDashboardLink()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-purple-admin hover:bg-brand-purple-admin/90"
                        >
                            <HomeIcon className="h-4 w-4 mr-2" />
                            {isAuthenticated ? 'Return to Dashboard' : 'Return Home'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;