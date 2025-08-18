<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DomainCheckResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'domain_name',
        'http_status',
        'remark',
        'checked_at',
    ];

    protected $casts = [
        'checked_at' => 'datetime',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(DomainCheckBatch::class, 'batch_id');
    }
}



