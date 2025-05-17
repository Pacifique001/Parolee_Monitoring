<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Http\Resources\PermissionResource; // For listing permissions
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse; // For HTTP status codes

class RoleController extends Controller
{
    /**
     * Display a listing of the roles.
     * Supports pagination.
     */
    public function index(Request $request): JsonResponse
    {
        // Eager load permissions count for display if needed, or permissions themselves
        $roles = Role::withCount('permissions')
            ->when($request->input('search'), function ($query, $searchTerm) {
                $query->where('name', 'like', "%{$searchTerm}%");
            })
            ->latest()
            ->paginate($request->input('per_page', 15));

        return RoleResource::collection($roles)->response();
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:125', // Max length for role name in spatie default migration
                Rule::unique('roles', 'name')->where(function ($query) {
                    return $query->where('guard_name', 'web'); // Ensure unique for the 'web' guard
                }),
            ],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name,guard_name,web'], // Validate permission names for web guard
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web', // Typically 'web' for web applications
        ]);

        if (!empty($validated['permissions'])) {
            $permissions = Permission::whereIn('name', $validated['permissions'])->where('guard_name', 'web')->get();
            $role->syncPermissions($permissions);
        }

        return (new RoleResource($role->load('permissions')))->response()->setStatusCode(HttpResponse::HTTP_CREATED);
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): JsonResponse
    {
        // Load permissions associated with this role for the response
        return (new RoleResource($role->load('permissions')))->response();
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        // Prevent renaming critical roles like 'System Administrator'
        if (in_array($role->name, ['System Administrator', 'Parolee'])) { // Add other critical roles if needed
            return response()->json(['message' => "The '{$role->name}' role cannot be renamed."], HttpResponse::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'name' => [
                'sometimes', // Allow partial updates
                'required',
                'string',
                'max:125',
                Rule::unique('roles', 'name')->ignore($role->id)->where(function ($query) use ($role) {
                    return $query->where('guard_name', $role->guard_name); // Unique for its current guard
                }),
            ],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name,guard_name,web'],
        ]);

        if ($request->has('name')) {
            $role->name = $validated['name'];
            $role->save();
        }

        if ($request->has('permissions')) {
            $permissionsToSync = $validated['permissions'] ?? [];
            $permissions = Permission::whereIn('name', $permissionsToSync)->where('guard_name', 'web')->get();
            $role->syncPermissions($permissions);
        }

        return (new RoleResource($role->fresh()->load('permissions')))->response();
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role): JsonResponse
    {
        // Prevent deleting critical roles
        if (in_array($role->name, ['System Administrator', 'Parolee', 'Parole Officer', 'Case Manager'])) { // Add other critical roles
            return response()->json(['message' => "The '{$role->name}' role is protected and cannot be deleted."], HttpResponse::HTTP_FORBIDDEN);
        }

        // Optional: Check if the role is assigned to any users
        if ($role->users()->count() > 0) {
            return response()->json(['message' => "Cannot delete role '{$role->name}' because it is assigned to users. Please unassign users first."], HttpResponse::HTTP_CONFLICT); // 409 Conflict
        }

        $role->delete();

        return response()->json(null, HttpResponse::HTTP_NO_CONTENT);
    }

    /**
     * Assign/Sync permissions to the specified role.
     * This can be a separate endpoint or handled within update.
     * Using a separate endpoint can be clearer for permission-only updates.
     */
    public function assignPermissions(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name,guard_name,web'], // Validate permission names exist for the web guard
        ]);

        // Prevent modifying permissions for critical roles through this specific endpoint if desired
        // if (in_array($role->name, ['System Administrator'])) {
        //      return response()->json(['message' => "Permissions for '{$role->name}' are managed systemically."], HttpResponse::HTTP_FORBIDDEN);
        // }

        $permissions = Permission::whereIn('name', $request->permissions)->where('guard_name', 'web')->get();
        $role->syncPermissions($permissions);

        return (new RoleResource($role->load('permissions')))->response();
    }

    /**
     * Get all available permissions (useful for a UI when assigning permissions to a role).
     */
    public function allPermissions(): JsonResponse
    {
        $permissions = Permission::where('guard_name', 'web')->orderBy('name')->get();
        return PermissionResource::collection($permissions)->response();
    }
}