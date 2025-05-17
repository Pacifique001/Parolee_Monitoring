<?php

namespace Database\Factories;

use App\Models\OfficerProfile;
use App\Models\User; // Import User model
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OfficerProfile>
 */
class OfficerProfileFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = OfficerProfile::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // By default, create an associated 'officer' User if no user_id is provided
            'user_id' => User::factory()->officer(),
            'badge_number' => 'B' . fake()->unique()->numerify('#####'),
            'rank' => fake()->randomElement(['Officer', 'Senior Officer', 'Detective', 'Sergeant', 'Lieutenant', 'Captain']),
            'department' => fake()->randomElement(['Parole Division', 'Community Corrections', 'Special Operations', 'Administration']),
            'unit' => fake()->randomElement(['Supervision Unit Alpha', 'Investigation Task Force', 'High-Risk Offender Unit', 'Field Operations Team Bravo']),
            'caseload' => fake()->numberBetween(5, 25),
        ];
    }

    /**
     * Indicate that the profile belongs to a specific user.
     */
    public function forUser($user)
    {
        return $this->state(function (array $attributes) use ($user) {
            return [
                'user_id' => $user instanceof User ? $user->id : $user,
            ];
        });
    }
}