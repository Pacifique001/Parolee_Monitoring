<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\ParoleeProfile;
use App\Models\OfficerProfile;
use App\Models\RehabStaffProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // For database transactions
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     * Supports pagination and optional filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with([
            'roles:id,name',
            'paroleeProfile',
            'officerProfile',
            'rehabStaffProfile'
        ]);

        if ($request->filled('user_type')) {
            $query->where('user_type', $request->user_type);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $users = $query->latest()->paginate($request->input('per_page', 15));
        return UserResource::collection($users)->response();
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validatedData = $request->validate($this->userValidationRules());

        try {
            DB::beginTransaction();

            $user = User::create([
                'name' => $validatedData['name'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'phone' => $validatedData['phone'] ?? null,
                'user_type' => $validatedData['user_type'],
                'status' => $validatedData['status'],
            ]);

            $user->assignRole($validatedData['roles']); // 'roles' is required in validation

            if ($user->user_type === 'parolee' && $request->filled('parolee_profile')) {
                $user->paroleeProfile()->create($request->input('parolee_profile'));
            } elseif ($user->user_type === 'officer' && $request->filled('officer_profile')) {
                $user->officerProfile()->create($request->input('officer_profile'));
            } elseif ($user->user_type === 'staff' && $request->filled('rehab_staff_profile')) {
                $user->rehabStaffProfile()->create($request->input('rehab_staff_profile'));
            }

            DB::commit();

            return (new UserResource($user->load(['roles', 'paroleeProfile', 'officerProfile', 'rehabStaffProfile'])))
                    ->response()
                    ->setStatusCode(HttpResponse::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User creation failed: ' . $e->getMessage(), ['exception_trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to create user due to a server error.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        return (new UserResource($user->load(['roles', 'paroleeProfile', 'officerProfile', 'rehabStaffProfile'])))
                ->response();
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validatedData = $request->validate($this->userValidationRules($user));

        try {
            DB::beginTransaction();

            $originalUserType = $user->user_type;
            $userDataToUpdate = [];

            if ($request->filled('name')) $userDataToUpdate['name'] = $validatedData['name'];
            if ($request->filled('email')) $userDataToUpdate['email'] = $validatedData['email'];
            if ($request->has('phone')) $userDataToUpdate['phone'] = $validatedData['phone']; // Allow setting phone to null
            if ($request->filled('status')) $userDataToUpdate['status'] = $validatedData['status'];
            if ($request->filled('password')) $userDataToUpdate['password'] = Hash::make($validatedData['password']);
            if ($request->filled('user_type')) $userDataToUpdate['user_type'] = $validatedData['user_type'];

            if (!empty($userDataToUpdate)) {
                $user->update($userDataToUpdate);
            }

            if ($request->has('roles')) {
                $user->syncRoles($validatedData['roles'] ?? []);
            }

            $newUserType = $user->user_type;

            if ($newUserType !== $originalUserType) {
                if ($originalUserType === 'parolee') $user->paroleeProfile?->delete();
                if ($originalUserType === 'officer') $user->officerProfile?->delete();
                if ($originalUserType === 'staff') $user->rehabStaffProfile?->delete();
            }

            if ($newUserType === 'parolee' && $request->filled('parolee_profile')) {
                $user->paroleeProfile()->updateOrCreate([], $request->input('parolee_profile'));
            } elseif ($newUserType === 'officer' && $request->filled('officer_profile')) {
                $user->officerProfile()->updateOrCreate([], $request->input('officer_profile'));
            } elseif ($newUserType === 'staff' && $request->filled('rehab_staff_profile')) {
                $user->rehabStaffProfile()->updateOrCreate([], $request->input('rehab_staff_profile'));
            }

            DB::commit();
            return (new UserResource($user->fresh()->load(['roles', 'paroleeProfile', 'officerProfile', 'rehabStaffProfile'])))
                ->response();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User update failed: ' . $e->getMessage(), ['user_id' => $user->id, 'exception_trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to update user due to a server error.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): JsonResponse
    {
        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'You cannot delete your own account.'], HttpResponse::HTTP_FORBIDDEN);
        }
        if ($user->hasRole('System Administrator')) {
            $adminCount = User::role('System Administrator')->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the last System Administrator.'], HttpResponse::HTTP_FORBIDDEN);
            }
        }

        try {
            DB::beginTransaction();
            // Profiles should ideally be deleted via cascading foreign keys (onDelete('cascade'))
            // If not, you might need to delete them explicitly, though User model's delete event is better
            $user->delete();
            DB::commit();
            return response()->json(null, HttpResponse::HTTP_NO_CONTENT);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User deletion failed: ' . $e->getMessage(), ['user_id' => $user->id, 'exception_trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to delete user due to a server error.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Assign roles to the specified user.
     */
    public function assignRoles(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'roles' => ['required', 'array', 'min:1'], // User must have at least one role
            'roles.*' => ['string', 'exists:roles,name'],
        ]);

        $user->syncRoles($validated['roles']);
        return (new UserResource($user->load('roles')))->response();
    }

    /**
     * Sync direct permissions for the specified user.
     */
    public function syncPermissions(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'permissions' => ['required', 'array'], // Can be empty array to remove all direct permissions
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $user->syncPermissions($validated['permissions']);
        return (new UserResource($user->load('permissions', 'roles')))->response();
    }

    /**
     * Activate the specified user.
     */
    public function activate(User $user): JsonResponse
    {
        if ($user->id === Auth::id() && $user->status === 'active') {
            return response()->json(['message' => 'This account is already active.'], HttpResponse::HTTP_BAD_REQUEST);
        }
        $user->status = 'active';
        $user->save();
        Log::info("User account activated by admin.", ['admin_id' => Auth::id(), 'user_id' => $user->id]);
        return (new UserResource($user->fresh()->load('roles')))->response();
    }

    /**
     * Deactivate (suspend) the specified user.
     */
    public function deactivate(User $user): JsonResponse
    {
        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], HttpResponse::HTTP_FORBIDDEN);
        }
        if ($user->hasRole('System Administrator')) {
            $adminCount = User::role('System Administrator')->where('status', 'active')->count();
            if ($adminCount <= 1 && $user->status === 'active') {
                return response()->json(['message' => 'Cannot deactivate the last active System Administrator.'], HttpResponse::HTTP_FORBIDDEN);
            }
        }
        $user->status = 'suspended';
        $user->save();
        Log::info("User account deactivated by admin.", ['admin_id' => Auth::id(), 'user_id' => $user->id]);
        return (new UserResource($user->fresh()->load('roles')))->response();
    }

    /**
     * Reset the password for the specified user (admin action).
     */
    public function adminResetPassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);
        $user->password = Hash::make($validated['password']);
        $user->save();
        Log::info("User password reset by admin.", ['admin_id' => Auth::id(), 'user_id' => $user->id]);
        return response()->json(['message' => "Password for user '{$user->name}' has been reset successfully."]);
    }

    /**
     * Display activity logs for the specified user. (Placeholder)
     */
    public function activityLogs(User $user): JsonResponse
    {
        // Placeholder - Implement with spatie/laravel-activitylog or custom logging
        $mockLogs = [
            ['timestamp' => now()->subHours(rand(1,5))->toIso8601String(), 'action' => 'Profile updated', 'details' => 'Changed phone number by Admin X'],
            ['timestamp' => now()->subHours(rand(6,10))->toIso8601String(), 'action' => 'Logged in', 'ip_address' => '192.168.1.'.rand(10,99)],
        ];
        return response()->json([
            'message' => "Activity logs for user '{$user->name}'. (Placeholder data)",
            'user_id' => $user->id,
            'logs' => $mockLogs,
        ]);
    }

    /**
     * Helper method for user validation rules.
     *
     * @param User|null $user The user instance for update scenarios (to ignore self for unique rules).
     * @return array
     */
    private function userValidationRules(User $user = null): array
    {
        $isUpdating = $user !== null;
        $emailRule = ['required', 'string', 'email', 'max:255'];
        $passwordRule = $isUpdating ? ['nullable', 'confirmed', Password::defaults()] : ['required', 'confirmed', Password::defaults()];

        if ($isUpdating) {
            $emailRule[] = Rule::unique('users')->ignore($user->id);
        } else {
            $emailRule[] = Rule::unique('users');
        }

        return [
            'name' => [$isUpdating ? 'sometimes' : 'required', 'string', 'max:255'],
            'email' => $emailRule,
            'password' => $passwordRule,
            'phone' => ['nullable', 'string', 'max:25'],
            'user_type' => [$isUpdating ? 'sometimes' : 'required', 'string', Rule::in(['parolee', 'officer', 'staff', 'admin'])],
            'status' => [$isUpdating ? 'sometimes' : 'required', 'string', Rule::in(['active', 'suspended', 'pending', 'high_risk', 'violation', 'inactive'])],
            'roles' => [$isUpdating ? 'nullable' : 'required', 'array', $isUpdating ? '' : 'min:1'],
            'roles.*' => ['string', 'exists:roles,name'],

            // Profile fields (conditional validation)
            'parolee_profile' => ['nullable', 'array', $isUpdating ? '' : 'required_if:user_type,parolee'],
            'parolee_profile.parole_id_number' => [$isUpdating ? 'sometimes' : 'required_if:user_type,parolee', 'string', 'max:255', Rule::unique('parolee_profiles', 'parole_id_number')->ignore(optional($user?->paroleeProfile)->id)],
            'parolee_profile.imprisonment_date' => ['nullable', 'date_format:Y-m-d'],
            'parolee_profile.release_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:parolee_profile.imprisonment_date'],
            'parolee_profile.expected_end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:parolee_profile.release_date'],
            'parolee_profile.conditions' => ['nullable', 'array'],
            'parolee_profile.conditions.*' => ['string', 'max:255'],
            'parolee_profile.home_address' => ['nullable', 'string', 'max:500'],
            'parolee_profile.emergency_contact.name' => ['nullable','required_with:parolee_profile.emergency_contact', 'string', 'max:255'],
            'parolee_profile.emergency_contact.phone' => ['nullable','required_with:parolee_profile.emergency_contact', 'string', 'max:25'],
            'parolee_profile.emergency_contact.relationship' => ['nullable','required_with:parolee_profile.emergency_contact', 'string', 'max:100'],
            'parolee_profile.last_check_in_at' => ['nullable', 'date_format:Y-m-d H:i:sP'], // ISO8601 for input
            'parolee_profile.current_risk_level' => ['nullable', 'string', Rule::in(['low', 'medium', 'high', 'critical'])],
            'parolee_profile.assessment_notes' => ['nullable', 'string'],

            'officer_profile' => ['nullable', 'array', $isUpdating ? '' : 'required_if:user_type,officer'],
            'officer_profile.badge_number' => [$isUpdating ? 'sometimes' : 'required_if:user_type,officer','string', 'max:255', Rule::unique('officer_profiles', 'badge_number')->ignore(optional($user?->officerProfile)->id)],
            'officer_profile.rank' => [$isUpdating ? 'sometimes' : 'required_if:user_type,officer','nullable', 'string', 'max:255'],
            'officer_profile.department' => [$isUpdating ? 'sometimes' : 'required_if:user_type,officer','nullable', 'string', 'max:255'],
            'officer_profile.unit' => ['nullable', 'string', 'max:255'],
            'officer_profile.caseload' => ['nullable', 'integer', 'min:0'],

            'rehab_staff_profile' => ['nullable', 'array', $isUpdating ? '' : 'required_if:user_type,staff'],
            'rehab_staff_profile.staff_role' => [$isUpdating ? 'sometimes' : 'required_if:user_type,staff','string', 'max:255'],
            'rehab_staff_profile.department' => [$isUpdating ? 'sometimes' : 'required_if:user_type,staff','nullable', 'string', 'max:255'],
            'rehab_staff_profile.specialization' => ['nullable', 'string', 'max:255'],
            'rehab_staff_profile.degree' => ['nullable', 'string', 'max:255'],
        ];
    }
}