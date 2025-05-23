<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource {
    public function toArray(Request $request): array {
        $authUser = auth()->user();
        $participants = $this->whenLoaded('participants', function () {
            return UserStrippedResource::collection($this->participants);
        });
        
        // Attempt to get a display name for the conversation (e.g., other participant's name)
        $displayName = $this->subject;
        if (!$displayName && $this->relationLoaded('participants') && $authUser) {
            $otherParticipant = $this->participants->firstWhere('id', '!=', $authUser->id);
            $displayName = $otherParticipant ? $otherParticipant->name : 'Conversation';
        }

        return [
            'id' => $this->id,
            'subject' => $this->subject,
            'display_name' => $displayName,
            'participants' => $participants,
            'last_reply_at' => $this->last_reply_at?->toIso8601String(),
            'latest_message' => new MessageResource($this->whenLoaded('latestMessage')),
            // Fixed: Use proper method call with user ID parameter
            'unread_count' => $this->unreadMessagesForUser($authUser->id),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
