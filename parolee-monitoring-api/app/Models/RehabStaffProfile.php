<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // <--- IMPORT THE TRAIT
use Illuminate\Database\Eloquent\Model;

class RehabStaffProfile extends Model
{
    use HasFactory; // <--- USE THE TRAIT

    protected $fillable = [
        'user_id',
        'staff_role',
        'department',
        'specialization',
        'degree',
        // Add any other fillable fields
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}