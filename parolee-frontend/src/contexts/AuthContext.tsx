// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../services/api'; // Your API client

// Define types for User and AuthState
interface User {
    id: number;
    name: string;
    email: string;
    user_type: 'admin' | 'officer' | 'staff' | 'parolee';
    roles: { name: string }[];
    permissions: { name: string }[];
    // Add other relevant user fields
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (emailValue: string, passwordValue: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    hasRole: (roleName: string) => boolean;
    hasPermission: (permissionName: string) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('authUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true

    useEffect(() => {
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setIsAuthenticated(true);
            if (!user) { // Fetch user if token exists but user data is not in state
                fetchUser().finally(() => setIsLoading(false));
            } else {
                setIsLoading(false);
            }
        } else {
            delete apiClient.defaults.headers.common['Authorization'];
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
        }
    }, [token]);


    const login = async (emailValue: string, passwordValue: string) => {
        try {
            const response = await apiClient.post('/login', { email: emailValue, password: passwordValue });
            const { token: newToken, user: userData } = response.data;
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('authUser', JSON.stringify(userData));
            setToken(newToken);
            setUser(userData);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Login failed:', error);
            // You might want to set an error state here to display to the user
            throw error; // Re-throw to be caught by the login form
        }
    };

    const logout = async () => {
        try {
            if (token) {
                await apiClient.post('/logout');
            }
        } catch (error) {
            console.error('Logout failed on server, clearing client-side anyway:', error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const fetchUser = async () => {
        if (!token && !localStorage.getItem('authToken')) {
             setIsLoading(false);
             return;
        }
        setIsLoading(true);
        try {
            const response = await apiClient.get('/user');
            localStorage.setItem('authUser', JSON.stringify(response.data));
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            // This might happen if token is invalid, interceptor should handle it
            // but we can also clear state here as a fallback
            if ((error as any).response?.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            }
        } finally {
             setIsLoading(false);
        }
    };

    const hasRole = (roleName: string): boolean => {
        return user?.roles?.some(role => role.name === roleName) || false;
    };

    const hasPermission = (permissionName: string): boolean => {
        return user?.permissions?.some(permission => permission.name === permissionName) || false;
    };


    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, fetchUser, isLoading, hasRole, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthState => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};