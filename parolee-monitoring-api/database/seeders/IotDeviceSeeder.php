<?php

namespace Database\Seeders;

use App\Models\IotDevice;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class IotDeviceSeeder extends Seeder
{
    public function run(): void
    {
        // Create some unassigned devices
        IotDevice::factory()->count(5)->create();

        // Find a specific parolee (created by UserSeeder) and assign a device
        $parolee = User::where('email', 'parolee@example.com')->first();
        if ($parolee) {
            IotDevice::factory()->assignedTo($parolee)->create([
                'name' => 'Ankle Monitor for ' . $parolee->name,
                'type' => 'ankle_monitor',
            ]);
        }

        // Create some more active devices assigned to random factory-created parolees
        User::where('user_type', 'parolee')->whereDoesntHave('iotDevice')->take(3)->get()->each(function(User $user){
            IotDevice::factory()->assignedTo($user)->active()->create();
        });
    }
}