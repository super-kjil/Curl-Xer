<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DomainLink extends Model
{
    protected $fillable = [
        'title',
        'badge',
        'description',
        'url',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
