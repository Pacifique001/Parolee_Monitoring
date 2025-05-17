<?php

namespace Database\Seeders;

use App\Models\OfficerProfile;
use App\Models\ParoleeProfile;
use App\Models\RehabStaffProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create/Update Admin User
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'phone' => '123-456-7890',
                'user_type' => 'admin',
                'status' => 'active', // Ensure admin is active
                'email_verified_at' => now(),
            ]
        );
        $adminUser->assignRole('System Administrator'); // Assign the role

        // 2. Create/Update Parolee User with Profile
        $paroleeUser = User::updateOrCreate(
            ['email' => 'parolee@example.com'],
            [
                'name' => 'John Doe Parolee',
                'password' => Hash::make('password'),
                'phone' => '123-555-0001',
                'user_type' => 'parolee',
                'status' => 'active',
            ]
        );
        ParoleeProfile::updateOrCreate(
            ['user_id' => $paroleeUser->id],
            [
                'parole_id_number' => 'P00001',
                'imprisonment_date' => '2021-01-15',
                'release_date' => '2024-01-15',
                'conditions' => json_encode(['Weekly check-in', 'No contact with victim']),
            ]
        );
        $paroleeUser->assignRole('Parolee');

        // 3. Create/Update Officer User with Profile
        $officerUser = User::updateOrCreate(
            ['email' => 'officer@example.com'],
            [
                'name' => 'Jane Officer',
                'password' => Hash::make('password'),
                'phone' => '123-555-0002',
                'user_type' => 'officer',
                'status' => 'active',
            ]
        );
        OfficerProfile::updateOrCreate(
            ['user_id' => $officerUser->id],
            [
                'badge_number' => 'B001',
                'rank' => 'Senior Officer',
                'department' => 'Parole Division',
                'unit' => 'Field Unit Alpha',
            ]
        );
        $officerUser->assignRole('Parole Officer');

        // 4. Create/Update Staff User with Profile
        $staffUser = User::updateOrCreate(
            ['email' => 'staff@example.com'],
            [
                'name' => 'Robert Staff',
                'password' => Hash::make('password'),
                'phone' => '123-555-0003',
                'user_type' => 'staff',
                'status' => 'active',
            ]
        );
        RehabStaffProfile::updateOrCreate(
            ['user_id' => $staffUser->id],
            [
                'staff_role' => 'Case Manager Lead',
                'specialization' => 'Reintegration Planning',
                'degree' => 'MSW',
                'department' => 'Support Services',
            ]
        );
        $staffUser->assignRole('Case Manager'); // Or 'Support Staff'

        // Create additional random users if needed using factories
        // Example: 5 more parolees
        User::factory()->count(5)->parolee()->create()->each(function (User $user) {
            ParoleeProfile::factory()->create(['user_id' => $user->id]); // Create profile for each
            $user->assignRole('Parolee');
        });
    }
}