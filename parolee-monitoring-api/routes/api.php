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

Route::prefix('v1')->name('api.v1.')->group(function () {

    // Public Authentication Routes
    Route::post('/register', [AuthController::class, 'register'])->name('register'); // Keep if you want admin-only registration, otherwise remove
    Route::post('/login', [AuthController::class, 'login'])->name('login');

    // Authenticated Routes (require Sanctum token)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('/user', function (Request $request) {
            return new \App\Http\Resources\UserResource($request->user()->load('roles', 'permissions'));
        })->name('user');

        // --- Admin Specific API Routes ---
        Route::prefix('admin')->name('admin.')->group(function () {

            // User Management
            Route::middleware(['permission:manage users|role:System Administrator'])->group(function () {
                Route::apiResource('/users', ApiAdminUserController::class);
                Route::post('/users/{user}/roles', [ApiAdminUserController::class, 'assignRoles'])->name('users.assignRoles');
                Route::post('/users/{user}/permissions', [ApiAdminUserController::class, 'syncPermissions'])->name('users.syncPermissions');

                // === NEW ROUTES ===
                Route::post('/users/{user}/activate', [ApiAdminUserController::class, 'activate'])->name('users.activate');
                Route::post('/users/{user}/deactivate', [ApiAdminUserController::class, 'deactivate'])->name('users.deactivate');
                Route::post('/users/{user}/reset-password', [ApiAdminUserController::class, 'adminResetPassword'])->name('users.adminResetPassword');
                // For activity logs, it's usually a GET request
                Route::get('/users/{user}/activity-logs', [ApiAdminUserController::class, 'activityLogs'])->name('users.activityLogs');
                // === END NEW ROUTES ===
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

            Route::middleware(['permission:manage iot devices|role:System Administrator'])->group(function () {
                Route::apiResource('/iot-devices', ApiAdminIotDeviceController::class)
                    ->parameters(['iot-devices' => 'iotDevice']); // Specify parameter name for route model binding
            });

            Route::middleware(['permission:view system logs|role:System Administrator'])->group(function () {
                Route::get('/system-logs', [ApiAdminSystemLogController::class, 'index'])->name('system-logs.index');
            });

            // Dashboard Data Endpoint
            Route::get('/dashboard-overview', [ApiAdminDashboardController::class, 'overviewData'])
                ->middleware('role:System Administrator')
                ->name('dashboard.overview');

        });
    });
});