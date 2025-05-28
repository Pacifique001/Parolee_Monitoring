import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Export the provider component as default
export default function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { user } = useAuth();

    // Fetch notifications when user changes
    React.useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/api/notifications');
            // Ensure the response data is an array
            const notificationsData = Array.isArray(response.data) ? response.data : [];
            setNotifications(notificationsData);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            // Set empty array on error
            setNotifications([]);
        }
    };

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substring(7);
        const newNotification = { ...notification, id };

        setNotifications(prev => [...prev, newNotification]);

        if (notification.duration !== 0) {
            setTimeout(() => {
                removeNotification(id);
            }, notification.duration || 5000);
        }
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const value = {
        notifications,
        addNotification,
        removeNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

// Export the hook as a named export
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

// Also export the provider as a named export for flexibility
export { NotificationProvider };