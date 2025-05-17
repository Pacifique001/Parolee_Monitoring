<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gps_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('iot_device_id')->constrained('iot_devices')->onDelete('cascade');
            $table->foreignId('parolee_user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('timestamp')->useCurrent()->index();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 11, 7);
            $table->decimal('accuracy_meters', 8, 2)->nullable();
            $table->decimal('speed_kmh', 8, 2)->nullable();
            $table->decimal('altitude_meters', 8, 2)->nullable();
            // $table->timestamps(); // Usually not needed if 'timestamp' is the reading time
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_metrics');
    }
};