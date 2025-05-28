/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/api.ts

// Basic Role and Permission structure from API
export interface ApiRole {
    id?: number;
    name: string;
    guard_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ApiPermission {
    id: number;
    name: string;
    display_name?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    guard_name?: string;
}

// Profile Structures (matching your API Resources and Models)
export interface ApiParoleeProfile {
    id: number;
    parole_id_number: string;
    conditions: string[];
    emergency_contact: {
        name: string;
        phone: string;
        relationship: string;
    };
    imprisonment_date: string;
    release_date: string;
    expected_end_date: string;
    home_address: string;
    current_risk_level: string;
    assessment_notes: string;
    created_at?: string;
    updated_at?: string;
}

export interface ApiOfficerProfile {
    id?: number;
    badge_number: string;
    rank?: string | null;
    department?: string | null;
    unit?: string | null;
    caseload?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface ApiRehabStaffProfile {
    id?: number;
    staff_role: string;
    department?: string | null;
    specialization?: string | null;
    degree?: string | null;
    created_at?: string;
    updated_at?: string;
}

// Main User structure from API (matching UserResource)
export interface ApiUser {
    id: number;
    name: string;
    email: string;
    phone: string;
    user_type: 'parolee' | 'officer' | 'staff' | 'admin';
    status: 'active' | 'pending' | 'suspended' | 'inactive' | 'high_risk' | 'violation';
    roles?: ApiRole[];
    direct_permissions?: ApiPermission[];
    all_permissions?: ApiPermission[];
    created_at: string;
    updated_at: string;
    parolee_profile?: ApiParoleeProfile;
    officer_profile?: ApiOfficerProfile;
    rehab_staff_profile?: ApiRehabStaffProfile;
}

// For the form, we might need a slightly different structure for submission
export interface UserFormData {
    id?: number;
    name: string;
    email: string;
    phone: string;
    user_type: 'parolee' | 'officer' | 'staff' | 'admin';
    status: 'active' | 'pending' | 'suspended' | 'inactive' | 'high_risk' | 'violation';
    roles: string[];
    directPermissions: string[];
    all_permissions: string[];
    password?: string; // Password is optional for edit
    password_confirmation?: string;
    parolee_profile?: Partial<ApiParoleeProfile>;
    officer_profile?: Partial<ApiOfficerProfile>;
    rehab_staff_profile?: Partial<ApiRehabStaffProfile>;
}

// Comprehensive permissions interface matching database seeder
export interface UserPermissions {
    portal_access: {
        admin: boolean;
        officer: boolean;
        staff: boolean;
    };
    dashboards: {
        view_admin_dashboard: boolean;
        view_officer_dashboard: boolean;
        view_staff_dashboard: boolean;
    };
    users: {
        manage: boolean;
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
        assignRoles: boolean;
        assignPermissions: boolean;
        viewProfiles: boolean;
        editProfiles: boolean;
        activate: boolean;
        deactivate: boolean;
        resetPassword: boolean;
    };
    roleManagement: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
        assignPermissions: boolean;
        managePermissions: boolean;
        assignRoles: boolean;
        manageRoles: boolean;
    };
    data_management: {
        ai: {
            view: boolean;
            analyze: boolean;
            export: boolean;
            manage_models: boolean;
            train_models: boolean;
            view_predictions: boolean;
        };
        iot: {
            view: boolean;
            manage_devices: boolean;
            view_health_metrics: boolean;
            view_location_data: boolean;
            manage_alerts: boolean;
            configure_devices: boolean;
            view_telemetry: boolean;
            view_alerts: boolean; // Added for 'view iot alerts'
        };
        reports: {
            view: boolean;
            generate: boolean;
            export: boolean;
            schedule: boolean;
            share: boolean;
        };
        notifications: {
            view: boolean;
            manage: boolean;
            configure: boolean;
        };
    };
    tracking: {
        view: boolean;
        manage: boolean;
        alerts: boolean;
        viewHistory: boolean;
        exportData: boolean;
    };
    system: {
        settings: boolean;
        logs: boolean;
        maintenance: boolean;
        backup: boolean;
        security: boolean;
    };
    // Removed duplicate top-level iot, consolidated into data_management.iot
    geofences: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
        assign: boolean;
        manage_alerts: boolean;
        view_history: boolean;
        manage: boolean;
        viewAlerts: boolean;
    };
    assessments: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
        assign: boolean;
        review: boolean;
        export_results: boolean;
        manage: boolean;
    };
    communications: {
        send_messages: boolean;
        view_messages: boolean;
        delete_messages: boolean;
        manage_channels: boolean;
        emergency_alerts: boolean;
        officer_communications: boolean;
    };
    officer: {
        view_assigned_parolees: boolean;
        manage_communications: boolean;
    };
    staff: {
        manage_messages: boolean;
        view_notifications: boolean;
    };
}

