/* eslint-disable @typescript-eslint/no-explicit-any */
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import apiClient from '../services/api';
import type { ApiUser, UserPermissions, LoginResponse } from '../types/api';

interface AuthState {
    isAuthenticated: boolean;
    user: ApiUser | null;
    token: string | null;
    isLoading: boolean;
    login: (emailValue: string, passwordValue: string) => Promise<ApiUser | null>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>; // Exposed fetchUser for manual refresh if needed
    hasRole: (roleName: string) => boolean;
    permissions: UserPermissions; // This is the structured permissions object
    hasPermission: (permissionName: string) => boolean; // Checks raw permission string
    hasAnyPermission: (permissionNames: string[]) => boolean;
    hasAllPermissions: (permissionNames: string[]) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const DEFAULT_PERMISSIONS: UserPermissions = {
    portal_access: { admin: false, officer: false, staff: false },
    dashboards: { view_admin_dashboard: false, view_officer_dashboard: false, view_staff_dashboard: false },
    users: { manage: false, view: false, create: false, edit: false, delete: false, assignRoles: false, assignPermissions: false, viewProfiles: false, editProfiles: false, activate: false, deactivate: false, resetPassword: false },
    roleManagement: { view: false, create: false, edit: false, delete: false, assignPermissions: false, managePermissions: false, assignRoles: false, manageRoles: false },
    data_management: {
        ai: { view: false, analyze: false, export: false, manage_models: false, train_models: false, view_predictions: false },
        iot: { view: false, manage_devices: false, view_health_metrics: false, view_location_data: false, manage_alerts: false, configure_devices: false, view_telemetry: false, view_alerts: false },
        reports: { view: false, generate: false, export: false, schedule: false, share: false },
        notifications: { view: false, manage: false, configure: false },
    },
    tracking: { view: false, manage: false, alerts: false, viewHistory: false, exportData: false },
    system: { settings: false, logs: false, maintenance: false, backup: false, security: false },
    geofences: { view: false, create: false, edit: false, delete: false, assign: false, manage_alerts: false, view_history: false, manage: false, viewAlerts: false },
    assessments: { view: false, create: false, edit: false, delete: false, assign: false, review: false, export_results: false, manage: false },
    communications: { send_messages: false, view_messages: false, delete_messages: false, manage_channels: false, emergency_alerts: false, officer_communications: false },
    officer: { view_assigned_parolees: false, manage_communications: false },
    staff: { manage_messages: false, view_notifications: false },
};

const getDefaultPermissions = (): UserPermissions => JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)); // Deep clone

