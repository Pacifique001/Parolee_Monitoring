<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity; // Import the Activity model
use App\Http\Resources\ActivityLogResource;
use Illuminate\Http\JsonResponse;
use App\Models\User; // To resolve causer/subject by ID
use Illuminate\Support\Carbon; // Import Carbon for date manipulation

class SystemLogController extends Controller
{
    /**
     * Display a listing of the system activity logs.
     * Supports filtering, pagination, and summary counts.
     */
    public function index(Request $request): JsonResponse
    {
        // --- Main Query for Paginated Logs ---
        $query = Activity::with([
            'causer:id,name,email', // Eager load specific columns from causer
            'subject'             // Eager load the polymorphic subject
        ]);

        // Apply filters to the main query
        $this->applyFilters($query, $request);

        $logs = $query->latest('created_at')->paginate($request->input('per_page', 25));

        // --- Calculate Summaries ---
        // The date range for summaries should ideally match the one used for filtering the main log list,
        // or be a predefined range like "last 30 days" if no date filters are applied to the main list.

        $startDate = $request->filled('start_date')
            ? Carbon::parse($request->start_date)->startOfDay()
            : Carbon::now()->subDays(30)->startOfDay(); // Default to last 30 days

        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->end_date)->endOfDay()
            : Carbon::now()->endOfDay(); // Default to today

        $summary = [
            'login_events' => Activity::where('log_name', 'authentications')
                                     ->whereBetween('created_at', [$startDate, $endDate])
                                     ->count(),
            'modifications' => Activity::where(function ($q) {
                                        $q->whereIn('event', ['created', 'updated', 'deleted'])
                                          ->orWhere('log_name', 'modifications');
                                     })
                                     ->whereBetween('created_at', [$startDate, $endDate])
                                     ->count(),
            'violations' => Activity::where('log_name', 'violations')
                                   ->whereBetween('created_at', [$startDate, $endDate])
                                   ->count(),
            'system_alerts_logged' => Activity::where('log_name', 'alerts') // Logs specifically named 'alerts'
                                       ->whereBetween('created_at', [$startDate, $endDate])
                                       ->count(),
            // You might have another way to count active system alerts from your 'alerts' table
            // 'active_system_alerts' => \App\Models\Alert::where('status', 'new')->count(),
        ];

        // Add summary to the pagination meta data
        return ActivityLogResource::collection($logs)
            ->additional(['meta' => ['summary' => $summary]])
            ->response();
    }

    /**
     * Apply filters to the activity log query.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param Request $request
     * @return void
     */
    protected function applyFilters($query, Request $request): void
    {
        if ($request->filled('log_name')) {
            $query->where('log_name', $request->log_name);
        }

        if ($request->filled('event')) { // Filter by Spatie's event column (created, updated, deleted, custom)
            $query->where('event', $request->event);
        }

        if ($request->filled('description')) {
            $query->where('description', 'like', '%' . $request->description . '%');
        }

        if ($request->filled('causer_id')) {
            $query->where('causer_type', User::class)->where('causer_id', $request->causer_id);
        } elseif ($request->filled('causer_search')) {
            $users = User::where('name', 'like', '%' . $request->causer_search . '%')
                         ->orWhere('email', 'like', '%' . $request->causer_search . '%')
                         ->pluck('id');
            if ($users->isNotEmpty()) {
                $query->where('causer_type', User::class)->whereIn('causer_id', $users);
            } else {
                $query->whereRaw('1 = 0'); // No results if causer search yields no users
            }
        }

        if ($request->filled('subject_id') && $request->filled('subject_type')) {
            $subjectType = $this->mapSubjectType($request->subject_type);
            if ($subjectType) {
                $query->where('subject_type', $subjectType)->where('subject_id', $request->subject_id);
            }
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', Carbon::parse($request->start_date)->startOfDay());
        }
        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', Carbon::parse($request->end_date)->endOfDay());
        }
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
            'alert' => \App\Models\Alert::class, // Assuming you have an Alert model
            'health_metric' => \App\Models\HealthMetric::class,
            'gps_location' => \App\Models\GpsLocation::class,
            // Add other mappings as needed
        ];
        return $map[strtolower(str_replace('-', '_', $type))] ?? null; // Handle kebab-case input
    }
}