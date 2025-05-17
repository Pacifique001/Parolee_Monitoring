<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IotDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_eui',
        'name',
        'type',
        'parolee_user_id',
        'status',
        'battery_level',
        'firmware_version',
        'last_seen_at',
        'meta_data',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
        'meta_data' => 'array',
        'battery_level' => 'integer',
    ];

    /**
     * Get the parolee user this device is assigned to.
     */
    public function parolee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parolee_user_id');
    }

    // You might also want a relationship for health metrics and GPS locations recorded by this device
    // public function healthMetrics() { return $this->hasMany(HealthMetric::class); }
    // public function gpsLocations() { return $this->hasMany(GpsLocation::class); }
}