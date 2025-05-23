<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender' => new UserStrippedResource($this->whenLoaded('sender')),
            'content' => $this->content,
            'attachments' => MessageAttachmentResource::collection($this->whenLoaded('attachments')),
            'sent_at' => $this->created_at->toIso8601String(),
        ];
    }
}