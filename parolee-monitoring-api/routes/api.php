<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Admin\UserController as ApiAdminUserController;
use App\Http\Controllers\Api\V1\Admin\RoleController as ApiAdminRoleController;
use App\Http\Controllers\Api\V1\Admin\PermissionController as ApiAdminPermissionController;
use App\Http\Controllers\Api\V1\Admin\DashboardController as ApiAdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\IotDeviceController as ApiAdminIotDeviceController;
use App\Http\Controllers\Api\V1\Admin\SystemLogController as ApiAdminSystemLogController;
use illuminate\Support\Facades\Mail;
// Import your Ingest controllers if they are separate
// use App\Http\Controllers\Api\V1\Ingest\HealthMetricController;
// use App\Http\Controllers\Api\V1\Ingest\GpsLocationController;


Route::prefix('v1')->name('api.v1.')->group(function () {

    // --- PUBLIC AUTHENTICATION & PASSWORD RESET ROUTES ---
    // No 'auth:sanctum' middleware here
    // Route::post('/register', [AuthController::class, 'register'])->name('register'); // Removed as per admin-only registration
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('password.email.api'); // Public
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update.api');   // Public

    // --- IOT DEVICE DATA INGESTION ENDPOINTS ---
    // These typically have their own device-specific authentication, not Sanctum user auth.
    // They are public from a user-session perspective but secured by other means.
    // Route::prefix('ingest')->name('ingest.')->group(function () {
    //     Route::post('/health-metrics', [HealthMetricController::class, 'store'])->name('health-metrics.store');
    //     Route::post('/gps-locations', [GpsLocationController::class, 'store'])->name('gps-locations.store');
    // });


    // --- AUTHENTICATED ROUTES (require Sanctum token) ---
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('/user', function (Request $request) {
            return new \App\Http\Resources\UserResource($request->user()->load(['roles', 'directPermissions', 'allPermissions'])); // Load all relevant user permissions
        })->name('user');

        // --- ADMIN SPECIFIC API ROUTES ---
        // All routes within this group are prefixed with 'admin' and named with 'admin.'
        Route::prefix('admin')->name('admin.')->group(function () {

            // Dashboard Data Endpoint
            Route::get('/dashboard-overview', [ApiAdminDashboardController::class, 'overviewData'])
                 ->middleware('role:System Administrator') // Or 'permission:view dashboard'
                 ->name('dashboard.overview');

            // User Management
            Route::middleware(['permission:manage users|role:System Administrator'])->group(function () {
                Route::apiResource('/users', ApiAdminUserController::class);
                Route::post('/users/{user}/roles', [ApiAdminUserController::class, 'assignRoles'])->name('users.assignRoles');
                Route::post('/users/{user}/permissions', [ApiAdminUserController::class, 'syncPermissions'])->name('users.syncPermissions');
                Route::post('/users/{user}/activate', [ApiAdminUserController::class, 'activate'])->name('users.activate');
                Route::post('/users/{user}/deactivate', [ApiAdminUserController::class, 'deactivate'])->name('users.deactivate');
                Route::post('/users/{user}/reset-password', [ApiAdminUserController::class, 'adminResetPassword'])->name('users.adminResetPassword'); // Admin resetting for another user
                Route::get('/users/{user}/activity-logs', [ApiAdminUserController::class, 'activityLogs'])->name('users.activityLogs');
            });

            // Role Management
            Route::middleware(['permission:manage roles and permissions|role:System Administrator'])->group(function () {
                Route::apiResource('/roles', ApiAdminRoleController::class);
                Route::post('/roles/{role}/permissions', [ApiAdminRoleController::class, 'assignPermissions'])->name('roles.assignPermissions');
                Route::get('/permissions-list', [ApiAdminRoleController::class, 'allPermissions'])->name('permissions.listAll');
            });

            // Permission Management
            Route::middleware(['permission:manage roles and permissions|role:System Administrator'])->group(function () {
                Route::apiResource('/permissions', ApiAdminPermissionController::class)->except(['show']);
            });

            // IoT Device Management
            Route::middleware(['permission:manage iot devices|role:System Administrator'])->group(function () {
                Route::apiResource('/iot-devices', ApiAdminIotDeviceController::class)
                    ->parameters(['iot-devices' => 'iotDevice']);
            });

            // System Logs
            Route::middleware(['permission:view system logs|role:System Administrator'])->group(function () {
                Route::get('/system-logs', [ApiAdminSystemLogController::class, 'index'])->name('system-logs.index');
            });
        });

        // --- OTHER AUTHENTICATED ROUTES (non-admin, e.g., for Officers or Staff if they have direct API access) ---
        // Route::middleware('role:Parole Officer')->prefix('officer')->name('officer.')->group(function() {
        //     // Example: Route::get('/my-parolees', [ApiOfficerController::class, 'getMyParolees'])->name('myparolees');
        // });
    });
});