/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/SystemLogsPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout'; // Adjust path as needed
import apiClient from '../../services/api';     // Adjust path as needed
import { format } from 'date-fns';
import { 
    UserCheck, Bell, Shield, AlertCircle, Activity, Search, MapPin, 
    Smartphone, Users, LogIn, LogOut, UserPlus, UserMinus, Edit3,
    Database, Settings, Lock, Unlock, Eye, FileText, Calendar,
    CheckCircle, XCircle
} from 'lucide-react';

// Matches the structure from ActivityLogResource
interface ActivityLogEntry {
    id: number;
    timestamp: string;
    type: string;
    user_identifier: string;
    action: string;
    details: string | Record<string, any> | null;
    subject_details?: {
        type: string | null;
        id: number | null;
        description: string | null;
    };
    ip_address?: string | null;
    success?: boolean;
    category?: string; // Add category for better grouping
}

interface LogSummaryFromApi {
    login_events: number;
    system_alerts: number;
    modifications: number;
    violations: number;
    user_management: number;
    geofence_operations: number;
    iot_operations: number;
    role_operations: number;
    assessment_operations: number;
    communication_events: number;
}

interface SystemLogsApiResponse {
    data: ActivityLogEntry[];
    links: { first?: string; last?: string; prev?: string | null; next?: string | null; };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        path: string;
        per_page: number;
        to: number;
        total: number;
        summary?: LogSummaryFromApi; // Now expects this structure from API
    };
}

