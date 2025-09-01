<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ErrorController extends Controller
{
    public function permissionDenied(Request $request)
    {
        return Inertia::render('errors/permission-denied', [
            'message' => 'Access denied. You do not have permission to access this resource.',
            'status' => 403,
        ])->toResponse($request)->setStatusCode(403);
    }

    public function notFound(Request $request)
    {
        return Inertia::render('errors/not-found', [
            'message' => 'The page you are looking for could not be found.',
            'status' => 404,
        ])->toResponse($request)->setStatusCode(404);
    }
}
