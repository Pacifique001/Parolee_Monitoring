<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity; // Import the Activity model
use App\Http\Resources\ActivityLogResource; // We'll create this
use Illuminate\Http\JsonResponse;
use App\Models\User; // To resolve causer/subject by ID

class SystemLogController extends Controller
{
    /**
     * Display a listing of the system activity logs.
     * Supports filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Activity::with(['causer', 'subject']); // Eager load causer and subject relationships

        // Filter by log name (e.g., 'user_activity', 'default', 'security')
        if ($request->filled('log_name')) {
            $query->where('log_name', $request->log_name);
        }

        // Filter by description (what happened)
        if ($request->filled('description')) {
            $query->where('description', 'like', '%' . $request->description . '%');
        }

        // Filter by causer (who performed the action)
        // Can accept user ID or try to find user by name/email
        if ($request->filled('causer_id')) {
            $query->where('causer_type', User::class)->where('causer_id', $request->causer_id);
        } elseif ($request->filled('causer_search')) {
            $users = User::where('name', 'like', '%' . $request->causer_search . '%')
                         ->orWhere('email', 'like', '%' . $request->causer_search . '%')
                         ->pluck('id');
            if ($users->isNotEmpty()) {
                $query->where('causer_type', User::class)->whereIn('causer_id', $users);
            } else {
                // If no user found by search, return no results for this filter to avoid errors
                $query->whereRaw('1 = 0');
            }
        }


        // Filter by subject (on what model the action was performed)
        if ($request->filled('subject_id') && $request->filled('subject_type')) {
            // Note: subject_type should be the fully qualified class name, e.g., App\Models\User
            // Frontend might send a simpler string that you map here.
            $subjectType = $this->mapSubjectType($request->subject_type);
            if ($subjectType) {
                $query->where('subject_type', $subjectType)->where('subject_id', $request->subject_id);
            }
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->end_date . ' 23:59:59');
        }

        $logs = $query->latest()->paginate($request->input('per_page', 25));

        return ActivityLogResource::collection($logs)->response();
    }

    /**
     * Helper to map frontend-friendly subject type strings to model class names.
     */
    protected function mapSubjectType(string $type): ?string
    {
        $map = [
            'user' => User::class,
            'role' => \Spatie\Permission\Models\Role::class,
            'permission' => \Spatie\Permission\Models\Permission::class,
            'iot_device' => \App\Models\IotDevice::class,
            'alert' => \App\Models\Alert::class,
            // Add other mappings as needed
        ];
        return $map[strtolower($type)] ?? null;
    }
}