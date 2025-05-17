<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IotDeviceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'device_eui' => $this->device_eui,
            'name' => $this->name,
            'type' => $this->type,
            'status' => $this->status,
            'battery_level' => $this->battery_level,
            'firmware_version' => $this->firmware_version,
            'last_seen_at' => $this->last_seen_at?->toIso8601String(),
            'meta_data' => $this->meta_data,
            'parolee_user_id' => $this->parolee_user_id,
            'parolee' => new UserStrippedResource($this->whenLoaded('parolee')), // A simplified User resource
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}