<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request; // <-- IMPORT THIS
use Illuminate\Auth\AuthenticationException; // <-- IMPORT THIS

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',        // Ensures routes/api.php is loaded
        // apiPrefix: 'api', // Default, so URLs from api.php become /api/...
                            // If your routes/api.php also has Route::prefix('v1'), then URLs become /api/v1/...
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php', // Add if you use broadcasting channels
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // === REGISTER SPATIE PERMISSION MIDDLEWARE ALIASES ===
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            // You can add other custom middleware aliases here if needed
        ]);

        // === OPTIONAL: If you were using Inertia for a web frontend and had HandleInertiaRequests ===
        // $middleware->web(append: [
        //     \App\Http\Middleware\HandleInertiaRequests::class,
        //     \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        // ]);

        // === OPTIONAL: If using Sanctum for SPA authentication (different from API token auth) ===
        // $middleware->api(prepend: [
        //    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        // ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // === CUSTOMIZE API AUTHENTICATION EXCEPTION HANDLING ===
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            // If the request expects JSON (typical for APIs) or is an API route
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            // For standard web requests, redirect to the login route.
            // If your app is API-only, this part might not be strictly necessary,
            // but it's good to have a defined behavior.
            // The default Authenticate middleware usually has a redirectTo method.
            // return redirect()->guest($e->redirectTo() ?? route('login')); // 'login' might not exist for API-only
            // If you have no web login, you might just return the JSON response as above or a generic error.
        });

        // === OPTIONAL: CUSTOMIZE API NOT FOUND EXCEPTION HANDLING ===
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'API endpoint not found.'], 404);
            }
        });

        // === OPTIONAL: CUSTOMIZE API VALIDATION EXCEPTION HANDLING ===
        // By default, Laravel returns a good JSON response for validation errors.
        // But if you wanted to customize it:
        // $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
        //     if ($request->is('api/*') || $request->expectsJson()) {
        //         return response()->json([
        //             'message' => $e->getMessage(),
        //             'errors' => $e->errors(),
        //         ], $e->status);
        //     }
        // });

    })->create();