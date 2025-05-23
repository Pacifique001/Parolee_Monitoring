<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;
    
    protected $fillable = ['subject', 'last_reply_at'];
    protected $casts = ['last_reply_at' => 'datetime'];
    
    public function participants()
    {
        return $this->belongsToMany(User::class, 'conversation_user')
            ->withTimestamps()
            ->withPivot('last_read_at');
    }
    
    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }
    
    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    // Fixed: Proper implementation using pivot table for read status
    public function unreadMessagesForUser($userId)
    {
        // Get the user's last_read_at timestamp from the pivot table
        $participant = $this->participants()->where('user_id', $userId)->first();
        $lastReadAt = $participant ? $participant->pivot->last_read_at : null;
        
        // Count messages after the last read timestamp, excluding user's own messages
        $query = $this->messages()->where('user_id', '!=', $userId);
        
        if ($lastReadAt) {
            $query->where('created_at', '>', $lastReadAt);
        }
        
        return $query->count();
    }
    
    // Helper method to mark conversation as read for a user
    public function markAsReadForUser($userId)
    {
        $this->participants()->updateExistingPivot($userId, [
            'last_read_at' => now()
        ]);
    }
}