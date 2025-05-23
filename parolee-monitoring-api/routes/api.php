<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Authentication Controller
use App\Http\Controllers\Api\V1\AuthController;

// Admin Controllers
use App\Http\Controllers\Api\V1\Admin\UserController as ApiAdminUserController;
use App\Http\Controllers\Api\V1\Admin\RoleController as ApiAdminRoleController;
use App\Http\Controllers\Api\V1\Admin\PermissionController as ApiAdminPermissionController;
use App\Http\Controllers\Api\V1\Admin\DashboardController as ApiAdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\IotDeviceController as ApiAdminIotDeviceController;
use App\Http\Controllers\Api\V1\Admin\SystemLogController as ApiAdminSystemLogController;
use App\Http\Controllers\Api\V1\Admin\GeoFenceController;
use App\Http\Controllers\Api\V1\Officer\ParoleeController as ApiOfficerParoleeController;

// Officer Controllers (New - Assuming you'll create these)
use App\Http\Controllers\Api\V1\Officer\DashboardController as ApiOfficerDashboardController;
use App\Http\Controllers\Api\V1\Officer\CommunicationController as ApiOfficerCommunicationController; // For later
use App\Http\Controllers\Api\V1\Officer\GpsTrackingController as ApiOfficerGpsTrackingController; // For later

// Staff Controllers (New - Assuming you'll create these)
use App\Http\Controllers\Api\V1\Staff\DashboardController as ApiStaffDashboardController;
use App\Http\Controllers\Api\V1\Staff\AssessmentController as ApiStaffAssessmentController; // For later
use App\Http\Controllers\Api\V1\Staff\MessageController as ApiStaffMessageController; // For later
use App\Http\Controllers\Api\V1\Staff\NotificationController as ApiStaffNotificationController; // For later


