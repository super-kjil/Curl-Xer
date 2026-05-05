<?php

namespace App\Models;

use Spatie\Activitylog\Models\Activity as SpatieActivity;

class Activity extends SpatieActivity
{
    protected static function booted()
    {
        static::creating(function ($activity) {
            $properties = $activity->properties ? $activity->properties->toArray() : [];
            
            // Only add device info if it's not already there and we have a request
            if (!isset($properties['device']) && request()->hasSession()) {
                $properties['device'] = [
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ];
            }
            
            $activity->properties = collect($properties);
        });
    }
}
