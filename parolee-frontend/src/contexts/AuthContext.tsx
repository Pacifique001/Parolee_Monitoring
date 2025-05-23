// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../services/api';
import type { ApiUser } from '../types/api'; // Only ApiUser is needed here as User extends it

// The User type for the context can directly be ApiUser or extend it if needed
interface User extends ApiUser {}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (emailValue: string, passwordValue: string) => Promise<User | null>;
    logout: () => Promise<void>;
    // fetchUser is internal, not necessarily needed in AuthState interface for external consumption
    // but keeping it if other parts of app might trigger it.
    fetchUser: () => Promise<void>;
    hasRole: (roleName: string) => boolean;
    hasPermission: (permissionName: string) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('authUser');
        try {
            return storedUser ? JSON.parse(storedUser) as User : null;
        } catch (error) {
            console.error("Failed to parse stored user:", error);
            localStorage.removeItem('authUser'); // Clear corrupted data
            return null;
        }
    });
    const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token); // Initial auth state based on token
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start true for initial auth check

    const fetchUserInternal = async () => {
        const currentToken = token || localStorage.getItem('authToken');
        if (!currentToken) {
            setIsLoading(false);
            // Ensure state is cleared if no token
            if (isAuthenticated) setIsAuthenticated(false);
            if (user) setUser(null);
            return;
        }

        // Ensure Axios header is set if not already
        if (apiClient.defaults.headers.common['Authorization'] !== `Bearer ${currentToken}`) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.get<User>('/user'); // Expecting User type directly
            localStorage.setItem('authUser', JSON.stringify(response.data));
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (error: any) {
            console.error('Failed to fetch user:', error.response?.data?.message || error.message);
            if (error.response?.status === 401) { // Token is invalid or expired
                // Call logoutInternal to clear everything without an API call loop
                clearClientSideAuth();
            }
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        // This effect runs once on mount to initialize authentication state
        // and tries to fetch the user if a token exists.
        const currentToken = localStorage.getItem('authToken');
        if (currentToken) {
            setToken(currentToken); // Sync state with localStorage
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
            setIsAuthenticated(true); // Assume authenticated if token exists
            fetchUserInternal(); // Then verify by fetching user
        } else {
            setIsLoading(false); // No token, so not loading, not authenticated
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array: run only on mount


    // This effect reacts to programmatic token changes (login/logout)
    useEffect(() => {
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setIsAuthenticated(true);
            // No need to fetch user here again if login already set it.
            // If token is set manually without user, fetchUserInternal could be called.
        } else {
            delete apiClient.defaults.headers.common['Authorization'];
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('authUser');
            localStorage.removeItem('authToken');
        }
    }, [token]);


    const login = async (emailValue: string, passwordValue: string): Promise<User | null> => {
        setIsLoading(true);
        try {
            const response = await apiClient.post<{
                message: string;
                user: User;
                token: string;
                token_type: string;
            }>('/login', { email: emailValue, password: passwordValue });

            const { token: newToken, user: userData } = response.data;
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('authUser', JSON.stringify(userData));
            setToken(newToken); // This will trigger the useEffect above to set axios header and isAuthenticated
            setUser(userData);
            setIsLoading(false);
            return userData;
        } catch (error) {
            console.error('Login failed in AuthContext:', error);
            clearClientSideAuth(); // Clear all auth state on login failure
            setIsLoading(false);
            throw error;
        }
    };

    const clearClientSideAuth = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false); // Explicitly set to false
        delete apiClient.defaults.headers.common['Authorization'];
    };


    const logout = async () => {
        setIsLoading(true);
        try {
            // Only call API logout if there's a token we believe is valid
            if (token || localStorage.getItem('authToken')) {
                 // Ensure header is set before logout call, just in case
                if (!apiClient.defaults.headers.common['Authorization'] && localStorage.getItem('authToken')) {
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
                }
                await apiClient.post('/logout');
            }
        } catch (error) {
            console.error('Logout API call failed, clearing client-side anyway:', error);
        } finally {
            clearClientSideAuth();
            setIsLoading(false);
        }
    };


    const hasRole = (roleName: string): boolean => {
        return user?.roles?.some(role => role.name === roleName) || false;
    };

    const hasPermission = (permissionName: string): boolean => {
        return user?.all_permissions?.some(permission => permission.name === permissionName) || false;
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, fetchUser: fetchUserInternal, isLoading, hasRole, hasPermission }}>
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