// Type for the lists displayed in each tab
export type DisplayUser = ApiUser;

// Enum for permission names (matching database)
export const PermissionName = {
    // Portal Access
    ACCESS_ADMIN_PORTAL: 'access admin portal',
    ACCESS_OFFICER_PORTAL: 'access officer portal',
    ACCESS_STAFF_PORTAL: 'access staff portal',

    // Dashboard Views
    VIEW_ADMIN_DASHBOARD: 'view admin dashboard',
    VIEW_OFFICER_DASHBOARD: 'view officer dashboard',
    VIEW_STAFF_DASHBOARD: 'view staff dashboard',

    // User Management
    MANAGE_USERS: 'manage users',
    VIEW_USERS: 'view users',
    CREATE_USERS: 'create users',
    EDIT_USERS: 'edit users',
    DELETE_USERS: 'delete users',
    ASSIGN_ROLES_TO_USERS: 'assign roles to users',
    ASSIGN_DIRECT_PERMISSIONS_TO_USERS: 'assign direct permissions to users',
    VIEW_USER_PROFILES: 'view user profiles',
    EDIT_USER_PROFILES: 'edit user profiles',
    ACTIVATE_USERS: 'activate users',
    DEACTIVATE_USERS: 'deactivate users',
    RESET_USER_PASSWORDS: 'reset user passwords',

    // Role & Permission Management
    VIEW_ROLES: 'view roles',
    CREATE_ROLES: 'create roles',
    EDIT_ROLES: 'edit roles',
    DELETE_ROLES: 'delete roles',
    MANAGE_ROLES: 'manage roles',
    MANAGE_PERMISSIONS: 'manage permissions',
    ASSIGN_PERMISSIONS_TO_ROLES: 'assign permissions to roles',

    // AI & Analytics
    VIEW_AI_ANALYTICS: 'view ai analytics',
    VIEW_AI_INSIGHTS: 'view ai insights',
    MANAGE_AI_MODELS: 'manage ai models',
    TRAIN_AI_MODELS: 'train ai models',
    VIEW_AI_PREDICTIONS: 'view ai predictions',
    EXPORT_AI_DATA: 'export ai data',

    // IoT Management
    MANAGE_IOT_DEVICES: 'manage iot devices',
    VIEW_IOT_DATA: 'view iot data',
    VIEW_IOT_ALERTS: 'view iot alerts', // Make sure this exists in your backend seeder
    MANAGE_IOT_ALERTS: 'manage iot alerts',
    CONFIGURE_IOT_DEVICES: 'configure iot devices',
    VIEW_IOT_HEALTH_METRICS: 'view iot health metrics',
    VIEW_IOT_LOCATION_DATA: 'view iot location data',
    VIEW_IOT_TELEMETRY: 'view iot telemetry',

    // GPS & Geofencing
    VIEW_GPS_TRACKING: 'view gps tracking',
    VIEW_TRACKING_DATA: 'view tracking data',
    MANAGE_TRACKING_SETTINGS: 'manage tracking settings',
    MANAGE_TRACKING_ALERTS: 'manage tracking alerts',
    VIEW_TRACKING_HISTORY: 'view tracking history',
    EXPORT_TRACKING_DATA: 'export tracking data',
    VIEW_GEOFENCES: 'view geofences',
    CREATE_GEOFENCES: 'create geofences',
    EDIT_GEOFENCES: 'edit geofences',
    DELETE_GEOFENCES: 'delete geofences',
    MANAGE_GEOFENCES: 'manage geofences',
    ASSIGN_GEOFENCES: 'assign geofences',
    ASSIGN_GEOFENCES_TO_PAROLEES: 'assign geofences to parolees',
    VIEW_GEOFENCE_ALERTS: 'view geofence alerts',
    MANAGE_GEOFENCE_ALERTS: 'manage geofence alerts',
    VIEW_GEOFENCE_HISTORY: 'view geofence history',

    // Reports & Data Export
    VIEW_REPORTS: 'view reports',
    CREATE_REPORTS: 'create reports',
    EXPORT_REPORTS: 'export reports',
    SCHEDULE_REPORTS: 'schedule reports',
    SHARE_REPORTS: 'share reports',

    // System Management
    VIEW_SYSTEM_LOGS: 'view system logs',
    MANAGE_SYSTEM_SETTINGS: 'manage system settings',
    PERFORM_SYSTEM_MAINTENANCE: 'perform system maintenance',
    MANAGE_SYSTEM_BACKUP: 'manage system backup',
    MANAGE_SYSTEM_SECURITY: 'manage system security',

    // Notifications
    VIEW_NOTIFICATIONS: 'view notifications',
    MANAGE_NOTIFICATIONS: 'manage notifications',
    CONFIGURE_NOTIFICATIONS: 'configure notifications',

    // Assessments
    VIEW_ASSESSMENTS: 'view assessments',
    CREATE_ASSESSMENTS: 'create assessments',
    EDIT_ASSESSMENTS: 'edit assessments',
    DELETE_ASSESSMENTS: 'delete assessments',
    ASSIGN_ASSESSMENTS: 'assign assessments',
    REVIEW_ASSESSMENTS: 'review assessments',
    MANAGE_ASSESSMENTS: 'manage assessments',
    EXPORT_ASSESSMENT_RESULTS: 'export assessment results',

    // Communications
    SEND_MESSAGES: 'send messages',
    VIEW_MESSAGES: 'view messages',
    DELETE_MESSAGES: 'delete messages',
    MANAGE_COMMUNICATION_CHANNELS: 'manage communication channels',
    SEND_EMERGENCY_ALERTS: 'send emergency alerts',
    MANAGE_STAFF_MESSAGES: 'manage staff messages',
    VIEW_STAFF_NOTIFICATIONS: 'view staff notifications',
    VIEW_OFFICER_ASSIGNED_PAROLEES: 'view officer assigned parolees',
    MANAGE_OFFICER_COMMUNICATIONS: 'manage officer communications',
} as const;

// Ensure this type uses values from the const object
export type PermissionNameUnion = typeof PermissionName[keyof typeof PermissionName];


// Role names enum
export const RoleName = {
    SYSTEM_ADMINISTRATOR: 'System Administrator',
    PAROLE_OFFICER: 'Parole Officer',
    CASE_MANAGER: 'Case Manager',
    SUPPORT_STAFF: 'Support Staff',
    PAROLEE: 'Parolee', // Assuming Parolee is also a role, though they might not log into these portals
} as const;

export type RoleNameUnion = typeof RoleName[keyof typeof RoleName];

// Login response interface
export interface LoginResponse {
    message: string;
    user: ApiUser;
    token: string;
    token_type: string;
}

// API Response wrappers
export interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: number; // Optional status from API response body
}

export interface PaginatedResponse<T> {
    data: T[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        path: string;
        per_page: number;
        to: number | null;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
}


// Error response interface
export interface ApiErrorResponse {
    message: string;
    errors?: Record<string, string[]>;
    status?: number; // HTTP status code if available from error object
}

// Add a helper type for portal types
export type PortalType = 'admin' | 'officer' | 'staff';