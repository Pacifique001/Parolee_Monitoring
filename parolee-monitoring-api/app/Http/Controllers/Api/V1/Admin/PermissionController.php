<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse; // For HTTP status codes

class PermissionController extends Controller
{
    /**
     * Display a listing of the permissions.
     * Supports pagination and optional filtering by name.
     */
    public function index(Request $request): JsonResponse
    {
        $permissions = Permission::query()
            ->when($request->input('search'), function ($query, $searchTerm) {
                $query->where('name', 'like', "%{$searchTerm}%");
            })
            ->when($request->input('guard_name'), function ($query, $guardName) { // Optional: filter by guard
                $query->where('guard_name', $guardName);
            })
            ->orderBy('name') // It's good to sort permissions by name
            ->get();// Default 25 per page, can be overridden

        return PermissionResource::collection($permissions)->response();
    }

    /**
     * Store a newly created permission in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:125', // Max length for permission name in spatie default migration
                Rule::unique('permissions', 'name')->where(function ($query) use ($request) {
                    return $query->where('guard_name', $request->input('guard_name', 'web'));
                }),
            ],
            'guard_name' => ['sometimes', 'string', 'max:125'], // Optional, defaults to 'web'
        ]);

        $permission = Permission::create([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'] ?? 'web', // Default to 'web' if not provided
        ]);

        return (new PermissionResource($permission))->response()->setStatusCode(HttpResponse::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     * NOTE: Often not needed for permissions, as 'name' and 'guard_name' are usually enough.
     * Included for completeness if `apiResource` generates the route.
     * If you excluded 'show' from apiResource, this method won't be hit.
     */
    public function show(Permission $permission): JsonResponse
    {
        return (new PermissionResource($permission))->response();
    }

    /**
     * Update the specified permission in storage.
     */
    public function update(Request $request, Permission $permission): JsonResponse
    {
        // Prevent renaming critical/system-generated permissions if you have any
        // For example, if some permissions are fundamental to the app's core logic.
        // if (in_array($permission->name, ['some_critical_permission'])) {
        //      return response()->json(['message' => "The '{$permission->name}' permission cannot be modified."], HttpResponse::HTTP_FORBIDDEN);
        // }

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:125',
                Rule::unique('permissions', 'name')->ignore($permission->id)->where(function ($query) use ($permission) {
                    return $query->where('guard_name', $permission->guard_name); // Unique for its current guard
                }),
            ],
            // Note: Changing guard_name is generally not recommended once permissions are in use.
            // 'guard_name' => ['sometimes', 'string', 'max:125'],
        ]);

        // Only update name if provided. Guard name changes are tricky and usually avoided.
        if ($request->has('name')) {
            $permission->name = $validated['name'];
            $permission->save();
        }
        // If you allow guard_name update:
        // if ($request->has('guard_name')) {
        //     $permission->guard_name = $validated['guard_name'];
        //     $permission->save();
        // }

        return (new PermissionResource($permission->fresh()))->response();
    }

    /**
     * Remove the specified permission from storage.
     */
    public function destroy(Permission $permission): JsonResponse
    {
        // Prevent deleting critical/system-generated permissions
        // if (in_array($permission->name, ['some_critical_permission'])) {
        //      return response()->json(['message' => "The '{$permission->name}' permission is protected and cannot be deleted."], HttpResponse::HTTP_FORBIDDEN);
        // }

        // Optional: Check if the permission is assigned to any roles or users directly
        if ($permission->roles()->count() > 0 || $permission->users()->count() > 0) {
            return response()->json(['message' => "Cannot delete permission '{$permission->name}' because it is currently assigned to roles or users. Please unassign it first."], HttpResponse::HTTP_CONFLICT); // 409 Conflict
        }

        $permission->delete();

        return response()->json(null, HttpResponse::HTTP_NO_CONTENT);
    }
}