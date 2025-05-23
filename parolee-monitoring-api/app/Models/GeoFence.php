<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class GeoFence extends Model
{
    use HasFactory;

    protected $table = 'geofences';

    protected $fillable = [
        'name',
        'description',
        'geometry_data',
        'type',
        'is_active',
        'created_by_user_id',
    ];

    protected $casts = [
        'geometry_data' => 'array', // Automatically encode/decode JSON
        'is_active' => 'boolean',
    ];

    /**
     * The parolees that are assigned to this geofence.
     */
    public function parolees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'parolee_geofence', 'geofence_id', 'parolee_user_id')
                    ->withTimestamps(); // If your pivot table has timestamps
    }

    // Optional: Relationship to user who created it
    public function creator()
    {
         return $this->belongsTo(User::class, 'created_by_user_id');
     }
}