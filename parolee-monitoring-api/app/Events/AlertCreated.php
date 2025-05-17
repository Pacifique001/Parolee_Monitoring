<?php

namespace App\Events;

use App\Models\Alert; // Import your Alert model
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast; // Optional: if you want to broadcast this event
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AlertCreated // Potentially implements ShouldBroadcast if you use WebSockets
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Alert $alert; // Make the alert public so listeners can access it

    /**
     * Create a new event instance.
     *
     * @param \App\Models\Alert $alert
     * @return void
     */
    public function __construct(Alert $alert)
    {
        $this->alert = $alert;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    // public function broadcastOn(): array // Uncomment and implement if using broadcasting
    // {
    //     // Example: Broadcast to a private channel for admins or specific officers
    //     // return [
    //     //     new PrivateChannel('alerts.admin'),
    //     //     new PrivateChannel('alerts.officer.' . $this->alert->parolee?->assignedOfficer?->id),
    //     // ];
    //     return []; // Default if not broadcasting
    // }

    // Optional: Define broadcast event name
    // public function broadcastAs(): string
    // {
    //     return 'new.alert';
    // }

    // Optional: Define broadcast data
    // public function broadcastWith(): array
    // {
    //     return ['alert' => $this->alert->toArray()]; // Or use an AlertResource
    // }
}