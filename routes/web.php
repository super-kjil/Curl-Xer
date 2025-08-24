<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Domain Checker Routes
    Route::prefix('domain-checker')->name('domain-checker.')->group(function () {
        Route::get('/', [App\Http\Controllers\DomainCheckerController::class, 'index'])->name('index');
        Route::post('/check-urls', [App\Http\Controllers\DomainCheckerController::class, 'checkUrls'])->name('check-urls');
        Route::get('/default-dns', [App\Http\Controllers\DomainCheckerController::class, 'getDefaultDNS'])->name('default-dns');
        Route::get('/debug-dns', [App\Http\Controllers\DomainCheckerController::class, 'debugDNS'])->name('debug-dns');

        // // History routes
        // Route::get('/history', [App\Http\Controllers\DomainCheckerHistoryController::class, 'index'])->name('history');
        // Route::get('/history/data', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getHistory'])->name('history-data');
        // Route::get('/history/chart-data', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getChartData'])->name('chart-data');
        // Route::delete('/history', [App\Http\Controllers\DomainCheckerHistoryController::class, 'deleteHistory'])->name('delete-history');
        // Route::delete('/history/clear', [App\Http\Controllers\DomainCheckerHistoryController::class, 'clearHistory'])->name('clear-history');
        // Route::get('/history/details', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getHistoryDetails'])->name('history-details');

        // Settings routes
        Route::get('/settings', [App\Http\Controllers\DomainCheckerSettingsController::class, 'index'])->name('settings');
        Route::post('/settings', [App\Http\Controllers\DomainCheckerSettingsController::class, 'update'])->name('update-settings');
        Route::get('/settings/get', [App\Http\Controllers\DomainCheckerSettingsController::class, 'getSettings'])->name('get-settings');
        Route::get('/settings/detect-dns', [App\Http\Controllers\DomainCheckerSettingsController::class, 'detectDNS'])->name('detect-dns');

        // Server DNS Cache Management Routes
        Route::post('/settings/refresh-server-dns', [App\Http\Controllers\DomainCheckerSettingsController::class, 'refreshServerDNS'])->name('refresh-server-dns');
        Route::get('/settings/server-dns-status', [App\Http\Controllers\DomainCheckerSettingsController::class, 'getServerDNSStatus'])->name('server-dns-status');
    });
    // Domain Generator Routes
    Route::prefix('domain-history')->name('domain-history.')->group(function () {
       // History routes
       Route::get('/history', [App\Http\Controllers\DomainCheckerHistoryController::class, 'index'])->name('history');
       Route::get('/history/data', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getHistory'])->name('history-data');
       Route::get('/history/chart-data', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getChartData'])->name('chart-data');
       Route::delete('/history', [App\Http\Controllers\DomainCheckerHistoryController::class, 'deleteHistory'])->name('delete-history');
       Route::delete('/history/clear', [App\Http\Controllers\DomainCheckerHistoryController::class, 'clearHistory'])->name('clear-history');
       Route::get('/history/details', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getHistoryDetails'])->name('history-details');
       Route::get('/history/grouped', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getGroupedHistory'])->name('history-grouped');
       Route::post('/history/delete-batches', [App\Http\Controllers\DomainCheckerHistoryController::class, 'deleteHistoryBatches'])->name('delete-history-batches');

       // Legacy-like endpoint to mirror domain-checker/history.php behavior
       Route::post('/history/legacy', [App\Http\Controllers\DomainCheckerHistoryController::class, 'legacyHistory'])->name('history-legacy');
    });
    // Domain Generator Routes
    Route::prefix('domain-generator')->name('domain-generator.')->group(function () {
        Route::get('/', [App\Http\Controllers\DomainGeneratorController::class, 'index'])->name('index');
        Route::post('/generate', [App\Http\Controllers\DomainGeneratorController::class, 'generate'])->name('generate');
    });

    // Admin Routes
    Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [App\Http\Controllers\AdminController::class, 'index'])->name('index');
        
        // User Management Routes
        Route::post('/users', [App\Http\Controllers\AdminController::class, 'storeUser'])->name('users.store');
        Route::put('/users/{user}', [App\Http\Controllers\AdminController::class, 'updateUser'])->name('users.update');
        Route::delete('/users/{user}', [App\Http\Controllers\AdminController::class, 'deleteUser'])->name('users.delete');
        Route::get('/users/{user}/data', [App\Http\Controllers\AdminController::class, 'getUserData'])->name('users.data');
        
        // Role Management Routes
        Route::post('/roles', [App\Http\Controllers\AdminController::class, 'storeRole'])->name('roles.store');
        Route::put('/roles/{role}', [App\Http\Controllers\AdminController::class, 'updateRole'])->name('roles.update');
        Route::delete('/roles/{role}', [App\Http\Controllers\AdminController::class, 'deleteRole'])->name('roles.delete');
        Route::get('/roles/{role}/data', [App\Http\Controllers\AdminController::class, 'getRoleData'])->name('roles.data');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
