<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GpsLocation extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'iot_device_id',
        'parolee_user_id',
        'timestamp',
        'latitude',
        'longitude',
        'accuracy_meters',
        'speed_kmh',
        'altitude_meters',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
        'accuracy_meters' => 'float',
        'speed_kmh' => 'float',
        'altitude_meters' => 'float',
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