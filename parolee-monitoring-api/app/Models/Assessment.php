<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assessment extends Model
{
    use HasFactory;

    protected $fillable = [
        'parolee_user_id',
        'conducted_by_user_id',
        'type',
        'status',
        'notes',
        'recommendations',
        'assessment_date',
        'next_review_date',
        'details',
    ];

    protected $casts = [
        'recommendations' => 'array',
        'details' => 'array',
        'assessment_date' => 'date:Y-m-d', // Cast for consistent API output
        'next_review_date' => 'date:Y-m-d',
    ];

    /**
     * The parolee this assessment belongs to.
     */
    public function parolee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parolee_user_id');
    }

    /**
     * The staff member or officer who conducted/is responsible for the assessment.
     */
    public function conductor(): BelongsTo // Or conductedBy
    {
        return $this->belongsTo(User::class, 'conducted_by_user_id');
    }
}