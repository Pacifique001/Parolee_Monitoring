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
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Define Permissions based on your wireframe features

        // General Admin Access
        Permission::firstOrCreate(['name' => 'access admin panel', 'guard_name' => 'web']); // Basic gatekeeper

        // Dashboard
        Permission::firstOrCreate(['name' => 'view dashboard', 'guard_name' => 'web']);

        // User Management Permissions
        Permission::firstOrCreate(['name' => 'manage users', 'guard_name' => 'web']); // Super permission
        Permission::firstOrCreate(['name' => 'view users', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'create users', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'edit users', 'guard_name' => 'web']);    // Includes basic info + status
        Permission::firstOrCreate(['name' => 'delete users', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'assign roles', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'view profiles', 'guard_name' => 'web']); // General view permission
        Permission::firstOrCreate(['name' => 'edit profiles', 'guard_name' => 'web']); // General edit permission (or make specific: edit parolee profile, etc.)

        // AI Insights Permissions
        Permission::firstOrCreate(['name' => 'view ai insights', 'guard_name' => 'web']);

        // IoT Monitoring Permissions
        Permission::firstOrCreate(['name' => 'view iot data', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'manage iot alerts', 'guard_name' => 'web']); 
        Permission::firstOrCreate(['name' => 'manage iot devices', 'guard_name' => 'web']);
        // GPS Tracking Permissions
        Permission::firstOrCreate(['name' => 'view gps tracking', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'manage geo-fences', 'guard_name' => 'web']); // Create/Edit/Delete fences
        Permission::firstOrCreate(['name' => 'view geo-fence alerts', 'guard_name' => 'web']);

        // System Logs Permissions
        Permission::firstOrCreate(['name' => 'view system logs', 'guard_name' => 'web']);

        // Settings Permissions
        Permission::firstOrCreate(['name' => 'manage settings', 'guard_name' => 'web']); // Super permission for settings section
        Permission::firstOrCreate(['name' => 'manage roles and permissions', 'guard_name' => 'web']); // More specific

        // Define Roles and Assign Permissions

        // ROLE: System Administrator (Typically user_type: 'admin')
        $adminRole = Role::firstOrCreate(['name' => 'System Administrator', 'guard_name' => 'web']);
        // Admins get all permissions (simplest way)
        $adminRole->givePermissionTo(Permission::all());
        // Or assign specific super-permissions if you prefer more control later:
        // $adminRole->givePermissionTo([
        //     'access admin panel',
        //     'view dashboard',
        //     'manage users', // Implies view, create, edit, delete, assign roles, view/edit profiles
        //     'view ai insights',
        //     'view iot data',
        //     'manage iot alerts',
        //     'view gps tracking',
        //     'manage geo-fences',
        //     'view geo-fence alerts',
        //     'view system logs',
        //     'manage settings', // Implies manage roles/permissions
        //     'manage roles and permissions'
        // ]);

        // ROLE: Parole Officer (Typically user_type: 'officer')
        $officerRole = Role::firstOrCreate(['name' => 'Parole Officer', 'guard_name' => 'web']);
        $officerRole->givePermissionTo([
            'access admin panel',
            'view dashboard',
            'view users',           // Can see users (perhaps scoped later to their parolees)
            'view profiles',        // Can view details (scoped later)
            'edit profiles',        // Can edit *some* profile info (scoped later)
            'view iot data',        // View data for assigned parolees
            'view gps tracking',    // View tracking for assigned parolees
            'view geo-fence alerts',// View alerts for assigned parolees
            'view ai insights',     // View risk assessments, etc. for assigned parolees
        ]);

        // ROLE: Case Manager (Typically user_type: 'staff') - Focused on rehabilitation aspects
        $staffRole = Role::firstOrCreate(['name' => 'Case Manager', 'guard_name' => 'web']);
        $staffRole->givePermissionTo([
            'access admin panel',
            'view dashboard',
            'view users',           // View assigned parolees
            'view profiles',        // View assigned parolee profiles
            'edit profiles',        // Add notes, update contact info for assigned parolees
            'view ai insights',     // View relevant insights for assigned parolees
        ]);

        // ROLE: Support Staff (Optional - less privileged staff user_type: 'staff')
        $supportStaffRole = Role::firstOrCreate(['name' => 'Support Staff', 'guard_name' => 'web']);
         $supportStaffRole->givePermissionTo([
            'access admin panel',
            // Perhaps only view basic user directory or specific limited functions
            // 'view users', // Maybe? Depends on requirements
         ]);


        // ROLE: Parolee (user_type: 'parolee')
        // Parolees generally DO NOT get roles/permissions within the *Admin Portal*.
        // If they have a separate login portal later, they'd have roles/permissions there.
        // We create the role here mainly for identification purposes if needed, but assign no permissions for the admin panel.
        Role::firstOrCreate(['name' => 'Parolee', 'guard_name' => 'web']);

        // You can create more roles as needed (e.g., 'Supervising Officer', 'Data Analyst')
        // Example:
        // $supervisorRole = Role::firstOrCreate(['name' => 'Supervising Officer', 'guard_name' => 'web']);
        // $supervisorRole->givePermissionTo($officerRole->permissions); // Inherit officer permissions
        // $supervisorRole->givePermissionTo([
        //      'manage geo-fences',
        //      'view system logs', // Perhaps wider scope than regular officer
        //      // Add permissions to assign cases, view reports for their team, etc.
        // ]);


        // --- Assign Roles to Initial Users (Example - Typically in UserSeeder) ---
        // This part is better placed in your DatabaseSeeder or a dedicated UserSeeder
        // after the RolesAndPermissionsSeeder runs. But showing the concept here:

        // $adminUser = \App\Models\User::where('email', 'admin@example.com')->first();
        // if ($adminUser) {
        //     $adminUser->assignRole('System Administrator');
        // }

        // $officerUser = \App\Models\User::where('email', 'officer@example.com')->first();
        // if ($officerUser) {
        //     $officerUser->assignRole('Parole Officer');
        // }

        // $staffUser = \App\Models\User::where('email', 'staff@example.com')->first();
        // if ($staffUser) {
        //     $staffUser->assignRole('Case Manager');
        // }
    }
}