<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthMetric extends Model
{
    use HasFactory;

    // We don't use Laravel's default timestamps for this model
    public $timestamps = false;

    protected $fillable = [
        'iot_device_id',
        'parolee_user_id',
        'timestamp',
        'heart_rate',
        'temperature_celsius',
        'blood_pressure_systolic',
        'blood_pressure_diastolic',
        'stress_level_indicator',
        'activity_level',
        'raw_sensor_data',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'heart_rate' => 'integer',
        'temperature_celsius' => 'float',
        'blood_pressure_systolic' => 'integer',
        'blood_pressure_diastolic' => 'integer',
        'stress_level_indicator' => 'float',
        'raw_sensor_data' => 'array',
    ];

    public function iotDevice(): BelongsTo
    {
        return $this->belongsTo(IotDevice::class);
    }

    public function parolee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parolee_user_id');
    }
}