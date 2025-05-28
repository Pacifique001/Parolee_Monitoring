<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyPortalAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $portal): Response
    {
        if (!$request->user() || !$request->user()->hasPortalAccess($portal)) {
            return response()->json([
                'message' => "Access denied. You don't have permission to access the {$portal} portal."
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}