<?php
namespace App\Http\Controllers\Api\V1\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use App\Http\Resources\NotificationResource; // Create this resource

class NotificationController extends Controller
{
    /**
     * List notifications for the authenticated staff member.
     */
    public function index(Request $request): JsonResponse
    {
        $staffUser = Auth::user();
        $query = $staffUser->notifications(); // Laravel's built-in relationship

        if ($request->boolean('unread_only')) {
            $query->unread();
        }

        $notifications = $query->latest()
                               ->paginate($request->input('per_page', 15));

        return NotificationResource::collection($notifications)->response();
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, string $notificationId): JsonResponse
    {
        $staffUser = Auth::user();
        $notification = $staffUser->notifications()->where('id', $notificationId)->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found.'], HttpResponse::HTTP_NOT_FOUND);
        }

        $notification->markAsRead();
        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $staffUser = Auth::user();
        $staffUser->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'All unread notifications marked as read.']);
    }

    /**
     * Get count of unread notifications.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $staffUser = Auth::user();
        return response()->json(['unread_count' => $staffUser->unreadNotifications()->count()]);
    }
}