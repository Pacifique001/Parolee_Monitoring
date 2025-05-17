<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParoleeProfileResource extends JsonResource
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
            'user_id' => $this->user_id,
            'parole_id_number' => $this->parole_id_number,
            'imprisonment_date' => $this->imprisonment_date, // Will use cast from model
            'release_date' => $this->release_date,         // Will use cast from model
            'expected_end_date' => $this->expected_end_date, // Will use cast from model
            'conditions' => $this->conditions,             // Will be an array due to cast
            'home_address' => $this->home_address,
            'emergency_contact' => $this->emergency_contact, // Will be an array/object due to cast
            'last_check_in_at' => $this->last_check_in_at, // Will use cast from model
            'current_risk_level' => $this->current_risk_level,
            'assessment_notes' => $this->assessment_notes,
            'iot_device_id' => $this->iot_device_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}