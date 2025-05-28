/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/SystemLogsPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout'; // Adjust path as needed
import apiClient from '../../services/api';     // Adjust path as needed
import { format } from 'date-fns';
import { UserCheck, Bell, Shield, AlertCircle, Activity, Search, MapPin, Smartphone, Users } from 'lucide-react';

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

const LogTypeDisplay: React.FC<{ type: string; action: string }> = ({ type, action }) => {
    let IconComponent = Activity;
    let colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    let displayText = type.replace('_', ' ');

    const normalizedType = type.toLowerCase();
    const normalizedAction = action.toLowerCase();

    switch(true) {
        case normalizedType.includes('auth') || normalizedAction.includes('login') || normalizedAction.includes('logout'):
            IconComponent = UserCheck;
            colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            displayText = 'Authentication';
            break;
        case normalizedType.includes('geofence'):
            IconComponent = MapPin;
            colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            displayText = 'Geofence';
            break;
        case normalizedType.includes('iot'):
            IconComponent = Smartphone;
            colorClasses = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            displayText = 'IoT Device';
            break;
        // Add more cases for other types
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClasses}`}>
            <IconComponent size={14} className="mr-1.5 flex-shrink-0" />
            {displayText}
        </span>
    );
};

const LogDetailsDisplay: React.FC<{ details: ActivityLogEntry['details'] }> = ({ details }) => {
    if (!details) return <span>N/A</span>;

    if (typeof details === 'string') {
        return <span>{details}</span>;
    }

    // For object details, create a more readable format
    const formattedDetails = Object.entries(details).map(([key, value]) => {
        const formattedValue = typeof value === 'object' ? JSON.stringify(value) : value;
        return `${key}: ${formattedValue}`;
    }).join(' | ');

    return (
        <div className="group relative">
            <span className="cursor-help truncate max-w-xs inline-block">
                {formattedDetails}
            </span>
            {/* Tooltip with full details */}
            <div className="hidden group-hover:block absolute z-10 p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-pre-wrap max-w-lg left-0 top-full mt-1">
                {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="mb-1">
                        <span className="font-semibold">{key}:</span>{' '}
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : value?.toString()}
                    </div>
                ))}
            </div>
        </div>
    );
};

const SystemLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
    const [logSummary, setLogSummary] = useState<LogSummaryFromApi | null>(null); // Use LogSummaryFromApi
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
            params.append('per_page', '10');
            
            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }
            if (dateRange.start) params.append('start_date', dateRange.start);
            if (dateRange.end) params.append('end_date', dateRange.end);
            if (selectedTypes.length > 0) params.append('types', selectedTypes.join(','));
            if (selectedStatus !== 'all') params.append('status', selectedStatus);

            const response = await apiClient.get<SystemLogsApiResponse>(`/admin/system-logs?${params.toString()}`);
            setLogs(response.data.data);
            setPagination(response.data.meta);
            if (response.data.meta?.summary) {
                setLogSummary(response.data.meta.summary);
            }
        } catch (err: any) {
            console.error("Failed to fetch system logs:", err);
            setError(err.response?.data?.message || "Failed to load system logs.");
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, dateRange, selectedTypes, selectedStatus]);

    useEffect(() => {
        fetchLogs(currentPage);
    }, [fetchLogs, currentPage]); // fetchLogs is stable due to useCallback with its own deps

    // Prepare data for summary cards using API data or defaults
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
            label: 'Geofence Operations', 
            value: logSummary?.geofence_operations ?? 0, 
            icon: MapPin, 
            color: 'text-green-600 dark:text-green-400', 
            bgColor: 'bg-green-100 dark:bg-green-900/30' 
        },
        { 
            label: 'IoT Operations', 
            value: logSummary?.iot_operations ?? 0, 
            icon: Smartphone, 
            color: 'text-purple-600 dark:text-purple-400', 
            bgColor: 'bg-purple-100 dark:bg-purple-900/30' 
        }
    ], [logSummary]);


    return (
        <AdminLayout>
            <title>System Logs - Parole Monitoring Admin</title>
            <div className="flex-1 p-6 ml-64">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">System Logs</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monitor system activities and security events.</p>
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

                {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/50 rounded-md">{error}</div>}

                {/* Recent System Logs Table */}
                <div className="bg-white dark:bg-brand-gray-admin-card rounded-lg shadow">
                    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent System Logs</h3>
                        {/* TODO: Add more filter controls here (Date pickers, Type dropdown) */}
                        <div className="relative w-full sm:w-auto sm:max-w-xs">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </span>
                            <input
                                type="search"
                                placeholder="Search by action/description..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}} // Reset to page 1 on new search
                                className="input-style w-full pl-10"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-brand-gray-admin-card divide-y divide-gray-200 dark:divide-gray-700">
                                {isLoading && logs.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading logs...</td></tr>
                                )}
                                {!isLoading && logs.length === 0 && (
                                     <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">No system logs found{searchTerm && ` matching "${searchTerm}"`}.</td></tr>
                                )}
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap"><LogTypeDisplay type={log.type} action={log.action} /></td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{log.user_identifier}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{log.action}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            <LogDetailsDisplay details={log.details} />
                                        </td>
                                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {log.subject_details?.type ? `${log.subject_details.type} (ID: ${log.subject_details.id || 'N/A'})` : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading} className="pagination-button">Previous</button>
                                <button onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} disabled={currentPage === pagination.last_page || isLoading} className="pagination-button">Next</button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs text-gray-700 dark:text-gray-300">
                                        Showing <span className="font-medium">{pagination.from}</span> to <span className="font-medium">{pagination.to}</span> of <span className="font-medium">{pagination.total}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading} className="pagination-button rounded-l-md text-xs px-3 py-1.5">Previous</button>
                                        <span className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400">Page {currentPage} of {pagination.last_page}</span>
                                        <button onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))} disabled={currentPage === pagination.last_page || isLoading} className="pagination-button rounded-r-md text-xs px-3 py-1.5">Next</button>
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