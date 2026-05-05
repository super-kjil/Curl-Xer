<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Event::listen([
            \Illuminate\Auth\Events\Login::class,
            \Illuminate\Auth\Events\Logout::class,
            \Illuminate\Auth\Events\Failed::class,
            \Illuminate\Auth\Events\Lockout::class,
            \Illuminate\Auth\Events\PasswordReset::class,
            \Illuminate\Auth\Events\Registered::class,
            \Illuminate\Auth\Events\Verified::class,
        ], \App\Listeners\AuthenticationLogListener::class);
    }
}
