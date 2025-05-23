<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parolee_user_id')->constrained('users')->onDelete('cascade')->comment('The parolee being assessed');
            $table->foreignId('conducted_by_user_id')->nullable()->constrained('users')->onDelete('set null')->comment('The staff/officer who conducted/is responsible for the assessment');
            $table->string('type')->comment('e.g., Monthly Review, Psychological Evaluation, Drug Screening, Behavioral Assessment');
            $table->string('status')->default('pending')->comment('e.g., pending, scheduled, in_progress, completed, overdue, cancelled');
            $table->text('notes')->nullable();
            $table->json('recommendations')->nullable()->comment('Array of recommendation strings');
            $table->date('assessment_date')->nullable()->comment('Date the assessment was conducted or is scheduled');
            $table->date('next_review_date')->nullable()->comment('Date for the next follow-up or review');
            $table->json('details')->nullable()->comment('Any other specific details related to the assessment type');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};