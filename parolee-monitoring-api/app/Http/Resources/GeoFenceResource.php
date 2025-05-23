<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GeoFenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'geometry_data' => $this->geometry_data, // Will be an array due to model cast
            'type' => $this->type,
            'is_active' => (bool) $this->is_active,
            'created_by' => new UserStrippedResource($this->whenLoaded('creator')),
            'parolee_count' => $this->whenCounted('parolees'), // If you eager load count
            'parolees_assigned' => UserStrippedResource::collection($this->whenLoaded('parolees')), // If you eager load parolees
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}