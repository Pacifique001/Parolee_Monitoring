<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
// Import RoleResource and PermissionResource
use App\Http\Resources\RoleResource;
use App\Http\Resources\PermissionResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // The $this->resource is the User model instance
        $user = $this->resource;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'user_type' => $user->user_type,
            'status' => $user->status,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'created_at' => $user->created_at->toIso8601String(),
            'updated_at' => $user->updated_at->toIso8601String(),

            // Include roles, formatted by RoleResource
            'roles' => RoleResource::collection($this->whenLoaded('roles')),

            // Include ALL permissions (direct and inherited via roles)
            // This will call $user->getAllPermissions()
            'permissions' => PermissionResource::collection($user->getAllPermissions()),

            'assigned_iot_device' => new IotDeviceResource($this->whenLoaded('iotDevice')),

            // Conditionally load profiles (assuming you have these resources created)
            'parolee_profile' => $this->whenLoaded('paroleeProfile', function () use ($user) {
                // return new ParoleeProfileResource($user->paroleeProfile);
                return $user->paroleeProfile; // Or return raw data if resource not complex
            }),
            'officer_profile' => $this->whenLoaded('officerProfile', function () use ($user) {
                // return new OfficerProfileResource($user->officerProfile);
                return $user->officerProfile;
            }),
            'rehab_staff_profile' => $this->whenLoaded('rehabStaffProfile', function () use ($user) {
                // return new RehabStaffProfileResource($user->rehabStaffProfile);
                return $user->rehabStaffProfile;
            }),
        ];
    }
}