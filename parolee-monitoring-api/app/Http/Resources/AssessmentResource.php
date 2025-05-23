<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssessmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parolee_user_id' => $this->parolee_user_id,
            'parolee_name' => $this->whenLoaded('parolee', $this->parolee?->name),
            'conducted_by_user_id' => $this->conducted_by_user_id,
            'conductor_name' => $this->whenLoaded('conductor', $this->conductor?->name),
            'type' => $this->type,
            'status' => $this->status,
            'notes' => $this->notes,
            'recommendations' => $this->recommendations, // Already cast to array in model
            'assessment_date' => $this->assessment_date?->format('Y-m-d'),
            'next_review_date' => $this->next_review_date?->format('Y-m-d'),
            'details' => $this->details, // Already cast to array in model
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}