const mapPermissionsFromUser = (userData: ApiUser): UserPermissions => {
    if (!userData?.all_permissions) {
        return getDefaultPermissions();
    }
    const permissionSet = new Set(userData.all_permissions.map(p => p.name));
    const has = (permName: string): boolean => permissionSet.has(permName);

    return {
        portal_access: { admin: has('access admin portal'), officer: has('access officer portal'), staff: has('access staff portal') },
        dashboards: { view_admin_dashboard: has('view admin dashboard'), view_officer_dashboard: has('view officer dashboard'), view_staff_dashboard: has('view staff dashboard') },
        users: { manage: has('manage users'), view: has('view users'), create: has('create users'), edit: has('edit users'), delete: has('delete users'), assignRoles: has('assign roles to users'), assignPermissions: has('assign direct permissions to users'), viewProfiles: has('view user profiles'), editProfiles: has('edit user profiles'), activate: has('activate users'), deactivate: has('deactivate users'), resetPassword: has('reset user passwords') },
        roleManagement: { view: has('view roles'), create: has('create roles'), edit: has('edit roles'), delete: has('delete roles'), assignPermissions: has('assign permissions to roles'), managePermissions: has('manage permissions'), assignRoles: has('assign roles to users'), manageRoles: has('manage roles') },
        data_management: {
            ai: { view: has('view ai analytics'), analyze: has('view ai insights'), export: has('export ai data'), manage_models: has('manage ai models'), train_models: has('train ai models'), view_predictions: has('view ai predictions') },
            iot: { view: has('view iot data'), manage_devices: has('manage iot devices'), view_health_metrics: has('view iot health metrics'), view_location_data: has('view iot location data'), manage_alerts: has('manage iot alerts'), configure_devices: has('configure iot devices'), view_telemetry: has('view iot telemetry'), view_alerts: has('view iot alerts') },
            reports: { view: has('view reports'), generate: has('create reports'), export: has('export reports'), schedule: has('schedule reports'), share: has('share reports') },
            notifications: { view: has('view notifications'), manage: has('manage notifications'), configure: has('configure notifications') },
        },
        tracking: { view: has('view tracking data'), manage: has('manage tracking settings'), alerts: has('manage tracking alerts'), viewHistory: has('view tracking history'), exportData: has('export tracking data') },
        system: { settings: has('manage system settings'), logs: has('view system logs'), maintenance: has('perform system maintenance'), backup: has('manage system backup'), security: has('manage system security') },
        geofences: { view: has('view geofences'), create: has('create geofences'), edit: has('edit geofences'), delete: has('delete geofences'), assign: has('assign geofences'), manage_alerts: has('manage geofence alerts'), view_history: has('view geofence history'), manage: has('manage geofences'), viewAlerts: has('view geofence alerts') },
        assessments: { view: has('view assessments'), create: has('create assessments'), edit: has('edit assessments'), delete: has('delete assessments'), assign: has('assign assessments'), review: has('review assessments'), export_results: has('export assessment results'), manage: has('manage assessments') },
        communications: { send_messages: has('send messages'), view_messages: has('view messages'), delete_messages: has('delete messages'), manage_channels: has('manage communication channels'), emergency_alerts: has('send emergency alerts'), officer_communications: has('manage officer communications') },
        officer: { view_assigned_parolees: has('view officer assigned parolees'), manage_communications: has('manage officer communications') },
        staff: { manage_messages: has('manage staff messages'), view_notifications: has('view staff notifications') },
    };
};

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<ApiUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authPermissions, setAuthPermissions] = useState<UserPermissions>(getDefaultPermissions());

    const hasInitialized = useRef(false);
    const currentRequestRef = useRef<AbortController | null>(null);

    const clearAuthState = useCallback(() => {
        if (currentRequestRef.current) {
            currentRequestRef.current.abort();
            currentRequestRef.current = null;
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        delete apiClient.defaults.headers.common['Authorization'];

        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthPermissions(getDefaultPermissions());
        setIsLoading(false);
    }, []);

    const fetchUserInternal = useCallback(async (tokenToUse?: string): Promise<void> => {
        if (currentRequestRef.current) {
            currentRequestRef.current.abort();
        }
        const abortController = new AbortController();
        currentRequestRef.current = abortController;

        const currentTokenToUse = tokenToUse || token || localStorage.getItem('authToken');

        if (!currentTokenToUse) {
            // No token, ensure loading is false and no auth state is set unless clearAuthState does it
            if (isAuthenticated || user) { // only clear if there was prior auth state
                clearAuthState();
            } else {
                setIsLoading(false);
            }
            currentRequestRef.current = null;
            return;
        }

        setIsLoading(true); // Set loading true before fetch attempt
        try {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentTokenToUse}`;
            const response = await apiClient.get<ApiUser>('/user', { signal: abortController.signal });

            if (!abortController.signal.aborted) {
                const userData = response.data;
                const newPermissions = mapPermissionsFromUser(userData);

                setUser(userData);
                setIsAuthenticated(true);
                setAuthPermissions(newPermissions);
                setToken(currentTokenToUse); // Ensure token state is also updated
                localStorage.setItem('authUser', JSON.stringify(userData));
                // localStorage.setItem('authToken', currentTokenToUse); // authToken is already set or from localStorage
            }
        } catch (error: any) {
            if (!abortController.signal.aborted) {
                console.error('Failed to fetch user:', error);
                clearAuthState(); // This will set isLoading to false
            }
        } finally {
            if (currentRequestRef.current === abortController) {
                currentRequestRef.current = null;
            }
            // Only set loading to false if this specific request instance is finishing
            // and wasn't superseded by another call that would manage its own loading state.
            // However, clearAuthState or success path already handles isLoading.
            // If token was invalid and fetch failed, clearAuthState sets isLoading=false.
            // If token was null, it's set false above.
            // If successful, it should be set false.
            if (!abortController.signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [token, clearAuthState, isAuthenticated, user]); // Added isAuthenticated and user to deps of fetchUserInternal

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('authToken');
            const storedUserString = localStorage.getItem('authUser');

            if (storedToken) {
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                setToken(storedToken); // Set token state early

                if (storedUserString) {
                    try {
                        const storedUser = JSON.parse(storedUserString) as ApiUser;
                        setUser(storedUser);
                        setAuthPermissions(mapPermissionsFromUser(storedUser));
                        setIsAuthenticated(true);
                        // Optimistically set, will be verified by fetchUserInternal
                    } catch (e) {
                        console.error("Failed to parse stored user", e);
                        localStorage.removeItem('authUser'); // Clear invalid stored user
                    }
                }
                // Always fetch fresh user data to verify token and get latest info
                await fetchUserInternal(storedToken);
            } else {
                setIsLoading(false); // No token, not loading
            }
        };
        initializeAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // fetchUserInternal is stable due to its own useCallback

    const login = useCallback(async (email: string, password: string): Promise<ApiUser | null> => {
        setIsLoading(true);
        try {
            const response = await apiClient.post<LoginResponse>('/login', { email, password });
            const { token: newToken, user: userData } = response.data;

            localStorage.setItem('authToken', newToken);
            localStorage.setItem('authUser', JSON.stringify(userData));
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            const newPermissions = mapPermissionsFromUser(userData);

            setToken(newToken);
            setUser(userData);
            setIsAuthenticated(true);
            setAuthPermissions(newPermissions);
            setIsLoading(false);

            return userData;
        } catch (error: any) {
            setIsLoading(false);
            console.error('Login failed:', error);
            clearAuthState(); // Clear any partial state on login failure
            throw error;
        }
    }, [clearAuthState]);

    const logout = useCallback(async (): Promise<void> => {
        // Optimistically clear client state, then call API
        const currentTokenForLogout = token || localStorage.getItem('authToken');
        clearAuthState();

        if (currentTokenForLogout) {
            try {
                // apiClient's default header was cleared by clearAuthState, temporarily set it for logout
                await apiClient.post('/logout', {}, {
                    headers: { 'Authorization': `Bearer ${currentTokenForLogout}` }
                });
            } catch (error) {
                console.error('Logout API call failed:', error);
                // Client state is already cleared, so just log
            }
        }
    }, [clearAuthState, token]);

    // Memoize permission/role check functions based on stable stringified representations
    // of the underlying data to prevent unnecessary re-creations of these functions.
    const stringifiedUserRoles = useMemo(() => JSON.stringify(user?.roles?.map(r => r.name).sort() ?? []), [user?.roles]);
    const stringifiedAllPermissions = useMemo(() => JSON.stringify(user?.all_permissions?.map(p => p.name).sort() ?? []), [user?.all_permissions]);

    const memoizedHasRole = useCallback((roleName: string): boolean => {
        return user?.roles?.some(role => role.name === roleName) ?? false;
    }, [user?.roles, stringifiedUserRoles]); // user.roles to ensure closure has latest

    const memoizedHasPermission = useCallback((permissionName: string): boolean => {
        return user?.all_permissions?.some(p => p.name === permissionName) ?? false;
    }, [user?.all_permissions, stringifiedAllPermissions]);

    const memoizedHasAnyPermission = useCallback((permissionNames: string[]): boolean => {
        if (!user?.all_permissions || permissionNames.length === 0) return false;
        const userPermissionSet = new Set(user.all_permissions.map(p => p.name));
        return permissionNames.some(name => userPermissionSet.has(name));
    }, [user?.all_permissions, stringifiedAllPermissions]);

    const memoizedHasAllPermissions = useCallback((permissionNames: string[]): boolean => {
        if (!user?.all_permissions || permissionNames.length === 0) return false;
        const userPermissionSet = new Set(user.all_permissions.map(p => p.name));
        return permissionNames.every(name => userPermissionSet.has(name));
    }, [user?.all_permissions, stringifiedAllPermissions]);


    const contextValue = useMemo(() => ({
        isAuthenticated,
        user,
        token,
        isLoading,
        permissions: authPermissions, // The structured permissions object
        login,
        logout,
        fetchUser: fetchUserInternal, // Expose the internal fetch for manual refresh
        hasRole: memoizedHasRole,
        hasPermission: memoizedHasPermission,
        hasAnyPermission: memoizedHasAnyPermission,
        hasAllPermissions: memoizedHasAllPermissions,
    }), [
        isAuthenticated, user, token, isLoading, authPermissions,
        login, logout, fetchUserInternal,
        memoizedHasRole, memoizedHasPermission, memoizedHasAnyPermission, memoizedHasAllPermissions
    ]);

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};