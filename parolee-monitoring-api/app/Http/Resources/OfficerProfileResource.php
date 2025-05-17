<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfficerProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // $this->resource refers to the OfficerProfile model instance
        return [
            'id' => $this->id,
            'user_id' => $this->user_id, // Typically included for reference
            'badge_number' => $this->badge_number,
            'rank' => $this->rank,
            'department' => $this->department,
            'unit' => $this->unit,
            'caseload' => $this->caseload,
            // Add any other fields from your OfficerProfile model that you want to expose
            // 'contact_details_specific_to_officer' => $this->contact_details_specific_to_officer,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}