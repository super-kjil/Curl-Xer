<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UrlCheck extends Model
{
    use HasFactory;

    protected $fillable = [
        'check_id',
        'command',
        'url_count',
        'results',
        'timestamp',
        'success_rate',
        'primary_dns',
        'secondary_dns',
        'user_id',
    ];

    protected $casts = [
        'results' => 'array',
        'timestamp' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
