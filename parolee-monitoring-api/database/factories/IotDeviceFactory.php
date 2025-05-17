<?php

namespace Database\Factories;

use App\Models\IotDevice;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class IotDeviceFactory extends Factory
{
    protected $model = IotDevice::class;

    public function definition(): array
    {
        return [
            'device_eui' => 'EUI-' . fake()->unique()->bothify('??##??##??##??##'), // Example EUI format
            'name' => fake()->randomElement(['Ankle Monitor', 'Health Band', 'GPS Unit']) . ' ' . fake()->randomNumber(3, true),
            'type' => fake()->randomElement(['ankle_monitor', 'health_tracker', 'panic_button']),
            'parolee_user_id' => null, // Default to unassigned, or assign in seeder/tests
            'status' => 'unassigned',
            'battery_level' => fake()->optional(0.9)->numberBetween(10, 100), // 90% chance to have battery level
            'firmware_version' => 'v' . fake()->numberBetween(1, 3) . '.' . fake()->numberBetween(0, 9) . '.' . fake()->numberBetween(0, 15),
            'last_seen_at' => fake()->optional(0.7)->dateTimeThisMonth(),
            'meta_data' => fake()->optional(0.3)->randomElement([
                ['color' => 'black', 'activation_code' => fake()->ean8()],
                ['sim_iccid' => fake()->numerify('89##################')],
            ]),
        ];
    }

    /**
     * Indicate that the device is assigned to a parolee.
     */
    public function assignedTo(User $parolee): static
    {
        return $this->state(fn (array $attributes) => [
            'parolee_user_id' => $parolee->id,
            'status' => 'active',
            'last_seen_at' => now()->subMinutes(fake()->numberBetween(5, 60)), // Recently seen if active
        ]);
    }

    /**
     * Indicate that the device is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'last_seen_at' => now()->subMinutes(fake()->numberBetween(5, 60)),
            'battery_level' => fake()->numberBetween(70, 100),
        ]);
    }
}