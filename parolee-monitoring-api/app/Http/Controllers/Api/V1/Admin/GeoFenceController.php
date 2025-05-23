<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\GeoFenceResource;
use App\Models\GeoFence;
use App\Models\User; // For assigning to parolee
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GeoFenceController extends Controller
{
    /**
     * Display a listing of the geofences.
     */
    public function index(Request $request): JsonResponse
    {
        $query = GeoFence::withCount('parolees'); // Get count of assigned parolees

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', (bool)$request->is_active);
        }

        $geofences = $query->latest()->paginate($request->input('per_page', 15));
        return GeoFenceResource::collection($geofences)->response();
    }

    /**
     * Store a newly created geofence in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:geofences,name'],
            'description' => ['nullable', 'string'],
            'geometry_data' => ['required', 'array'], // Basic validation, more specific based on type
            'geometry_data.type' => ['required', Rule::in(['Polygon', 'Circle'])],
            'geometry_data.coordinates' => ['required_if:geometry_data.type,Polygon', 'array'],
            'geometry_data.coordinates.*' => ['required_if:geometry_data.type,Polygon', 'array'], // Array of points
            'geometry_data.coordinates.*.*' => ['numeric'], // Lng, Lat
            'geometry_data.center' => ['required_if:geometry_data.type,Circle', 'array', 'size:2'],
            'geometry_data.center.*' => ['numeric'], // Lng, Lat
            'geometry_data.radius_meters' => ['required_if:geometry_data.type,Circle', 'numeric', 'min:1'],
            'type' => ['required', Rule::in(['allowed', 'restricted'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // More specific validation for coordinates can be added here
        // e.g., polygon must have at least 4 points (first and last same)

        try {
            DB::beginTransaction();
            $geofence = GeoFence::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'geometry_data' => $validated['geometry_data'],
                'type' => $validated['type'],
                'is_active' => $validated['is_active'] ?? true,
                'created_by_user_id' => Auth::id(),
            ]);
            DB::commit();
            return (new GeoFenceResource($geofence))->response()->setStatusCode(HttpResponse::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('GeoFence creation failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to create geofence.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified geofence.
     */
    public function show(GeoFence $geofence): JsonResponse
    {
        return (new GeoFenceResource($geofence->load('parolees:id,name')))->response(); // Load assigned parolees
    }

    /**
     * Update the specified geofence in storage.
     */
    public function update(Request $request, GeoFence $geofence): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('geofences', 'name')->ignore($geofence->id)],
            'description' => ['nullable', 'string'],
            'geometry_data' => ['sometimes', 'required', 'array'],
            'geometry_data.type' => ['sometimes','required', Rule::in(['Polygon', 'Circle'])],
            'geometry_data.coordinates' => ['required_if:geometry_data.type,Polygon', 'array'],
            'geometry_data.coordinates.*' => ['required_if:geometry_data.type,Polygon', 'array'], // Array of points
            'geometry_data.coordinates.*.*' => ['numeric'], // Lng, Lat
            'geometry_data.center' => ['required_if:geometry_data.type,Circle', 'array', 'size:2'],
            'geometry_data.center.*' => ['numeric'], // Lng, Lat
            'geometry_data.radius_meters' => ['required_if:geometry_data.type,Circle', 'numeric', 'min:1'],
            'type' => ['sometimes', 'required', Rule::in(['allowed', 'restricted'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        try {
            DB::beginTransaction();
            $geofence->update($validated);
            DB::commit();
            return (new GeoFenceResource($geofence->fresh()->load('parolees:id,name')))->response();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('GeoFence update failed: ' . $e->getMessage(), ['geofence_id' => $geofence->id, 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to update geofence.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified geofence from storage.
     */
    public function destroy(GeoFence $geofence): JsonResponse
    {
        try {
            DB::beginTransaction();
            // Unassign from all parolees first (pivot table records will be deleted by cascade if set up,
            // or manually detach if needed: $geofence->parolees()->detach();)
            $geofence->delete();
            DB::commit();
            return response()->json(null, HttpResponse::HTTP_NO_CONTENT);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('GeoFence deletion failed: ' . $e->getMessage(), ['geofence_id' => $geofence->id, 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to delete geofence.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Assign geofences to a parolee.
     */
    public function assignToParolee(Request $request, User $user): JsonResponse
    {
        if ($user->user_type !== 'parolee') {
            return response()->json(['message' => 'Geofences can only be assigned to parolees.'], HttpResponse::HTTP_BAD_REQUEST);
        }

        $validated = $request->validate([
            'geofence_ids' => ['required', 'array'],
            'geofence_ids.*' => ['integer', 'exists:geofences,id'],
        ]);

        // Use syncWithoutDetaching to add new assignments without removing existing ones
        // Or use sync() to make the provided list the definitive set of assignments
        $user->assignedGeofences()->syncWithoutDetaching($validated['geofence_ids']);

        return response()->json(['message' => 'Geofences assigned successfully.']);
    }

    /**
     * Unassign geofences from a parolee.
     */
    public function unassignFromParolee(Request $request, User $user): JsonResponse
    {
        if ($user->user_type !== 'parolee') {
            return response()->json(['message' => 'Geofences can only be unassigned from parolees.'], HttpResponse::HTTP_BAD_REQUEST);
        }

        $validated = $request->validate([
            'geofence_ids' => ['required', 'array'],
            'geofence_ids.*' => ['integer', 'exists:geofences,id'],
        ]);

        $user->assignedGeofences()->detach($validated['geofence_ids']);

        return response()->json(['message' => 'Geofences unassigned successfully.']);
    }
}