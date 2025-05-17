<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('officer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('badge_number')->unique()->nullable();
            $table->string('rank')->nullable();
            $table->string('department')->nullable();
            $table->string('unit')->nullable();
            $table->integer('caseload')->nullable()->default(0); // From your mockOfficers
            // Add other officer-specific fields
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('officer_profiles');
    }
};