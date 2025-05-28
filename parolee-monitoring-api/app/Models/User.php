<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Permission;
class User extends Authenticatable implements CanResetPassword
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, LogsActivity;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'user_type',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $appends = [
        'all_permissions',
        'direct_permissions',
        'role_permissions',
        'available_actions'
    ];

    /**
     * Get all permissions for the user, including those inherited from roles
     */
    public function getAllPermissionsAttribute(): Collection
    {
        return $this->getAllPermissions();
    }

    /**
     * Get direct permissions as a collection
     */
    public function getDirectPermissionsAttribute(): Collection
    {
        return $this->permissions()->get();
    }

    /**
     * Get permissions inherited from the user's roles
     */
    public function getRolePermissionsAttribute(): Collection
    {
        return new Collection($this->getPermissionsViaRoles()->all());
    }

    /**
     * Check if user has a specific direct permission
     */
    public function hasDirectPermissionTo($permission): bool
    {
        if (is_string($permission)) {
            $permission = Permission::findByName($permission, $this->getDefaultGuardName());
        }

        return $this->hasDirectPermission($permission);
    }

    public function getPortalAccessAttribute(): array
    {
        $permissions = $this->getAllPermissions();

        return [
            'admin' => $permissions->contains('name', 'access admin portal'),
            'officer' => $permissions->contains('name', 'access officer portal'),
            'staff' => $permissions->contains('name', 'access staff portal'),
        ];
    }


    /**
     * Get available actions for the user based on permissions
     * This is the key method that determines UI visibility and API access
     */
    public function getAvailableActionsAttribute(): array
    {
        $permissions = $this->getAllPermissions()->pluck('name')->toArray();

        return [
            // Portal Access
            'can_access_admin_portal' => in_array('access admin portal', $permissions),
            'can_access_officer_portal' => in_array('access officer portal', $permissions),
            'can_access_staff_portal' => in_array('access staff portal', $permissions),

            // Dashboard Views
            'can_view_admin_dashboard' => in_array('view admin dashboard', $permissions),
            'can_view_officer_dashboard' => in_array('view officer dashboard', $permissions),
            'can_view_staff_dashboard' => in_array('view staff dashboard', $permissions),

            // User Management - Granular permissions
            'can_manage_users' => in_array('manage users', $permissions),
            'can_view_users' => in_array('view users', $permissions) || in_array('manage users', $permissions),
            'can_create_users' => in_array('create users', $permissions) || in_array('manage users', $permissions),
            'can_edit_users' => in_array('edit users', $permissions) || in_array('manage users', $permissions),
            'can_delete_users' => in_array('delete users', $permissions) || in_array('manage users', $permissions),
            'can_assign_roles_to_users' => in_array('assign roles to users', $permissions),
            'can_assign_permissions_to_users' => in_array('assign direct permissions to users', $permissions),
            'can_view_user_profiles' => in_array('view user profiles', $permissions),
            'can_edit_user_profiles' => in_array('edit user profiles', $permissions),
            'can_activate_users' => in_array('activate users', $permissions),
            'can_deactivate_users' => in_array('deactivate users', $permissions),
            'can_reset_user_passwords' => in_array('reset user passwords', $permissions),

            // Role & Permission Management
            'can_manage_roles' => in_array('manage roles', $permissions),
            'can_manage_permissions' => in_array('manage permissions', $permissions),
            'can_assign_permissions_to_roles' => in_array('assign permissions to roles', $permissions),

            // AI & Analytics
            'can_view_ai_insights' => in_array('view ai insights', $permissions),

            // IoT Management
            'can_manage_iot_devices' => in_array('manage iot devices', $permissions),
            'can_view_iot_data' => in_array('view iot data', $permissions),
            'can_manage_iot_alerts' => in_array('manage iot alerts', $permissions),

            // GPS & Geofencing
            'can_view_gps_tracking' => in_array('view gps tracking', $permissions),
            'can_manage_geofences' => in_array('manage geofences', $permissions),
            'can_assign_geofences_to_parolees' => in_array('assign geofences to parolees', $permissions),
            'can_view_geofence_alerts' => in_array('view geofence alerts', $permissions),

            // System Management
            'can_view_system_logs' => in_array('view system logs', $permissions),
            'can_manage_system_settings' => in_array('manage system settings', $permissions),

            // Assessment Management
            'can_manage_assessments' => in_array('manage assessments', $permissions),
            'can_view_assessments' => in_array('view assessments', $permissions),

            // Communication & Notifications
            'can_manage_staff_messages' => in_array('manage staff messages', $permissions),
            'can_view_staff_notifications' => in_array('view staff notifications', $permissions),

            // Officer Specific
            'can_view_officer_assigned_parolees' => in_array('view officer assigned parolees', $permissions),
            'can_manage_officer_communications' => in_array('manage officer communications', $permissions),
        ];
    }

    /**
     * Get specific action permissions for UI components
     */
    public function getActionPermissionsFor(string $module): array
    {
        $actions = $this->available_actions;

        switch ($module) {
            case 'users':
                return [
                    'view' => $actions['can_view_users'],
                    'create' => $actions['can_create_users'],
                    'edit' => $actions['can_edit_users'],
                    'delete' => $actions['can_delete_users'],
                    'assign_roles' => $actions['can_assign_roles_to_users'],
                    'assign_permissions' => $actions['can_assign_permissions_to_users'],
                    'activate' => $actions['can_activate_users'],
                    'deactivate' => $actions['can_deactivate_users'],
                    'reset_password' => $actions['can_reset_user_passwords'],
                ];

            case 'iot_devices':
                return [
                    'manage' => $actions['can_manage_iot_devices'],
                    'view_data' => $actions['can_view_iot_data'],
                    'manage_alerts' => $actions['can_manage_iot_alerts'],
                ];

            case 'geofences':
                return [
                    'manage' => $actions['can_manage_geofences'],
                    'assign' => $actions['can_assign_geofences_to_parolees'],
                    'view_alerts' => $actions['can_view_geofence_alerts'],
                ];

            case 'assessments':
                return [
                    'manage' => $actions['can_manage_assessments'],
                    'view' => $actions['can_view_assessments'],
                ];

            default:
                return [];
        }
    }

    /**
     * Check if user has permission for specific action on module
     */
    public function canPerformAction(string $module, string $action): bool
    {
        $permissions = $this->getActionPermissionsFor($module);
        return $permissions[$action] ?? false;
    }

    /**
     * Check if the user has access to a specific portal
     */
    public function hasPortalAccess(string $portal): bool
    {
        return $this->hasPermissionTo("access {$portal} portal");
    }

    /**
     * Get user's accessible portals
     */
    public function getAccessiblePortals(): array
    {
        $portals = [];

        if ($this->hasPortalAccess('admin')) {
            $portals[] = 'admin';
        }

        if ($this->hasPortalAccess('officer')) {
            $portals[] = 'officer';
        }

        if ($this->hasPortalAccess('staff')) {
            $portals[] = 'staff';
        }

        return $portals;
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'user_type', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "User {$eventName}d")
            ->useLogName('user_activity');
    }

    // Relationships
    public function iotDevice()
    {
        return $this->hasOne(IotDevice::class, 'parolee_user_id');
    }

    public function paroleeProfile()
    {
        return $this->hasOne(ParoleeProfile::class);
    }

    public function officerProfile()
    {
        return $this->hasOne(OfficerProfile::class);
    }

    public function rehabStaffProfile()
    {
        return $this->hasOne(RehabStaffProfile::class);
    }

    public function assignedGeofences(): BelongsToMany
    {
        return $this->belongsToMany(GeoFence::class, 'parolee_geofence', 'parolee_user_id', 'geofence_id')
            ->withTimestamps();
    }

    public function assessments()
    {
        return $this->hasMany(Assessment::class, 'parolee_user_id');
    }

    public function conductedAssessments()
    {
        return $this->hasMany(Assessment::class, 'conducted_by_user_id');
    }

    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_user')
            ->withTimestamps()
            ->withPivot('last_read_at')
            ->orderBy('conversations.last_reply_at', 'desc');
    }

    public function scopeWithPermission($query, $permission)
    {
        return $query->whereHas('permissions', function ($q) use ($permission) {
            $q->where('name', $permission);
        });
    }

    /**
     * Scope a query to only include active users
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}