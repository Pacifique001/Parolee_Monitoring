// src/types/index.ts (or a new src/types/api.ts)

// Basic Role and Permission structure from API
export interface ApiRole {
    id?: number; // Optional if only sending name to assign
    name: string;
    // guard_name?: string; // Add if your RoleResource includes it
}

export interface ApiPermission {
    id?: number;
    name: string;
    // guard_name?: string; // Add if your PermissionResource includes it
}

// Profile Structures (matching your API Resources and Models)
export interface ApiParoleeProfile {
    id?: number;
    parole_id_number: string;
    imprisonment_date?: string | null;
    release_date?: string | null;
    expected_end_date?: string | null;
    conditions?: string[] | null; // From JSON array
    home_address?: string | null;
    emergency_contact?: { // From JSON object
        name: string;
        phone: string;
        relationship: string;
    } | null;
    last_check_in_at?: string | null;
    current_risk_level?: string | null;
    assessment_notes?: string | null;
}

export interface ApiOfficerProfile {
    id?: number;
    badge_number: string;
    rank?: string | null;
    department?: string | null;
    unit?: string | null;
    caseload?: number | null;
}

export interface ApiRehabStaffProfile {
    id?: number;
    staff_role: string; // This is the profile's staff_role, not Spatie role
    department?: string | null;
    specialization?: string | null;
    degree?: string | null;
}

// Main User structure from API (matching UserResource)
export interface ApiUser {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    user_type: 'parolee' | 'officer' | 'staff' | 'admin'; // Match your backend user_type enum
    status: 'active' | 'suspended' | 'pending' | 'high_risk' | 'violation' | 'inactive'; // Match backend status enum
    email_verified_at?: string | null;
    created_at: string;
    updated_at: string;
    roles: ApiRole[]; // Array of roles
    all_permissions?: ApiPermission[]; // All effective permissions (roles + direct)
    direct_permissions?: ApiPermission[]; // ONLY directly assigned permissions
    parolee_profile?: ApiParoleeProfile | null;
    officer_profile?: ApiOfficerProfile | null;
    rehab_staff_profile?: ApiRehabStaffProfile | null;
    // Add other fields returned by UserResource if any
}

// For the form, we might need a slightly different structure for submission
export interface UserFormData {
    id?: number; // For updates
    name: string;
    email: string;
    phone?: string;
    password?: string; // Only for create or password change
    password_confirmation?: string;
    user_type: 'parolee' | 'officer' | 'staff' | 'admin'; // Admin creating other admin is less common
    status: ApiUser['status'];
    roles: string[]; // Array of role names for assignment

    // Profile data will be nested
    parolee_profile?: Partial<ApiParoleeProfile>; // Use Partial for optional fields during creation/edit
    officer_profile?: Partial<ApiOfficerProfile>;
    rehab_staff_profile?: Partial<ApiRehabStaffProfile>;
}

// Type for the lists displayed in each tab
export type DisplayUser = ApiUser; // For now, directly use ApiUser for display