<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
class NotificationResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'type_short' => class_basename($this->type), // e.g., "NewSystemAlert"
            'data' => $this->data, // The payload of the notification
            'read_at' => $this->read_at ? Carbon::parse($this->read_at)->toIso8601String() : null,
            'created_at' => Carbon::parse($this->created_at)->toIso8601String(),
            'created_at_human' => Carbon::parse($this->created_at)->diffForHumans(),
        ];
    }
}