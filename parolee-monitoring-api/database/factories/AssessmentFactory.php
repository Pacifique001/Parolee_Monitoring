<?php

namespace Database\Factories;

use App\Models\Assessment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class AssessmentFactory extends Factory
{
    protected $model = Assessment::class;

    public function definition(): array
    {
        $assessmentDate = Carbon::instance(fake()->dateTimeThisYear());
        $parolees = User::where('user_type', 'parolee')->pluck('id');
        $staff = User::where('user_type', 'staff')->pluck('id');

        // Generate next review date with proper null handling
        $nextReviewDate = null;
        if (fake()->boolean(80)) { // 80% chance to have a next review date
            $nextReviewDate = fake()->dateTimeBetween($assessmentDate, $assessmentDate->copy()->addMonths(3))->format('Y-m-d');
        }

        // Handle recommendations array
        $recommendations = null;
        if (fake()->boolean(60)) { // 60% chance to have recommendations
            $recommendations = fake()->randomElements(
                ['Continue current therapy', 'Increase session frequency', 'Vocational training referral', 'Anger management course', 'Update housing plan'],
                fake()->numberBetween(1, 3)
            );
        }

        return [
            'parolee_user_id' => $parolees->isNotEmpty() ? $parolees->random() : User::factory()->parolee()->create()->id,
            'conducted_by_user_id' => $staff->isNotEmpty() ? $staff->random() : User::factory()->staff()->create()->id,
            'type' => fake()->randomElement(['Monthly Review', 'Psychological Evaluation', 'Drug Screening', 'Behavioral Risk Assessment', 'Reintegration Plan Update']),
            'status' => fake()->randomElement(['pending', 'scheduled', 'completed', 'overdue']),
            'notes' => fake()->boolean(70) ? fake()->paragraph : null,
            'recommendations' => $recommendations,
            'assessment_date' => $assessmentDate->toDateString(),
            'next_review_date' => $nextReviewDate,
            'details' => fake()->boolean(40) ? fake()->randomElement([
                ['score' => fake()->numberBetween(1,10)],
                ['result' => 'negative', 'method' => 'urine_test'],
            ]) : null,
        ];
    }

    /**
     * Indicate the assessment is for a specific parolee.
     */
    public function forParolee(User $parolee): static
    {
        return $this->state(fn (array $attributes) => ['parolee_user_id' => $parolee->id]);
    }

    /**
     * Indicate the assessment was conducted by a specific staff member.
     */
    public function conductedBy(User $staff): static
    {
        return $this->state(fn (array $attributes) => ['conducted_by_user_id' => $staff->id]);
    }
}