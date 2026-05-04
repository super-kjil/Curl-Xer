<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\RestrictRegistration;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'permission' => CheckPermission::class,
            'restrict.registration' => RestrictRegistration::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (NotFoundHttpException $e, $request) {
            return Inertia::render('errors/not-found', [
                'status' => 404,
                'message' => 'The page you are looking for could not be found.',
            ])->toResponse($request)->setStatusCode(404);
        });

        $exceptions->render(function (AccessDeniedHttpException $e, $request) {
            return Inertia::render('errors/permission-denied', [
                'status' => 403,
                'message' => 'Access denied. You do not have permission to access this resource.',
            ])->toResponse($request)->setStatusCode(403);
        });
    })->create();
