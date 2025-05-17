<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parolee_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('iot_device_id')->nullable()->constrained('iot_devices')->onDelete('set null');
            $table->foreignId('health_metric_id')->nullable()->constrained('health_metrics')->onDelete('set null'); // Link to specific metric
            $table->foreignId('gps_location_id')->nullable()->constrained('gps_locations')->onDelete('set null'); // Link to specific location
            // Add foreignId for geofence_id if it's a geofence alert

            $table->string('type')->comment('e.g., health_heart_rate_high, health_temp_low, geofence_breach, device_tamper, low_battery, panic_button');
            $table->string('severity')->default('medium')->comment('low, medium, high, critical');
            $table->text('message')->comment('Description of the alert');
            $table->json('details')->nullable()->comment('Additional context, e.g., breached value, threshold');
            $table->decimal('latitude', 10, 7)->nullable(); // Location at time of alert
            $table->decimal('longitude', 11, 7)->nullable();

            $table->timestamp('alerted_at')->useCurrent(); // When the alert condition was met/created
            $table->timestamp('acknowledged_at')->nullable();
            $table->foreignId('acknowledged_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('status')->default('new')->comment('new, acknowledged, resolved, false_alarm');
            $table->timestamps(); // created_at, updated_at for the alert record itself
        });
    }
    public function down(): void { Schema::dropIfExists('alerts'); }
};