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




Route::prefix('v1')->name('api.v1.')->group(function () {
    // --- PUBLIC ROUTES ---
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('password.email.api');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update.api');

    // --- IOT DEVICE DATA INGESTION ENDPOINTS ---
    Route::prefix('ingest')->name('ingest.')->group(function () {
        Route::post('/health-metrics', [\App\Http\Controllers\Api\V1\Ingest\HealthMetricController::class, 'store'])
            ->name('health-metrics.store');
        Route::post('/gps-locations', [\App\Http\Controllers\Api\V1\Ingest\GpsLocationController::class, 'store'])
            ->name('gps-locations.store');
    });

    // --- AUTHENTICATED ROUTES ---
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('/user', function (Request $request) {
            return $request->user()->load(['roles.permissions', 'permissions']);
        })->name('user');

        // --- ADMIN PORTAL ROUTES ---
        Route::prefix('admin')->name('admin.')->middleware('permission:view users')->group(function () {
            // Dashboard
            Route::get('/dashboard-overview', [ApiAdminDashboardController::class, 'overviewData'])
                ->middleware('permission:view admin dashboard')
                ->name('dashboard.overview');

            // User Management
            Route::prefix('users')->name('users.')->group(function () {
                Route::get('/', [ApiAdminUserController::class, 'index'])
                    ->middleware('permission:view users')
                    ->name('index');
                Route::post('/', [ApiAdminUserController::class, 'store'])
                    ->middleware('permission:create users')
                    ->name('store');
                Route::get('/{user}', [ApiAdminUserController::class, 'show'])
                    ->middleware('permission:view users')
                    ->name('show');
                Route::put('/{user}', [ApiAdminUserController::class, 'update'])
                    ->middleware('permission:edit users')
                    ->name('update');
                Route::delete('/{user}', [ApiAdminUserController::class, 'destroy'])
                    ->middleware('permission:delete users')
                    ->name('destroy');
                Route::post('/{user}/roles', [ApiAdminUserController::class, 'assignRoles'])
                    ->middleware('permission:assign roles')
                    ->name('assignRoles');
                Route::post('/{user}/permissions', [ApiAdminUserController::class, 'syncPermissions'])
                    ->middleware('permission:assign permissions')
                    ->name('syncPermissions');
                Route::post('/{user}/activate', [ApiAdminUserController::class, 'activate'])
                    ->middleware('permission:activate users')
                    ->name('activate');
                Route::post('/{user}/deactivate', [ApiAdminUserController::class, 'deactivate'])
                    ->middleware('permission:deactivate users')
                    ->name(name: 'deactivate');
                Route::post('/{user}/reset-password', [ApiAdminUserController::class, 'adminResetPassword'])
                    ->middleware('permission:reset user password')
                    ->name('adminResetPassword');
                Route::get('/{user}/activity-logs', [ApiAdminUserController::class, 'activityLogs'])
                    ->middleware('permission:view user activity')
                    ->name('activityLogs');
            });

           
            // Role Management
            Route::prefix('roles')->name('roles.')->group(function () {
                // Role CRUD operations
                Route::get('/', [ApiAdminRoleController::class, 'index'])
                    ->middleware('permission:view roles')
                    ->name('index');
                Route::post('/', [ApiAdminRoleController::class, 'store'])
                    ->middleware('permission:create roles')
                    ->name('store');
                Route::get('/{role}', [ApiAdminRoleController::class, 'show'])
                    ->middleware('permission:view roles')
                    ->name('show');
                Route::put('/{role}', [ApiAdminRoleController::class, 'update'])
                    ->middleware('permission:edit roles')
                    ->name('update');
                Route::delete('/{role}', [ApiAdminRoleController::class, 'destroy'])
                    ->middleware('permission:delete roles')
                    ->name('destroy');
                Route::post('/{role}/permissions', [ApiAdminRoleController::class, 'assignPermissions'])
                    ->middleware('permission:assign permissions')
                    ->name('assignPermissions');
            });
                // Permission routes - IMPORTANT: Specific routes MUST come BEFORE apiResource
                
                // Permission CRUD operations
                Route::prefix('permissions')->name('permissions.')->group(function () {
                    Route::get('/', [ApiAdminPermissionController::class, 'index'])
                        ->middleware('permission:view permissions')
                        ->name('index');
                    Route::post('/', [ApiAdminPermissionController::class, 'store'])
                        ->middleware('permission:create permissions')
                        ->name('store');
                    Route::put('/{permission}', [ApiAdminPermissionController::class, 'update'])
                        ->middleware('permission:edit permissions')
                        ->name('update');
                    Route::delete('/{permission}', [ApiAdminPermissionController::class, 'destroy'])
                        ->middleware('permission:delete permissions')
                        ->name('destroy');
                    Route::get('/permissions-list', [ApiAdminPermissionController::class, 'index'])
                        ->middleware('permission:view permissions')
                        ->name('permissions-list');
                    
                });
        
            
            // IoT Devices
            Route::prefix('iot-devices')->name('iot-devices.')->group(function () {
                Route::get('/', [ApiAdminIotDeviceController::class, 'index'])
                    ->middleware('permission:view iot devices')
                    ->name('index');
                Route::post('/', [ApiAdminIotDeviceController::class, 'store'])
                    ->middleware('permission:create iot devices')
                    ->name('store');
                Route::get('/{iotDevice}', [ApiAdminIotDeviceController::class, 'show'])
                    ->middleware('permission:view iot devices')
                    ->name('show');
                Route::put('/{iotDevice}', [ApiAdminIotDeviceController::class, 'update'])
                    ->middleware('permission:edit iot devices')
                    ->name('update');
                Route::delete('/{iotDevice}', [ApiAdminIotDeviceController::class, 'destroy'])
                    ->middleware('permission:delete iot devices')
                    ->name('destroy');
            });

            // System Logs
            Route::get('/system-logs', [ApiAdminSystemLogController::class, 'index'])
                ->middleware('permission:view system logs')
                ->name('system-logs.index');

            // Geofences
            Route::prefix('geofences')->name('geofences.')->group(function () {
                Route::get('/', [GeoFenceController::class, 'index'])
                    ->middleware('permission:view geofences')
                    ->name('index');
                Route::post('/', [GeoFenceController::class, 'store'])
                    ->middleware('permission:create geofences')
                    ->name('store');
                Route::get('/{geofence}', [GeoFenceController::class, 'show'])
                    ->middleware('permission:view geofences')
                    ->name('show');
                Route::put('/{geofence}', [GeoFenceController::class, 'update'])
                    ->middleware('permission:edit geofences')
                    ->name('update');
                Route::delete('/{geofence}', [GeoFenceController::class, 'destroy'])
                    ->middleware('permission:delete geofences')
                    ->name('destroy');
                Route::post('/{user}/assign', [GeoFenceController::class, 'assignToParolee'])
                    ->middleware('permission:assign geofences')
                    ->name('assignToParolee');
                Route::post('/{user}/unassign', [GeoFenceController::class, 'unassignFromParolee'])
                    ->middleware('permission:assign geofences')
                    ->name('unassignFromParolee');
            });
        });

        // --- OFFICER PORTAL ROUTES ---
        Route::prefix('officer')->name('officer.')->middleware('permission:access officer portal')->group(function () {
            Route::get('/dashboard-overview', [ApiOfficerDashboardController::class, 'overviewData'])
                ->middleware('permission:view officer dashboard')
                ->name('dashboard.overview');

            Route::get('/my-parolees', [ApiOfficerParoleeController::class, 'index'])
                ->middleware('permission:view assigned parolees')
                ->name('my-parolees.index');
            Route::get('/my-parolees/{user}', [ApiOfficerParoleeController::class, 'show'])
                ->middleware('permission:view assigned parolees')
                ->name('my-parolees.show');

            Route::get('/communication/threads', [ApiOfficerCommunicationController::class, 'threads'])
                ->middleware('permission:manage parolee communications')
                ->name('communication.threads');
        });

        // --- STAFF PORTAL ROUTES ---
        Route::prefix('staff')->name('staff.')->middleware('permission:access staff portal')->group(function() {
            // Dashboard
            Route::get('/dashboard-overview', [ApiStaffDashboardController::class, 'overviewData'])
                ->middleware('permission:view staff dashboard')
                ->name('dashboard.overview');

            // Assessments
            Route::prefix('assessments')->name('assessments.')->group(function () {
                Route::get('/', [ApiStaffAssessmentController::class, 'index'])
                    ->middleware('permission:view assessments')
                    ->name('index');
                Route::post('/', [ApiStaffAssessmentController::class, 'store'])
                    ->middleware('permission:create assessments')
                    ->name('store');
                Route::get('/{assessment}', [ApiStaffAssessmentController::class, 'show'])
                    ->middleware('permission:view assessments')
                    ->name('show');
                Route::put('/{assessment}', [ApiStaffAssessmentController::class, 'update'])
                    ->middleware('permission:edit assessments')
                    ->name('update');
                Route::delete('/{assessment}', [ApiStaffAssessmentController::class, 'destroy'])
                    ->middleware('permission:delete assessments')
                    ->name('destroy');
            });

            Route::get('/parolees/{user}/assessments', [ApiStaffAssessmentController::class, 'indexForParolee'])
                ->middleware('permission:view assessments')
                ->name('parolees.assessments.index');

            // Notifications
            Route::prefix('notifications')->name('notifications.')->middleware('permission:view staff notifications')->group(function () {
                Route::get('/', [ApiStaffNotificationController::class, 'index'])
                    ->name('index');
                Route::get('/unread-count', [ApiStaffNotificationController::class, 'unreadCount'])
                    ->name('unread-count');
                Route::post('/{notificationId}/mark-as-read', [ApiStaffNotificationController::class, 'markAsRead'])
                    ->middleware('permission:view staff notifications')
                    ->name('markAsRead');
                Route::post('/mark-all-read', [ApiStaffNotificationController::class, 'markAllAsRead'])
                    ->middleware('permission:view staff notifications')
                    ->name('markAllRead');
            });

            // Messages
            Route::prefix('messages')->name('messages.')->group(function () {
                Route::get('/messageable-users', [ApiStaffMessageController::class, 'listMessageableUsers'])
                    ->middleware('permission:view users')
                    ->name('users');
                Route::get('/threads', [ApiStaffMessageController::class, 'indexThreads'])
                    ->middleware('permission:manage staff messages')
                    ->name('threads.index');
                Route::post('/threads', [ApiStaffMessageController::class, 'startConversation'])
                    ->middleware('permission:send messages')
                    ->name('threads.store');
                Route::get('/threads/{conversation}', [ApiStaffMessageController::class, 'showMessages'])
                    ->middleware('permission:manage staff messages')
                    ->name('threads.show');
                Route::post('/threads/{conversation}', [ApiStaffMessageController::class, 'storeMessage'])
                    ->middleware('permission:send messages')
                    ->name('threads.storeMessage');
            });
        });
    });
});