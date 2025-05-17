<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('iot_device_id')->constrained('iot_devices')->onDelete('cascade');
            $table->foreignId('parolee_user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('timestamp')->useCurrent()->index(); // Timestamp of the reading
            $table->unsignedSmallInteger('heart_rate')->nullable()->comment('Beats per minute');
            $table->decimal('temperature_celsius', 4, 1)->nullable(); // e.g., 36.6 C
            $table->unsignedSmallInteger('blood_pressure_systolic')->nullable();
            $table->unsignedSmallInteger('blood_pressure_diastolic')->nullable();
            $table->decimal('stress_level_indicator', 4, 2)->nullable()->comment('e.g., 0.00 to 100.00 or specific scale');
            $table->string('activity_level')->nullable()->comment('e.g., sedentary, light, moderate, vigorous');
            $table->json('raw_sensor_data')->nullable(); // If devices send more complex raw data
            //$table->timestamps(); // Usually not needed if 'timestamp' is the reading time
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_metrics');
    }
};