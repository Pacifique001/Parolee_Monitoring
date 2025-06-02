<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password as PasswordValidationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Spatie\Permission\Models\Role as SpatieRole; 
use App\Notifications\SendPasswordResetOtp;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Cache;
// Import the activity() helper or the Activity model if you prefer Facade
// use Spatie\Activitylog\Facades\LogBatch; // If batching
// use Spatie\Activitylog\Models\Activity; // If using the model directly

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
            'password' => ['required', 'confirmed', PasswordValidationRule::defaults()],
            'phone' => ['nullable', 'string', 'max:25'],
            'user_type' => ['sometimes', 'string', \Illuminate\Validation\Rule::in(['parolee', 'officer', 'staff'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'user_type' => $validated['user_type'] ?? 'parolee',
            'status' => 'pending',
        ]);

        // Assign a default role based on user_type
        $defaultRoleName = match ($user->user_type) {
            'officer' => 'Parole Officer',
            'staff' => 'Support Staff',
            default => 'Parolee',
        };
        $role = SpatieRole::findByName($defaultRoleName, 'web');
        if ($role) {
            $user->assignRole($role);
        }

        // Log registration activity (user created is usually handled by LogsActivity trait on User model)
        // But if you want a specific "registration" event:
        activity('authentication')
            ->performedOn($user) // Subject is the new user
            ->withProperties([
                'action_type' => 'user_registered',
                'user_type' => $user->user_type,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ])
            ->log("New user registered: {$user->email} (Status: pending)");


        $token = $user->createToken($request->input('device_name', 'api-register-token'))->plainTextToken;
        $user->load('roles');

        return response()->json([
            'message' => 'User registered successfully. Account status: pending.',
            'user' => new UserResource($user),
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
            // Log failed login attempt
            activity('authentication')
                ->withProperties([
                    'action_type' => 'login_failed',
                    'attempted_email' => $validated['email'],
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'success' => false // Explicitly mark as failed
                ])
                ->log("Failed login attempt for email: {$validated['email']}");

            return response()->json([
                'message' => 'Invalid login details.'
            ], HttpResponse::HTTP_UNAUTHORIZED);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        if ($user->status !== 'active') {
            // Log account status issue during login attempt
            activity('authentication')
                ->causedBy($user) // We know the user, but they can't fully log in
                ->withProperties([
                    'action_type' => 'login_denied_inactive_account',
                    'account_status' => $user->status,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'success' => false
                ])
                ->log("Login denied for user {$user->email} due to inactive account (Status: {$user->status}).");
            
            // It might be good to also revoke any existing tokens if an inactive user tries to log in,
            // though Sanctum tokens are usually tied to devices.
            // $user->tokens()->delete(); // Consider implications before enabling

            return response()->json([
                'message' => 'Your account is not active. Current status: ' . $user->status . '. Please contact support.',
            ], HttpResponse::HTTP_FORBIDDEN);
        }

        $deviceName = $request->input('device_name', $request->userAgent() ?? 'api-login-token');
        $token = $user->createToken($deviceName)->plainTextToken;

        // Log successful login
        activity('authentication')
            ->causedBy($user)
            ->withProperties([
                'action_type' => 'login_success',
                'device_name' => $deviceName,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'success' => true // Explicitly mark as success
            ])
            ->log("User {$user->email} logged in successfully.");

        $user->load('roles');

        return response()->json([
            'message' => 'Login successful.',
            'user' => new UserResource($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Log the user out (revoke the token).
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            // Log successful logout
            activity('authentication')
                ->causedBy($user)
                ->withProperties([
                    'action_type' => 'logout_success',
                    'token_id' => $user->currentAccessToken()->id, // Optional: log which token was revoked
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ])
                ->log("User {$user->email} logged out successfully.");

            $user->currentAccessToken()->delete();
            
            return response()->json([
                'message' => 'Successfully logged out.'
            ]);
        }
        return response()->json(['message' => 'No user authenticated.'], HttpResponse::HTTP_UNAUTHORIZED);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'string', 'email', 'exists:users,email']]);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Log OTP request for non-existent email (optional, for security monitoring)
            activity('password_reset')
                ->withProperties([
                    'action_type' => 'otp_request_email_not_found',
                    'attempted_email' => $request->email,
                    'ip_address' => $request->ip(),
                ])
                ->log("Password reset OTP requested for non-existent email: {$request->email}.");
            return response()->json(['message' => 'If your email address is in our database, you will receive an OTP.'], HttpResponse::HTTP_OK);
        }

        $otpLength = config('auth.passwords.users.otp_length', 6);
        $otpExpires = config('auth.passwords.users.otp_expires', 15);
        $otp = Str::substr(str_shuffle(str_repeat('0123456789', $otpLength)), 0, $otpLength);

        $cacheKey = 'password_reset_otp_' . $user->email;
        Cache::put($cacheKey, $otp, now()->addMinutes($otpExpires));

        try {
            Notification::send($user, new SendPasswordResetOtp($otp, $otpExpires));
            
            // Log successful OTP send
            activity('password_reset')
                ->causedBy($user) // Or system if preferred for this action
                ->performedOn($user) // Subject is the user whose password reset is initiated
                ->withProperties([
                    'action_type' => 'otp_sent_success',
                    'ip_address' => $request->ip(),
                ])
                ->log("Password reset OTP sent successfully to {$user->email}.");

            return response()->json(['message' => 'An OTP has been sent to your email address. It will expire in ' . $otpExpires . ' minutes.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send OTP email: ' . $e->getMessage());

            // Log failed OTP send
            activity('password_reset')
                ->causedBy($user)
                ->performedOn($user)
                ->withProperties([
                    'action_type' => 'otp_sent_failed',
                    'error_message' => Str::limit($e->getMessage(), 200), // Limit error message length
                    'ip_address' => $request->ip(),
                ])
                ->log("Failed to send password reset OTP to {$user->email}.");

            return response()->json(['message' => 'Failed to send OTP. Please try again later.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email', 'exists:users,email'],
            'otp' => ['required', 'string', 'digits:' . config('auth.passwords.users.otp_length', 6)],
            'password' => ['required', 'confirmed', PasswordValidationRule::defaults()],
        ]);

        $user = User::where('email', $request->email)->first();
        $cacheKey = 'password_reset_otp_' . $user->email;
        $cachedOtp = Cache::get($cacheKey);

        if (!$cachedOtp) {
            activity('password_reset')
                ->causedBy($user)
                ->performedOn($user)
                ->withProperties(['action_type' => 'reset_attempt_otp_expired', 'ip_address' => $request->ip(), 'success' => false])
                ->log("Password reset attempt for {$user->email} failed: OTP expired or invalid.");
            return response()->json(['message' => 'OTP has expired or is invalid.'], HttpResponse::HTTP_BAD_REQUEST);
        }

        if ($cachedOtp !== $request->otp) {
            activity('password_reset')
                ->causedBy($user)
                ->performedOn($user)
                ->withProperties(['action_type' => 'reset_attempt_otp_incorrect', 'ip_address' => $request->ip(), 'success' => false])
                ->log("Password reset attempt for {$user->email} failed: Incorrect OTP provided.");
            return response()->json(['message' => 'The provided OTP is incorrect.'], HttpResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->forceFill([
            'password' => Hash::make($request->password),
            'remember_token' => Str::random(60),
        ])->save(); // User model's LogsActivity trait will log this update if $logAttributes includes 'password'

        Cache::forget($cacheKey);

        // Log successful password reset
        activity('password_reset')
            ->causedBy($user)
            ->performedOn($user)
            ->withProperties(['action_type' => 'password_reset_success', 'ip_address' => $request->ip(), 'success' => true])
            ->log("Password for user {$user->email} was successfully reset.");

        return response()->json(['message' => 'Your password has been reset successfully!']);
    }

    /**
     * Get the authenticated User with their roles and all permissions.
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->load('roles');
            return response()->json(new UserResource($user));
        }
        return response()->json(['message' => 'Unauthenticated.'], HttpResponse::HTTP_UNAUTHORIZED);
    }
}