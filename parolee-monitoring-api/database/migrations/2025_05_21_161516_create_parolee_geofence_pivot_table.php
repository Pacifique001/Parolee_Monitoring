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
          // Pivot table to link parolees to geofences (Many-to-Many)
          Schema::create('parolee_geofence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parolee_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('geofence_id')->constrained('geofences')->onDelete('cascade');
            $table->timestamp('assigned_at')->useCurrent();
            $table->foreignId('assigned_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->unique(['parolee_user_id', 'geofence_id']); // Prevent duplicate assignments
            $table->timestamps(); // Optional: if you want to track when assignment was made/updated
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('parolee_geofence');
    }
};
