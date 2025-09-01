<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RestrictRegistration
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Allow registration if no users exist (for initial setup)
        if (User::count() === 0) {
            return $next($request);
        }

        // If users exist, registration is restricted to admin users only
        // Since this is in the guest middleware group, we need to redirect to login
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Registration is restricted. Only administrators can create new accounts.'
            ], 403);
        }
        
        return redirect()->route('login')->with('error', 'Registration is restricted. Only administrators can create new accounts.');
    }
}
