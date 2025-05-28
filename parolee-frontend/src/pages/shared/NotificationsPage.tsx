// src/pages/staff/NotificationsPage.tsx
import React, { useEffect, useState } from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import { Bell, CheckCircle, AlertCircle, MessageSquare as MessageIcon, Info } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import apiClient from '../../services/api'; // Axios instance or fetch wrapper

interface NotificationItem {
    id: string | number;
    message: string;
    type: 'assessment_update' | 'new_message' | 'system_alert' | 'task_reminder';
    timestamp: string; // ISO string
    isRead: boolean;
    link?: string; // Optional link to related item
}

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch notifications from API
    const fetchNotifications = async (page: number = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/staff/notifications', {
                params: { page },
            });
            setNotifications(response.data.data || []);
            setCurrentPage(response.data.meta.current_page || 1);
            setTotalPages(response.data.meta.last_page || 1);
        } catch (err) {
            setError('Failed to fetch notifications.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Mark a single notification as read
    const markAsRead = async (id: string | number) => {
        try {
            await apiClient.post(`/staff/notifications/${id}/mark-as-read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            await apiClient.post('/staff/notifications/mark-all-as-read');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    const getNotificationIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'assessment_update':
                return <CheckCircle className="text-green-500" />;
            case 'new_message':
                return <MessageIcon className="text-blue-500" />;
            case 'system_alert':
                return <AlertCircle className="text-yellow-500" />;
            case 'task_reminder':
                return <Bell className="text-purple-500" />;
            default:
                return <Info className="text-gray-500" />;
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchNotifications(newPage);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <StaffLayout>
            <title>Notifications - Staff Portal</title>
            {/* Add flex-1 and margin-left for sidebar width, plus consistent padding */}
            <div className="flex-1 p-6 ml-64">
                <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                <Bell size={28} className="mr-3 text-brand-purple-admin" />
                                Notifications
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Recent updates and alerts relevant to your work.
                            </p>
                        </div>
                        <button
                            onClick={markAllAsRead}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm flex items-center"
                        >
                            <CheckCircle size={16} className="mr-2" />
                            Mark all as read
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                        {isLoading && notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                No notifications to display.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {notifications.map((notif) => (
                                    <li
                                        key={notif.id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                            !notif.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 pt-1">
                                                {getNotificationIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm text-gray-800 dark:text-gray-100 ${
                                                    !notif.isRead ? 'font-semibold' : ''
                                                }`}>
                                                    {notif.link ? (
                                                        <a href={notif.link} className="hover:underline">
                                                            {notif.message}
                                                        </a>
                                                    ) : (
                                                        notif.message
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDistanceToNowStrict(new Date(notif.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {!notif.isRead && (
                                                <button
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </StaffLayout>
    );
};

export default NotificationsPage;