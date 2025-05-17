<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('iot_devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_eui')->unique()->comment('Unique Equipment Identifier of the device');
            $table->string('name')->nullable()->comment('A human-friendly name for the device');
            $table->string('type')->default('ankle_monitor')->comment('e.g., ankle_monitor, health_tracker, panic_button');
            $table->foreignId('parolee_user_id')->nullable()->constrained('users')->onDelete('set null')->comment('The parolee this device is currently assigned to');
            $table->enum('status', ['unassigned', 'active', 'inactive', 'maintenance', 'lost'])->default('unassigned');
            $table->unsignedTinyInteger('battery_level')->nullable()->comment('Percentage 0-100');
            $table->string('firmware_version')->nullable();
            $table->timestamp('last_seen_at')->nullable()->comment('Last time the device reported in');
            $table->json('meta_data')->nullable()->comment('Any other specific device details');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('iot_devices');
    }
};