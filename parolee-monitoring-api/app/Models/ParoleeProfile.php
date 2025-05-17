<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParoleeProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'parole_id_number',
        'imprisonment_date',
        'release_date',
        'expected_end_date',
        'conditions',
        'home_address',
        'emergency_contact',
        'last_check_in_at',
        'current_risk_level',
        'assessment_notes',
        'iot_device_id',
    ];

    protected $casts = [
        'imprisonment_date' => 'date:Y-m-d', // Cast to Y-m-d string for API consistency
        'release_date' => 'date:Y-m-d',
        'expected_end_date' => 'date:Y-m-d',
        'conditions' => 'array',         // Automatically handles JSON encode/decode
        'emergency_contact' => 'array',  // Automatically handles JSON encode/decode
        'last_check_in_at' => 'datetime:Y-m-d\TH:i:sP', // ISO 8601 format
    ];

    /**
     * Get the user that owns the parolee profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}