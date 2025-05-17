<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RehabStaffProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // $this->resource refers to the RehabStaffProfile model instance
        return [
            'id' => $this->id,
            'user_id' => $this->user_id, // Typically included for reference
            'staff_role' => $this->staff_role, // e.g., "Counselor", "Case Manager"
            'department' => $this->department,
            'specialization' => $this->specialization,
            'degree' => $this->degree,
            // Add any other fields from your RehabStaffProfile model
            // 'office_location' => $this->office_location,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}