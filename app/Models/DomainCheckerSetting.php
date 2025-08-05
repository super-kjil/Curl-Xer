<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DomainCheckerSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'primary_dns',
        'secondary_dns',
        'batch_size',
        'large_batch_size',
        'timeout',
        'auto_detect_dns',
        'custom_dns_servers',
    ];

    protected $casts = [
        'auto_detect_dns' => 'boolean',
        'custom_dns_servers' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
