<?php

namespace Database\Factories;

use App\Models\RehabStaffProfile;
use App\Models\User; // Import User model
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RehabStaffProfile>
 */
class RehabStaffProfileFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = RehabStaffProfile::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // By default, create an associated 'staff' User if no user_id is provided
            'user_id' => User::factory()->staff(),
            'staff_role' => fake()->randomElement(['Counselor', 'Case Manager', 'Therapist', 'Program Coordinator', 'Intake Specialist', 'Support Staff']),
            'department' => fake()->randomElement(['Rehabilitation Services', 'Mental Health Unit', 'Vocational Training', 'Administrative Support']),
            'specialization' => fake()->optional(0.7)->randomElement(['Substance Abuse Counseling', 'Cognitive Behavioral Therapy', 'Family Therapy', 'Job Placement', 'Trauma Counseling']), // 70% chance of having a specialization
            'degree' => fake()->randomElement(['MSW', 'LPC', 'PhD in Psychology', 'MA Counseling', 'BA Social Work']),
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