const LogTypeDisplay: React.FC<{ type: string; action: string; success?: boolean }> = ({ type, action, success }) => {
    let IconComponent = Activity;
    let colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    let displayText = type.replace(/[_-]/g, ' ');

    const normalizedType = type.toLowerCase();
    const normalizedAction = action.toLowerCase();

    // Enhanced type detection with more comprehensive matching
    switch(true) {
        // Authentication Events
        case normalizedAction.includes('login') || normalizedAction.includes('logged in'):
            IconComponent = LogIn;
            colorClasses = success !== false 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            displayText = 'Login';
            break;
        case normalizedAction.includes('logout') || normalizedAction.includes('logged out'):
            IconComponent = LogOut;
            colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            displayText = 'Logout';
            break;
        case normalizedType.includes('auth') || normalizedAction.includes('authenticate'):
            IconComponent = UserCheck;
            colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            displayText = 'Authentication';
            break;

        // User Management
        case normalizedAction.includes('created user') || normalizedAction.includes('user created'):
            IconComponent = UserPlus;
            colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            displayText = 'User Created';
            break;
        case normalizedAction.includes('updated user') || normalizedAction.includes('user updated') || normalizedAction.includes('modified user'):
            IconComponent = Edit3;
            colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            displayText = 'User Modified';
            break;
        case normalizedAction.includes('deleted user') || normalizedAction.includes('user deleted'):
            IconComponent = UserMinus;
            colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            displayText = 'User Deleted';
            break;
        case normalizedType.includes('user') || normalizedAction.includes('user'):
            IconComponent = Users;
            colorClasses = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
            displayText = 'User Management';
            break;

        // Geofence Operations
        case normalizedType.includes('geofence') || normalizedAction.includes('geofence'):
            IconComponent = MapPin;
            colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            displayText = 'Geofence';
            break;

        // IoT Operations
        case normalizedType.includes('iot') || normalizedType.includes('device') || normalizedAction.includes('device'):
            IconComponent = Smartphone;
            colorClasses = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            displayText = 'IoT Device';
            break;

        // Role Operations
        case normalizedType.includes('role') || normalizedAction.includes('role'):
            IconComponent = Shield;
            colorClasses = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            displayText = 'Role Management';
            break;

        // Assessment Operations
        case normalizedType.includes('assessment') || normalizedAction.includes('assessment'):
            IconComponent = FileText;
            colorClasses = 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
            displayText = 'Assessment';
            break;

        // System Operations
        case normalizedAction.includes('view') || normalizedAction.includes('viewed') || normalizedAction.includes('accessed'):
            IconComponent = Eye;
            colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            displayText = 'View/Access';
            break;
        case normalizedAction.includes('create') || normalizedAction.includes('created'):
            IconComponent = UserPlus;
            colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            displayText = 'Created';
            break;
        case normalizedAction.includes('update') || normalizedAction.includes('updated') || normalizedAction.includes('edit') || normalizedAction.includes('modified'):
            IconComponent = Edit3;
            colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            displayText = 'Updated';
            break;
        case normalizedAction.includes('delete') || normalizedAction.includes('deleted') || normalizedAction.includes('remove'):
            IconComponent = UserMinus;
            colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            displayText = 'Deleted';
            break;

        // Security Events
        case normalizedType.includes('security') || normalizedAction.includes('lock') || normalizedAction.includes('unlock'):
            IconComponent = normalizedAction.includes('unlock') ? Unlock : Lock;
            colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            displayText = 'Security';
            break;

        // Alerts and Violations
        case normalizedType.includes('alert') || normalizedType.includes('violation') || normalizedAction.includes('alert'):
            IconComponent = AlertCircle;
            colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            displayText = 'Alert/Violation';
            break;

        // Communication Events
        case normalizedType.includes('communication') || normalizedAction.includes('message') || normalizedAction.includes('notification'):
            IconComponent = Bell;
            colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            displayText = 'Communication';
            break;

        // Database Operations
        case normalizedType.includes('database') || normalizedAction.includes('backup') || normalizedAction.includes('restore'):
            IconComponent = Database;
            colorClasses = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
            displayText = 'Database';
            break;

        // System Settings
        case normalizedType.includes('setting') || normalizedType.includes('config') || normalizedAction.includes('setting'):
            IconComponent = Settings;
            colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            displayText = 'Settings';
            break;

        // Default case - try to extract meaningful info from type or action
        default:
            // Try to get a better display name from the type or action
            if (normalizedType !== 'activity_log' && normalizedType !== 'log') {
                displayText = type.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            } else if (normalizedAction) {
                displayText = action.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            break;
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
            <IconComponent size={14} className="mr-1.5 flex-shrink-0" />
            {displayText}
            {success === false && (
                <XCircle size={12} className="ml-1 text-red-500" />
            )}
            {success === true && normalizedAction.includes('login') && (
                <CheckCircle size={12} className="ml-1 text-green-500" />
            )}
        </span>
    );
};

const LogDetailsDisplay: React.FC<{ details: ActivityLogEntry['details'] }> = ({ details }) => {
    if (!details) return <span className="text-gray-400">N/A</span>;

    if (typeof details === 'string') {
        return <span className="text-sm">{details}</span>;
    }

    // For object details, create a more readable format
    const formattedEntries = Object.entries(details);
    const displayText = formattedEntries.slice(0, 2).map(([key, value]) => {
        const formattedKey = key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const formattedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `${formattedKey}: ${formattedValue}`;
    }).join(' | ');

    return (
        <div className="group relative">
            <span className="cursor-help text-sm max-w-xs inline-block truncate">
                {displayText}
                {formattedEntries.length > 2 && '...'}
            </span>
            {/* Enhanced tooltip with better formatting */}
            <div className="hidden group-hover:block absolute z-20 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap max-w-md left-0 top-full mt-2 border border-gray-700">
                <div className="space-y-2">
                    {formattedEntries.map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                            <span className="font-semibold text-blue-300">{key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                            <span className="ml-2 text-gray-200">
                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SystemLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
    const [logSummary, setLogSummary] = useState<LogSummaryFromApi | null>(null);
    const [pagination, setPagination] = useState<SystemLogsApiResponse['meta'] | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'success' | 'failed'>('all');

    const fetchLogs = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('per_page', '15'); // Increased to show more logs
            
            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }
            if (dateRange.start) params.append('start_date', dateRange.start);
            if (dateRange.end) params.append('end_date', dateRange.end);
            if (selectedTypes.length > 0) params.append('types', selectedTypes.join(','));
            if (selectedStatus !== 'all') params.append('status', selectedStatus);

            // Add parameter to include all activity types
            params.append('include_all', 'true');

            const response = await apiClient.get<SystemLogsApiResponse>(`/admin/system-logs?${params.toString()}`);
            setLogs(response.data.data);
            setPagination(response.data.meta);
            if (response.data.meta?.summary) {
                setLogSummary(response.data.meta.summary);
            }
        } catch (err: any) {
            console.error("Failed to fetch system logs:", err);
            setError(err.response?.data?.message || "Failed to load system logs. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, dateRange, selectedTypes, selectedStatus]);

    useEffect(() => {
        fetchLogs(currentPage);
    }, [fetchLogs, currentPage]);

    // Enhanced summary cards with better categorization
    const summaryCardsData = useMemo(() => [
        { 
            label: 'Authentication Events', 
            value: logSummary?.login_events ?? 0, 
            icon: UserCheck, 
            color: 'text-blue-600 dark:text-blue-400', 
            bgColor: 'bg-blue-100 dark:bg-blue-900/30' 
        },
        { 
            label: 'User Management', 
            value: logSummary?.user_management ?? 0, 
            icon: Users, 
            color: 'text-indigo-600 dark:text-indigo-400', 
            bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' 
        },
        { 
            label: 'System Operations', 
            value: logSummary?.modifications ?? 0, 
            icon: Settings, 
            color: 'text-gray-600 dark:text-gray-400', 
            bgColor: 'bg-gray-100 dark:bg-gray-900/30' 
        },
        { 
            label: 'Security Alerts', 
            value: logSummary?.system_alerts ?? 0, 
            icon: AlertCircle, 
            color: 'text-red-600 dark:text-red-400', 
            bgColor: 'bg-red-100 dark:bg-red-900/30' 
        }
    ], [logSummary]);

    const handleRefresh = () => {
        fetchLogs(currentPage);
    };

    return (
        <AdminLayout>
            <title>System Logs - Parole Monitoring Admin</title>
            <div className="flex-1 p-6 ml-64">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">System Logs</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Monitor all system activities and security events.</p>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {summaryCardsData.map(card => (
                        <div key={card.label} className="bg-white dark:bg-brand-gray-admin-card p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-full ${card.bgColor} flex-shrink-0`}>
                                    <card.icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                                <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{card.value}</p>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                    </div>
                )}

                {/* Enhanced System Logs Table */}
                <div className="bg-white dark:bg-brand-gray-admin-card rounded-lg shadow">
                    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">All System Activities</h3>
                        <div className="relative w-full sm:w-auto sm:max-w-xs">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </span>
                            <input
                                type="search"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
                                className="input-style w-full pl-10"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Activity Type</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-brand-gray-admin-card divide-y divide-gray-200 dark:divide-gray-700">
                                {isLoading && logs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <Activity className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Loading system logs...</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && logs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    No system logs found{searchTerm && ` matching "${searchTerm}"`}.
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <LogTypeDisplay type={log.type} action={log.action} success={log.success} />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 font-medium">
                                            {log.user_identifier || 'System'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                                            <span className="font-medium">{log.action}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                            <LogDetailsDisplay details={log.details} />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {log.subject_details?.type ? 
                                                `${log.subject_details.type} (ID: ${log.subject_details.id || 'N/A'})` : 
                                                <span className="text-gray-400">N/A</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {log.ip_address || <span className="text-gray-400">N/A</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Enhanced Pagination Controls */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                                    disabled={currentPage === 1 || isLoading} 
                                    className="pagination-button"
                                >
                                    Previous
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} 
                                    disabled={currentPage === pagination.last_page || isLoading} 
                                    className="pagination-button"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs text-gray-700 dark:text-gray-300">
                                        Showing <span className="font-medium">{pagination.from}</span> to{' '}
                                        <span className="font-medium">{pagination.to}</span> of{' '}
                                        <span className="font-medium">{pagination.total}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button 
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                                            disabled={currentPage === 1 || isLoading} 
                                            className="pagination-button rounded-l-md text-xs px-3 py-1.5"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Page {currentPage} of {pagination.last_page}
                                        </span>
                                        <button 
                                            onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} 
                                            disabled={currentPage === pagination.last_page || isLoading} 
                                            className="pagination-button rounded-r-md text-xs px-3 py-1.5"
                                        >
                                            Next
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default SystemLogsPage;