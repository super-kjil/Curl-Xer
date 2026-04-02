<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DomainListController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// All routes that require authentication and verification
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard')->middleware('permission:view_dashboard');

    // Domain History - All routes
    Route::prefix('domain-history')->name('domain-history.')->middleware('permission:view_domain_history')->group(function () {
        Route::get('/history', [App\Http\Controllers\DomainCheckerHistoryController::class, 'index'])->name('history');
        Route::get('/history/chart-data', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getChartData'])->name('chart-data');
        Route::get('/history/data', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getHistory'])->name('history-data');
        Route::delete('/history', [App\Http\Controllers\DomainCheckerHistoryController::class, 'deleteHistory'])->name('delete-history');
        Route::delete('/history/clear', [App\Http\Controllers\DomainCheckerHistoryController::class, 'clearHistory'])->name('clear-history');
        Route::get('/history/details', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getHistoryDetails'])->name('history-details');
        Route::get('/history/grouped', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getGroupedHistory'])->name('history-grouped');
        Route::post('/history/delete-batches', [App\Http\Controllers\DomainCheckerHistoryController::class, 'deleteHistoryBatches'])->name('delete-history-batches');
        Route::post('/history/update', [App\Http\Controllers\DomainCheckerHistoryController::class, 'updateHistoryItem'])->name('update-history-item');
        Route::post('/history/delete-result', [App\Http\Controllers\DomainCheckerHistoryController::class, 'deleteResult'])->name('delete-result');

        // Legacy-like endpoint to mirror domain-checker/history.php behavior
        Route::post('/history/legacy', [App\Http\Controllers\DomainCheckerHistoryController::class, 'legacyHistory'])->name('history-legacy');
    });

    // Domain Extractor
    Route::get('domain-extractor', function () {
        return Inertia::render('DomainExt/index');
    })->name('domain-extractor')->middleware('permission:view_domain_extractor');
    
    // Domain List Routes
    Route::middleware('permission:view_domain_list')->group(function () {
        Route::get('domain-list', [DomainListController::class, 'index'])->name('domain-list');
        Route::get('domain-list/domains', [DomainListController::class, 'fetchList'])->name('domain-list.domains');
    });

    // Domain Checker Routes
    Route::prefix('domain-checker')->name('domain-checker.')->middleware('permission:view_domain_checker')->group(function () {
        Route::get('/', [App\Http\Controllers\DomainCheckerController::class, 'index'])->name('index');
        Route::post('/check-urls', [App\Http\Controllers\DomainCheckerController::class, 'checkUrls'])->name('check-urls');
        Route::get('/default-dns', [App\Http\Controllers\DomainCheckerController::class, 'getDefaultDNS'])->name('default-dns');
        Route::get('/dns-servers', [App\Http\Controllers\DomainCheckerSettingsController::class, 'getDNSServers'])->name('dns-servers');
    });

    // DNS Settings Routes (separate from domain-checker to allow independent access)
    Route::prefix('domain-checker/settings')->name('domain-checker.')->middleware('permission:view_dns_settings')->group(function () {
        Route::get('/', [App\Http\Controllers\DomainCheckerSettingsController::class, 'index'])->name('settings');
        Route::post('/', [App\Http\Controllers\DomainCheckerSettingsController::class, 'update'])->name('update-settings');
        Route::get('/get', [App\Http\Controllers\DomainCheckerSettingsController::class, 'getSettings'])->name('get-settings');
        Route::get('/detect-dns', [App\Http\Controllers\DomainCheckerSettingsController::class, 'detectDNS'])->name('detect-dns');

        // Server DNS Cache Management Routes
        Route::post('/refresh-server-dns', [App\Http\Controllers\DomainCheckerSettingsController::class, 'refreshServerDNS'])->name('refresh-server-dns');
        Route::get('/server-dns-status', [App\Http\Controllers\DomainCheckerSettingsController::class, 'getServerDNSStatus'])->name('server-dns-status');
    });
    
    // Domain Generator Routes
    Route::prefix('domain-generator')->name('domain-generator.')->middleware('permission:view_domain_generator')->group(function () {
        Route::get('/', [App\Http\Controllers\DomainGeneratorController::class, 'index'])->name('index');
        Route::post('/generate', [App\Http\Controllers\DomainGeneratorController::class, 'generate'])->name('generate');
    });

    // Admin Routes
    Route::middleware(['permission:access_admin_panel'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [App\Http\Controllers\AdminController::class, 'index'])->name('index');
        
        // User Management Routes
        Route::post('/users', [App\Http\Controllers\AdminController::class, 'storeUser'])->name('users.store')->middleware('permission:manage_users');
        Route::put('/users/{user}', [App\Http\Controllers\AdminController::class, 'updateUser'])->name('users.update')->middleware('permission:manage_users');
        Route::delete('/users/{user}', [App\Http\Controllers\AdminController::class, 'deleteUser'])->name('users.delete')->middleware('permission:manage_users');
        Route::get('/users/{user}/data', [App\Http\Controllers\AdminController::class, 'getUserData'])->name('users.data')->middleware('permission:manage_users');
        
        // Role Management Routes
        Route::post('/roles', [App\Http\Controllers\AdminController::class, 'storeRole'])->name('roles.store')->middleware('permission:manage_roles');
        Route::put('/roles/{role}', [App\Http\Controllers\AdminController::class, 'updateRole'])->name('roles.update')->middleware('permission:manage_roles');
        Route::delete('/roles/{role}', [App\Http\Controllers\AdminController::class, 'deleteRole'])->name('roles.delete')->middleware('permission:manage_roles');
        Route::get('/roles/{role}/data', [App\Http\Controllers\AdminController::class, 'getRoleData'])->name('roles.data')->middleware('permission:manage_roles');
        
        // Admin Registration Routes (for creating new users)
        Route::get('/register', [App\Http\Controllers\Auth\RegisteredUserController::class, 'create'])->name('register');
        Route::post('/register', [App\Http\Controllers\Auth\RegisteredUserController::class, 'store'])->name('register.store');
    });
});

// Error handling routes
Route::get('/403', [App\Http\Controllers\ErrorController::class, 'permissionDenied'])->name('errors.permission-denied');
Route::get('/404', [App\Http\Controllers\ErrorController::class, 'notFound'])->name('errors.not-found');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
