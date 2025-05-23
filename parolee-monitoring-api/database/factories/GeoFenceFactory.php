<?php

namespace Database\Factories;

use App\Models\GeoFence;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

class GeoFenceFactory extends Factory
{
    protected $model = GeoFence::class;

    public function definition(): array
    {
        $type = fake()->randomElement(['Polygon', 'Circle']);
        $geometryData = [];

        if ($type === 'Polygon') {
            $coordinates = [];
            for ($i = 0; $i < fake()->numberBetween(3, 6); $i++) { // 3 to 6 points for polygon
                $coordinates[] = [fake()->longitude(-74.05, -73.90), fake()->latitude(40.70, 40.80)]; // Example NYC area
            }
            $coordinates[] = $coordinates[0]; // Close the polygon
            $geometryData = ['type' => 'Polygon', 'coordinates' => [$coordinates]];
        } else { // Circle
            $geometryData = [
                'type' => 'Circle',
                'center' => [fake()->longitude(-74.05, -73.90), fake()->latitude(40.70, 40.80)],
                'radius_meters' => fake()->numberBetween(100, 1000),
            ];
        }

        return [
            'name' => 'Zone ' . fake()->citySuffix() . ' ' . fake()->streetName(),
            'description' => fake()->optional()->sentence,
            'geometry_data' => $geometryData,
            'type' => fake()->randomElement(['allowed', 'restricted']),
            'is_active' => fake()->boolean(80), // 80% chance of being active
            'created_by_user_id' => User::where('user_type', 'admin')->inRandomOrder()->first()?->id, // Example
        ];
    }
}