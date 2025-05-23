<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geofences', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            // Storing coordinates as JSON. For complex spatial queries, consider PostGIS/MySQL Spatial extensions.
            // Example JSON structure:
            // For a polygon: {"type": "Polygon", "coordinates": [[[lng, lat], [lng, lat], ...]]}
            // For a circle: {"type": "Circle", "center": [lng, lat], "radius_meters": 500}
            $table->json('geometry_data');
            $table->enum('type', ['allowed', 'restricted'])->default('restricted')->comment('Is it an area to stay IN or OUT of?');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->onDelete('set null'); // Who created it
            $table->timestamps();
        });

      
    }

    public function down(): void
    {
        Schema::dropIfExists('parolee_geofence');
        Schema::dropIfExists('geofences');
    }
};