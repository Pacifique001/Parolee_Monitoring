<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model {
    use HasFactory;
    
    protected $fillable = ['conversation_id', 'user_id', 'content', 'attachments'];
    protected $casts = ['attachments' => 'array'];
    
    public function conversation() { 
        return $this->belongsTo(Conversation::class); 
    }
    
    public function sender() { 
        return $this->belongsTo(User::class, 'user_id'); 
    }
    
    public function attachments() { 
        return $this->hasMany(MessageAttachment::class); 
    }
    
    // Boot method to update conversation's last_reply_at when message is created
    protected static function boot()
    {
        parent::boot();
        
        static::created(function ($message) {
            $message->conversation->update([
                'last_reply_at' => $message->created_at
            ]);
        });
    }
}