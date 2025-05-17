<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Resources\UserResource; // Import UserResource
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Spatie\Permission\Models\Role as SpatieRole; // Alias if needed, or just Role

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:25'],
            'user_type' => ['sometimes', 'string', \Illuminate\Validation\Rule::in(['parolee', 'officer', 'staff'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'user_type' => $validated['user_type'] ?? 'parolee', // Default to 'parolee' if not provided
            'status' => 'pending', // New users start as pending
        ]);

        // Assign a default role based on user_type
        $defaultRoleName = match ($user->user_type) {
            'officer' => 'Parole Officer',
            'staff' => 'Support Staff', // Or 'Case Manager'
            default => 'Parolee',
        };
        $role = SpatieRole::findByName($defaultRoleName, 'web');
        if ($role) {
            $user->assignRole($role);
        }

        $token = $user->createToken($request->input('device_name', 'api-register-token'))->plainTextToken;

        // Load relationships for the UserResource
        $user->load('roles');

        return response()->json([
            'message' => 'User registered successfully. Account status: pending.',
            'user' => new UserResource($user), // Use UserResource
            'token' => $token,
            'token_type' => 'Bearer',
        ], HttpResponse::HTTP_CREATED);
    }

    /**
     * Authenticate the user and return a token, roles, and all permissions.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid login details.'
            ], HttpResponse::HTTP_UNAUTHORIZED);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is not active. Current status: ' . $user->status . '. Please contact support.',
            ], HttpResponse::HTTP_FORBIDDEN);
        }

        // Optional: Revoke all old tokens for this user
        // $user->tokens()->delete();

        $deviceName = $request->input('device_name', $request->userAgent() ?? 'api-login-token');
        $token = $user->createToken($deviceName)->plainTextToken;

        // Load roles to be included by UserResource (getAllPermissions will be handled within UserResource)
        $user->load('roles');

        return response()->json([
            'message' => 'Login successful.',
            'user' => new UserResource($user), // UserResource will now include 'roles' and 'all_permissions'
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Log the user out (revoke the token).
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
            return response()->json([
                'message' => 'Successfully logged out.'
            ]);
        }
        return response()->json(['message' => 'No user authenticated.'], HttpResponse::HTTP_UNAUTHORIZED);
    }

    /**
     * Get the authenticated User with their roles and all permissions.
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            // Load roles for UserResource. getAllPermissions is handled within UserResource.
            $user->load('roles');
            return response()->json(new UserResource($user));
        }
        return response()->json(['message' => 'Unauthenticated.'], HttpResponse::HTTP_UNAUTHORIZED);
    }
}