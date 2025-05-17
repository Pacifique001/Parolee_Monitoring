<?php

namespace Database\Seeders;

use App\Models\User; // Keep if you plan to create some users directly here, but UserSeeder is better
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Call seeders in the correct order
        $this->call([
            RolesAndPermissionsSeeder::class, // Creates Roles and Permissions first
            IotDeviceSeeder::class, 
            UserSeeder::class,  
                        // Then creates Users and assigns them Roles & Profiles
            
        ]);
    }
}