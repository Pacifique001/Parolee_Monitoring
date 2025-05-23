<?php
namespace App\Http\Controllers\Api\V1\Staff;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Resources\UserStrippedResource;
use App\Events\NewMessageSent;
use Illuminate\Validation\Rule;



class MessageController extends Controller
{
    /**
     * List conversations for the authenticated staff member.
     */
    public function indexThreads(Request $request): JsonResponse
    {
        $staffUser = Auth::user();
        $conversations = $staffUser->conversations()
            ->with(['participants:id,name', 'latestMessage.sender:id,name']) // Eager load for efficiency
            ->paginate($request->input('per_page', 15));

        return ConversationResource::collection($conversations)->response();
    }

    /**
     * Show messages for a specific conversation.
     */
    public function showMessages(Request $request, Conversation $conversation): JsonResponse
    {
        $staffUser = Auth::user();
        if (!$conversation->participants()->where('user_id', $staffUser->id)->exists()) {
            return response()->json(['message' => 'Unauthorized to view this conversation.'], HttpResponse::HTTP_FORBIDDEN);
        }

        $messages = $conversation->messages()->with('sender:id,name,user_type')
                                ->latest()
                                ->paginate($request->input('per_page', 20));

        // Mark messages as read
        $conversation->participants()->updateExistingPivot($staffUser->id, [
            'last_read_at' => now()
        ]);

        return MessageResource::collection($messages)->response();
    }

    public function storeMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $staffUser = Auth::user();
        if (!$conversation->participants()->where('user_id', $staffUser->id)->exists()) {
            return response()->json(['message' => 'Unauthorized to send message in this conversation.'], HttpResponse::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'mimes:jpg,jpeg,png,pdf,doc,docx', 'max:5120'],
        ]);

        try {
            DB::beginTransaction();

            $message = $conversation->messages()->create([
                'user_id' => $staffUser->id,
                'content' => $validated['content'],
            ]);

            // Handle attachments if present
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('message-attachments', 'public');
                    $message->attachments()->create([
                        'file_path' => $path,
                        'file_name' => $file->getClientOriginalName(),
                        'file_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            $conversation->last_reply_at = $message->created_at;
            $conversation->save();

            DB::commit();

            // Dispatch event for real-time updates
            event(new NewMessageSent($message->load('sender:id,name')));

            return (new MessageResource($message->load('sender:id,name')))
                ->response()
                ->setStatusCode(HttpResponse::HTTP_CREATED);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to store message: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to send message.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function startConversation(Request $request): JsonResponse
    {
        $staffUser = Auth::user();
        $validated = $request->validate([
            'recipient_user_id' => ['required', 'integer', 'exists:users,id', Rule::notIn([$staffUser->id])],
            'subject' => ['nullable', 'string', 'max:255'],
            'initial_message_content' => ['required', 'string', 'max:2000'],
        ]);

        $recipient = User::findOrFail($validated['recipient_user_id']);

        // Check for existing conversation
        $existingConversation = Conversation::whereHas('participants', function($query) use ($staffUser) {
            $query->where('user_id', $staffUser->id);
        })->whereHas('participants', function($query) use ($recipient) {
            $query->where('user_id', $recipient->id);
        })->first();

        if ($existingConversation) {
            return (new ConversationResource($existingConversation->load(['participants:id,name', 'latestMessage.sender:id,name'])))
                ->response();
        }

        try {
            DB::beginTransaction();

            $conversation = Conversation::create([
                'subject' => $validated['subject'] ?? "Conversation with {$recipient->name}",
                'last_reply_at' => now(),
            ]);

            $conversation->participants()->attach([$staffUser->id, $recipient->id]);

            $message = $conversation->messages()->create([
                'user_id' => $staffUser->id,
                'content' => $validated['initial_message_content'],
            ]);

            DB::commit();

            event(new NewMessageSent($message->load('sender:id,name')));

            return (new ConversationResource($conversation->load(['participants:id,name', 'latestMessage.sender:id,name'])))
                    ->response()
                    ->setStatusCode(HttpResponse::HTTP_CREATED);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to start conversation: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to start conversation.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function listMessageableUsers(Request $request): JsonResponse
    {
        $query = User::query()
            // Exclude self
            ->where('id', '!=', Auth::id())
            // Optionally, exclude parolees if staff can only message other staff/officers
            ->whereIn('user_type', ['admin', 'officer', 'staff']);

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->filled('user_type') && $request->user_type !== 'all') {
            $query->where('user_type', $request->user_type);
        }

        // Limit results for a selection modal, or paginate if it's a full page
        $users = $query->orderBy('name')->limit(50)->get(['id', 'name', 'email', 'user_type']);

        return UserStrippedResource::collection($users)->response();
    }
}