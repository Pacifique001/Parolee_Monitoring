<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // Basic user information
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'user_type' => $this->user_type,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),

            // Roles and Permissions
            'roles' => RoleResource::collection($this->whenLoaded('roles')),
            
            // All permissions (direct + inherited from roles) - using the model's computed attribute
            'all_permissions' => PermissionResource::collection($this->all_permissions),
            
            // Direct permissions only - using the model's computed attribute
            'direct_permissions' => PermissionResource::collection($this->direct_permissions),
            
            // Role-inherited permissions - using the model's computed attribute
            'role_permissions' => PermissionResource::collection($this->role_permissions),

            // Portal access information - using the model's computed attribute
            'portal_access' => $this->portal_access,

            // Available actions for UI/API - using the model's computed attribute
            'available_actions' => $this->available_actions,

            // Accessible portals array
            'accessible_portals' => $this->getAccessiblePortals(),

            // Profile relationships (conditionally loaded)
            'parolee_profile' => $this->whenLoaded('paroleeProfile', function () {
                //return new ParoleeProfileResource($this->paroleeProfile);
                // Uncomment above and comment below if you have ParoleeProfileResource
                 return $this->paroleeProfile;
            }),
            
            'officer_profile' => $this->whenLoaded('officerProfile', function () {
                //return new OfficerProfileResource($this->officerProfile);
                // Uncomment above and comment below if you have OfficerProfileResource
                 return $this->officerProfile;
            }),
            
            'rehab_staff_profile' => $this->whenLoaded('rehabStaffProfile', function () {
               // return new RehabStaffProfileResource($this->rehabStaffProfile);
                // Uncomment above and comment below if you have RehabStaffProfileResource
                 return $this->rehabStaffProfile;
            }),

            // IoT Device relationship
            'assigned_iot_device' => $this->whenLoaded('iotDevice', function () {
               // return new IotDeviceResource($this->iotDevice);
                // Uncomment above and comment below if you have IotDeviceResource
               return $this->iotDevice;
            }),

            // Geofences relationship
            'assigned_geofences' => $this->whenLoaded('assignedGeofences', function () {
                //return GeofenceResource::collection($this->assignedGeofences);
                // Uncomment above and comment below if you have GeofenceResource
                 return $this->assignedGeofences;
            }),

            // Assessments relationships
            'assessments' => $this->whenLoaded('assessments', function () {
                //return AssessmentResource::collection($this->assessments);
                // Uncomment above and comment below if you have AssessmentResource
               return $this->assessments;
            }),

            'conducted_assessments' => $this->whenLoaded('conductedAssessments', function () {
                //return AssessmentResource::collection($this->conductedAssessments);
                // Uncomment above and comment below if you have AssessmentResource
                 return $this->conductedAssessments;
            }),

            // Conversations relationship
            'conversations' => $this->whenLoaded('conversations', function () {
                //return ConversationResource::collection($this->conversations);
                // Uncomment above and comment below if you have ConversationResource
                return $this->conversations;
            }),
        ];
    }

    /**
     * Get additional data that should be included at the root level
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'permission_structure' => [
                    'total_permissions' => $this->all_permissions->count(),
                    'direct_permissions_count' => $this->direct_permissions->count(),
                    'role_permissions_count' => $this->role_permissions->count(),
                    'roles_count' => $this->whenLoaded('roles', fn() => $this->roles->count(), 0),
                ],
            ],
        ];
    }
}