// Note: Removed `use illuminate\Support\Facades\Mail;` as it's not used directly in route definitions.

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->name('api.v1.')->group(function () {

    // --- PUBLIC AUTHENTICATION & PASSWORD RESET ROUTES ---
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('password.email.api');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update.api');

    // --- IOT DEVICE DATA INGESTION ENDPOINTS (Concept - Requires device auth) ---
     Route::prefix('ingest')->name('ingest.')->group(function () {
         Route::post('/health-metrics', [\App\Http\Controllers\Api\V1\Ingest\HealthMetricController::class, 'store'])->name('health-metrics.store');
         Route::post('/gps-locations', [\App\Http\Controllers\Api\V1\Ingest\GpsLocationController::class, 'store'])->name('gps-locations.store');
     });

    // --- AUTHENTICATED ROUTES (require Sanctum token) ---
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('/user', function (Request $request) {
            return new \App\Http\Resources\UserResource(
                $request->user()->load(['roles.permissions', 'directPermissions']) // Load roles with their permissions, and direct permissions
            );
        })->name('user');


        // --- ADMIN SPECIFIC API ROUTES ---
        Route::prefix('admin')->name('admin.')->middleware('role:System Administrator')->group(function () {
            Route::get('/dashboard-overview', [ApiAdminDashboardController::class, 'overviewData'])->name('dashboard.overview');

            Route::middleware('permission:manage users')->group(function () {
                Route::apiResource('/users', ApiAdminUserController::class);
                Route::post('/users/{user}/roles', [ApiAdminUserController::class, 'assignRoles'])->name('users.assignRoles');
                Route::post('/users/{user}/permissions', [ApiAdminUserController::class, 'syncPermissions'])->name('users.syncPermissions');
                Route::post('/users/{user}/activate', [ApiAdminUserController::class, 'activate'])->name('users.activate');
                Route::post('/users/{user}/deactivate', [ApiAdminUserController::class, 'deactivate'])->name('users.deactivate');
                Route::post('/users/{user}/reset-password', [ApiAdminUserController::class, 'adminResetPassword'])->name('users.adminResetPassword');
                Route::get('/users/{user}/activity-logs', [ApiAdminUserController::class, 'activityLogs'])->name('users.activityLogs');
            });

            Route::middleware('permission:manage roles and permissions')->group(function () {
                Route::apiResource('/roles', ApiAdminRoleController::class);
                Route::post('/roles/{role}/permissions', [ApiAdminRoleController::class, 'assignPermissions'])->name('roles.assignPermissions');
                Route::get('/permissions-list', [ApiAdminRoleController::class, 'allPermissions'])->name('permissions.listAll'); // From RoleController
                Route::apiResource('/permissions', ApiAdminPermissionController::class)->except(['show']);
            });

            Route::middleware('permission:manage iot devices')->group(function () {
                Route::apiResource('/iot-devices', ApiAdminIotDeviceController::class)
                    ->parameters(['iot-devices' => 'iotDevice']);
            });

            Route::middleware('permission:view system logs')->group(function () {
                Route::get('/system-logs', [ApiAdminSystemLogController::class, 'index'])->name('system-logs.index');
            });

            // --- GEO-FENCE MANAGEMENT ROUTES ---
            Route::middleware('permission:manage geofences')->group(function () {
                Route::apiResource('/geofences', GeoFenceController::class);
                Route::post('/geofences/{user}/assign', [GeoFenceController::class, 'assignToParolee'])->name('geofences.assignToParolee');
                Route::post('/geofences/{user}/unassign', [GeoFenceController::class, 'unassignFromParolee'])->name('geofences.unassignFromParolee');
            });
        });


        // --- OFFICER SPECIFIC API ROUTES ---
        Route::prefix('officer')->name('officer.')->middleware('role:Parole Officer')->group(function () {
            Route::get('/dashboard-overview', [ApiOfficerDashboardController::class, 'overviewData'])->name('dashboard.overview');
            // TODO: Add routes for Officer Communication, GPS Tracking details, assigned parolees, etc.
             //Route::get('/my-parolees', [ApiOfficerParoleeController::class, 'index'])->name('myparolees');
             Route::get('/my-parolees', [ApiOfficerParoleeController::class, 'index'])->middleware('permission:view officer assigned parolees')->name('my-parolees.index');
             Route::get('/my-parolees/{user}', [ApiOfficerParoleeController::class, 'show'])->middleware('permission:view officer assigned parolees')->name('my-parolees.show');
             Route::get('/communication/threads', [ApiOfficerCommunicationController::class, 'threads'])->name('communication.threads');
        });


        // --- STAFF SPECIFIC API ROUTES ---
        Route::prefix('staff')->name('staff.')
            ->middleware('permission:access staff portal|role:Case Manager|role:Support Staff')
            ->group(function() {
                // Dashboard
                Route::get('/dashboard-overview', [ApiStaffDashboardController::class, 'overviewData'])
                    ->middleware('permission:view staff dashboard')
                    ->name('dashboard.overview');

                // Assessments
                Route::apiResource('/assessments', ApiStaffAssessmentController::class)
                    ->middleware('permission:manage assessments');
                Route::get('/parolees/{user}/assessments', [ApiStaffAssessmentController::class, 'indexForParolee'])
                    ->middleware('permission:view assessments')
                    ->name('parolees.assessments.index');

                // Notifications
                Route::middleware('permission:view staff notifications')->group(function () {
                    Route::get('/notifications', [ApiStaffNotificationController::class, 'index'])
                        ->name('notifications.index');
                    Route::get('/notifications/unread-count', [ApiStaffNotificationController::class, 'unreadCount'])
                        ->name('notifications.unread-count');
                    Route::post('/notifications/{notificationId}/mark-as-read', [ApiStaffNotificationController::class, 'markAsRead'])
                        ->name('notifications.markAsRead');
                    Route::post('/notifications/mark-all-read', [ApiStaffNotificationController::class, 'markAllAsRead'])
                        ->name('notifications.markAllRead');
                });
                
                Route::middleware('permission:manage users')->group(function () {
                    Route::apiResource('/users', ApiAdminUserController::class);
                    Route::post('/users/{user}/roles', [ApiAdminUserController::class, 'assignRoles'])->name('users.assignRoles');
                    Route::post('/users/{user}/permissions', [ApiAdminUserController::class, 'syncPermissions'])->name('users.syncPermissions');
                    Route::post('/users/{user}/activate', [ApiAdminUserController::class, 'activate'])->name('users.activate');
                    Route::post('/users/{user}/deactivate', [ApiAdminUserController::class, 'deactivate'])->name('users.deactivate');
                    Route::post('/users/{user}/reset-password', [ApiAdminUserController::class, 'adminResetPassword'])->name('users.adminResetPassword');
                    Route::get('/users/{user}/activity-logs', [ApiAdminUserController::class, 'activityLogs'])->name('users.activityLogs');
                });
                // Messages
                Route::middleware('permission:manage staff messages')->group(function () {
                    Route::get('/messageable-users', [ApiStaffMessageController::class, 'listMessageableUsers'])
                        ->name('messages.users');
                    Route::get('/messages/threads', [ApiStaffMessageController::class, 'indexThreads'])
                        ->name('messages.threads.index');
                    Route::post('/messages/threads', [ApiStaffMessageController::class, 'startConversation'])
                        ->name('messages.threads.store');
                    Route::get('/messages/threads/{conversation}', [ApiStaffMessageController::class, 'showMessages'])
                        ->name('messages.threads.show');
                    Route::post('/messages/threads/{conversation}', [ApiStaffMessageController::class, 'storeMessage'])
                        ->name('messages.threads.storeMessage');
                        Route::get('/messageable-users', [ApiStaffMessageController::class, 'listMessageableUsers'])->name('messages.users');
                });
            });
    });
});

