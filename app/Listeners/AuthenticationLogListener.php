<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Spatie\Activitylog\Models\Activity;

class AuthenticationLogListener
{
    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $eventName = class_basename($event);
        $user = $event->user ?? null;
        $description = "User {$eventName}";

        if ($event instanceof Login) {
            $description = "User logged in";
        } elseif ($event instanceof Logout) {
            $description = "User logged out";
        } elseif ($event instanceof Failed) {
            $description = "User login failed";
            // For failed events, we might not have a user object if the email was wrong
            $user = $event->user;
        } elseif ($event instanceof Lockout) {
            $description = "User account locked out";
        } elseif ($event instanceof PasswordReset) {
            $description = "User reset their password";
        } elseif ($event instanceof Registered) {
            $description = "User registered";
        } elseif ($event instanceof Verified) {
            $description = "User email verified";
        }

        activity('auth')
            ->causedBy($user)
            ->withProperties([
                'email' => $event->credentials['email'] ?? ($user ? $user->email : ($event->request->email ?? null)),
            ])
            ->event(strtolower($eventName))
            ->log($description);
    }
}
