<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Alert extends Model {
    use HasFactory;
    protected $fillable = [
        'parolee_user_id', 'iot_device_id', 'health_metric_id', 'gps_location_id',
        'type', 'severity', 'message', 'details', 'latitude', 'longitude',
        'alerted_at', 'acknowledged_at', 'acknowledged_by_user_id',
        'resolved_at', 'resolved_by_user_id', 'status',
    ];
    protected $casts = [
        'details' => 'array',
        'alerted_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];
    public function parolee() { return $this->belongsTo(User::class, 'parolee_user_id'); }
    public function device() { return $this->belongsTo(IotDevice::class, 'iot_device_id'); }
    public function healthMetric() { return $this->belongsTo(HealthMetric::class); }
    
}