<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'), // Default password
            'remember_token' => Str::random(10),
            'phone' => fake()->phoneNumber(), // ADDED
            'user_type' => fake()->randomElement(['parolee', 'officer', 'staff']), // Default to non-admin types
            'status' => fake()->randomElement(['pending', 'active']), // Default status
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Configure the model factory for an admin user.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_type' => 'admin',
            'status' => 'active', // Admins are typically active by default
        ]);
    }

    /**
     * Configure the model factory for a parolee user.
     */
    public function parolee(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_type' => 'parolee',
            // status can be varied for parolees
            'status' => fake()->randomElement(['active', 'pending', 'high_risk', 'violation', 'inactive']),
        ]);
    }

    /**
     * Configure the model factory for an officer user.
     */
    public function officer(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_type' => 'officer',
            'status' => 'active', // Officers are typically active
        ]);
    }

    /**
     * Configure the model factory for a staff user.
     */
    public function staff(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_type' => 'staff',
            'status' => 'active', // Staff are typically active
        ]);
    }
}