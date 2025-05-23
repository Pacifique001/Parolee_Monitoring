<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AssessmentSeeder extends Seeder
{
    public function run(): void
    {
        $parolees = User::where('user_type', 'parolee')->get();
        $staffMembers = User::where('user_type', 'staff')->get();

        if ($parolees->isEmpty() || $staffMembers->isEmpty()) {
            $this->command->warn('No parolees or staff found to create assessments. Please seed users first.');
            return;
        }

        foreach ($parolees as $parolee) {
            // Create 1 to 3 assessments for each parolee
            Assessment::factory()
                ->count(rand(1, 3))
                ->forParolee($parolee)
                ->conductedBy($staffMembers->random()) // Assign a random staff member
                ->create();
        }

        // Create some specific pending assessments
        $parolee1 = User::where('email', 'parolee@example.com')->first(); // Assuming this user exists
        $staff1 = User::where('email', 'staff@example.com')->first();   // Assuming this user exists

        if ($parolee1 && $staff1) {
            Assessment::factory()->forParolee($parolee1)->conductedBy($staff1)->create([
                'type' => 'Initial Intake Assessment',
                'status' => 'pending',
                'assessment_date' => now()->addDays(7)->toDateString(),
                'next_review_date' => now()->addMonths(1)->toDateString(),
            ]);
            Assessment::factory()->forParolee($parolee1)->conductedBy($staff1)->create([
                'type' => 'Monthly Review',
                'status' => 'scheduled',
                'assessment_date' => now()->addDays(14)->toDateString(),
            ]);
        }
    }
}