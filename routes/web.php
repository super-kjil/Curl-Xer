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
        
        // History routes
        Route::get('/history', [App\Http\Controllers\DomainCheckerHistoryController::class, 'index'])->name('history');
        Route::get('/history/data', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getHistory'])->name('history-data');
        Route::get('/history/chart-data', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getChartData'])->name('chart-data');
        Route::delete('/history', [App\Http\Controllers\DomainCheckerHistoryController::class, 'deleteHistory'])->name('delete-history');
        Route::delete('/history/clear', [App\Http\Controllers\DomainCheckerHistoryController::class, 'clearHistory'])->name('clear-history');
        Route::get('/history/details', [App\Http\Controllers\DomainCheckerHistoryController::class, 'getHistoryDetails'])->name('history-details');
        
        // Settings routes
        Route::get('/settings', [App\Http\Controllers\DomainCheckerSettingsController::class, 'index'])->name('settings');
        Route::post('/settings', [App\Http\Controllers\DomainCheckerSettingsController::class, 'update'])->name('update-settings');
        Route::get('/settings/get', [App\Http\Controllers\DomainCheckerSettingsController::class, 'getSettings'])->name('get-settings');
        Route::get('/settings/detect-dns', [App\Http\Controllers\DomainCheckerSettingsController::class, 'detectDNS'])->name('detect-dns');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
