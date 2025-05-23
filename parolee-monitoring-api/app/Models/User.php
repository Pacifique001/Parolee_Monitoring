<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // For Sanctum API tokens
use Spatie\Permission\Traits\HasRoles; // For Spatie Roles & Permissions
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Illuminate\Contracts\Auth\CanResetPassword;
use illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable implements CanResetPassword
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, LogsActivity; // Add HasApiTokens and HasRoles

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'user_type',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'user_type', 'status']) // Log only these attributes
            ->logOnlyDirty() // Only log attributes that have changed
            ->dontSubmitEmptyLogs() // Don't save log if nothing changed
            ->setDescriptionForEvent(fn(string $eventName) => "User {$eventName}d") // e.g., "User created", "User updated"
            ->useLogName('user_activity'); // Optional: custom log name
    }
    public function iotDevice() // A parolee might have one primary device
    {
        return $this->hasOne(IotDevice::class, 'parolee_user_id');
    }

    // Define relationships to profile models later
    public function paroleeProfile()
    {
        return $this->hasOne(ParoleeProfile::class);
    }
    public function officerProfile()
    {
        return $this->hasOne(OfficerProfile::class);
    }
    public function rehabStaffProfile()
    {
        return $this->hasOne(RehabStaffProfile::class);
    }
    public function assignedGeofences(): BelongsToMany
    {
        return $this->belongsToMany(GeoFence::class, 'parolee_geofence', 'parolee_user_id', 'geofence_id')
            ->withTimestamps();
    }
    public function assessments() // Assessments conducted ON this user (if they are a parolee)
    {
        return $this->hasMany(Assessment::class, 'parolee_user_id');
    }
    public function conductedAssessments() // Assessments conducted BY this user (if they are staff)
    {
        return $this->hasMany(Assessment::class, 'conducted_by_user_id');
    }
    public function conversations() {
        return $this->belongsToMany(Conversation::class, 'conversation_user')->withTimestamps()->withPivot('last_read_at')->orderBy('conversations.last_reply_at', 'desc');
    }
}