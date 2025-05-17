<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parolee_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade'); // Ensures one-to-one and cascades delete

            // Core Parolee Identifiers & Dates
            $table->string('parole_id_number')->unique()->comment('Unique official ID for the parolee');
            $table->date('imprisonment_date')->nullable();
            $table->date('release_date')->nullable();
            $table->date('expected_end_date')->nullable()->comment('Expected end date of parole');

            // Parole Conditions
            $table->json('conditions')->nullable()->comment('Array of parole conditions');

            // Personal & Contact Details
            $table->text('home_address')->nullable();
            $table->json('emergency_contact')->nullable()->comment('JSON object: name, phone, relationship');
            // Phone & email are on the users table, but you might store additional contact info here if needed

            // Monitoring & Check-ins
            $table->timestamp('last_check_in_at')->nullable(); // Renamed for clarity
            // You might add fields like: next_check_in_due, check_in_frequency

            // Risk & Assessment (Could be separate tables later for complexity)
            $table->string('current_risk_level')->nullable()->comment('e.g., low, medium, high'); // Simplified
            $table->text('assessment_notes')->nullable(); // General notes

            // IoT Device Link (if a parolee has one primary device)
            $table->foreignId('iot_device_id')->nullable()->constrained('iot_devices')->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parolee_profiles');
    }
};