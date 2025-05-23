<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions at the beginning of the seeder
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $guard = 'web'; // Define default guard name

        // --- Define ALL Permissions ---

        // Portal Access Permissions
        Permission::firstOrCreate(['name' => 'access admin portal', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'access officer portal', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'access staff portal', 'guard_name' => $guard]);

        // Dashboard View Permissions
        Permission::firstOrCreate(['name' => 'view admin dashboard', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'view officer dashboard', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'view staff dashboard', 'guard_name' => $guard]);

        // User Management Permissions
        Permission::firstOrCreate(['name' => 'manage users', 'guard_name' => $guard]); // Super permission for User CRUD
        Permission::firstOrCreate(['name' => 'view users', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'create users', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'edit users', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'delete users', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'assign roles to users', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'assign direct permissions to users', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'view user profiles', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'edit user profiles', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'activate users', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'deactivate users', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'reset user passwords', 'guard_name' => $guard]);

        // Global Role & Permission Model Management
        Permission::firstOrCreate(['name' => 'manage roles', 'guard_name' => $guard]); // CRUD for Role model
        Permission::firstOrCreate(['name' => 'manage permissions', 'guard_name' => $guard]); // CRUD for Permission model
        Permission::firstOrCreate(['name' => 'assign permissions to roles', 'guard_name' => $guard]);

        // AI Insights
        Permission::firstOrCreate(['name' => 'view ai insights', 'guard_name' => $guard]);

        // IoT Management & Monitoring
        Permission::firstOrCreate(['name' => 'manage iot devices', 'guard_name' => $guard]); // <-- NEWLY ADDED
        Permission::firstOrCreate(['name' => 'view iot data', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'manage iot alerts', 'guard_name' => $guard]);

        // GPS Tracking & Geo-fencing
        Permission::firstOrCreate(['name' => 'view gps tracking', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'manage geofences', 'guard_name' => $guard]); // <-- ALREADY HAD, CONFIRMED
        Permission::firstOrCreate(['name' => 'assign geofences to parolees', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'view geofence alerts', 'guard_name' => $guard]);

        // System Logs
        Permission::firstOrCreate(['name' => 'view system logs', 'guard_name' => $guard]);

        // System Settings
        Permission::firstOrCreate(['name' => 'manage system settings', 'guard_name' => $guard]);

        // Staff Specific - Assessments
        Permission::firstOrCreate(['name' => 'manage assessments', 'guard_name' => $guard]); // <-- NEWLY ADDED
        Permission::firstOrCreate(['name' => 'view assessments', 'guard_name' => $guard]);

        // Staff Specific - Messages & Notifications
        Permission::firstOrCreate(['name' => 'manage staff messages', 'guard_name' => $guard]); // <-- NEWLY ADDED
        Permission::firstOrCreate(['name' => 'view staff notifications', 'guard_name' => $guard]); // <-- NEWLY ADDED

        // Officer Specific
        Permission::firstOrCreate(['name' => 'view officer assigned parolees', 'guard_name' => $guard]); // <-- NEWLY ADDED
        Permission::firstOrCreate(['name' => 'manage officer communications', 'guard_name' => $guard]); // <-- NEWLY ADDED
       
        
        
        


        

        // ROLE: System Administrator
        $adminRole = Role::firstOrCreate(['name' => 'System Administrator', 'guard_name' => $guard]);
        // Give all defined permissions to the System Administrator
        // This line MUST come AFTER all Permission::firstOrCreate calls
        $adminRole->syncPermissions(Permission::all());

        // ROLE: Parole Officer
        $officerRole = Role::firstOrCreate(['name' => 'Parole Officer', 'guard_name' => $guard]);
        $officerRole->syncPermissions([
            'access officer portal',
            'view officer dashboard',
            'view officer assigned parolees',
            'view user profiles', // Scoped by policies in controller for their parolees
            'edit user profiles', // Scoped by policies
            'view iot data',      // Scoped
            'view gps tracking',  // Scoped
            'view geofence alerts', // Scoped
            'view ai insights',     // Scoped
            'manage officer communications',
            // Officers might also view assessments related to their parolees, but not manage them
            'view assessments',
        ]);

        // ROLE: Case Manager (Primary Staff Role)
        $caseManagerRole = Role::firstOrCreate(['name' => 'Case Manager', 'guard_name' => $guard]);
        $caseManagerRole->syncPermissions([
            'access staff portal',
            'view staff dashboard',
            'view users', // To find parolees for assessments
            'view user profiles', // For assessment context
            'edit user profiles', // Maybe limited editing rights
            'manage assessments', // Can create, update, delete assessments
            'view assessments',
            'view ai insights', // Relevant to parolee progress
            'manage staff messages',
            'view staff notifications',
            'manage users',
        ]);

        // ROLE: Support Staff (Less privileged staff)
        $supportStaffRole = Role::firstOrCreate(['name' => 'Support Staff', 'guard_name' => $guard]);
        $supportStaffRole->syncPermissions([
            'access staff portal',
            'view staff dashboard',
            'view users', // Potentially view only, limited fields
            'view user profiles', // Limited view
            'view assessments', // Can view but not create/edit
            'view staff notifications',
            // No message management for basic support staff perhaps
        ]);

        // ROLE: Parolee
        Role::firstOrCreate(['name' => 'Parolee', 'guard_name' => $guard]); // No portal permissions by default
    }
}