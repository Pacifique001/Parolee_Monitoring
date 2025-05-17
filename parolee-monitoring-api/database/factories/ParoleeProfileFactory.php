<?php

namespace Database\Factories;

use App\Models\ParoleeProfile;
use App\Models\User; // Import User model
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon; // For date manipulation

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ParoleeProfile>
 */
class ParoleeProfileFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = ParoleeProfile::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $imprisonmentDate = Carbon::instance(fake()->dateTimeThisDecade());
        $releaseDate = Carbon::instance(fake()->dateTimeBetween($imprisonmentDate, $imprisonmentDate->copy()->addYears(5)));

        return [
            // By default, create an associated 'parolee' User if no user_id is provided
            'user_id' => User::factory()->parolee(),
            'parole_id_number' => 'P' . fake()->unique()->numerify('######'),
            'imprisonment_date' => $imprisonmentDate->toDateString(),
            'release_date' => $releaseDate->toDateString(),
            'expected_end_date' => $releaseDate->copy()->addYears(fake()->numberBetween(1, 3))->toDateString(),
            'conditions' => json_encode(fake()->randomElements([
                'Attend weekly counseling',
                'Submit to random drug testing',
                'Maintain full-time employment',
                'No contact with co-defendants',
                'Reside at approved address',
                'Curfew 10PM - 6AM',
            ], fake()->numberBetween(2, 4))),
            'home_address' => fake()->streetAddress() . ', ' . fake()->city() . ', ' . fake()->stateAbbr() . ' ' . fake()->postcode(),
            'last_check_in_at' => fake()->optional(0.8)->dateTimeThisMonth(), // 80% chance of having a last check-in
            'emergency_contact' => json_encode([
                'name' => fake()->name(),
                'phone' => fake()->phoneNumber(),
                'relationship' => fake()->randomElement(['Spouse', 'Parent', 'Sibling', 'Friend']),
            ]),
        ];
    }

    /**
     * Indicate that the profile belongs to a specific user.
     *
     * @param  int|\App\Models\User  $user
     * @return \Illuminate\Database\Eloquent\Factories\Factory
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