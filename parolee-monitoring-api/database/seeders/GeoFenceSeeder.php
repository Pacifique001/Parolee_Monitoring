<?php

namespace Database\Seeders;

use App\Models\GeoFence;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class GeoFenceSeeder extends Seeder
{
    public function run(): void
    {
        GeoFence::factory()->count(5)->create();

        // Optionally assign some geofences to parolees
        $parolees = User::where('user_type', 'parolee')->take(2)->get();
        $geofences = GeoFence::take(2)->get();

        if ($parolees->count() >= 1 && $geofences->count() >= 1) {
            $parolees->first()->assignedGeofences()->syncWithoutDetaching($geofences->pluck('id')->toArray());
        }
    }
}