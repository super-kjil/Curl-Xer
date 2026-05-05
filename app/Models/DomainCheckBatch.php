<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class DomainCheckBatch extends Model
{
	use HasFactory, MassPrunable, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['note'])
            ->useLogName('domain_checker')
            ->setDescriptionForEvent(function(string $eventName) {
                if ($eventName === 'created') {
                    return $this->note;
                }
                return "Domain Checker batch {$eventName}";
            })
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

	/**
	 * Get the prunable model query.
	 */
	public function prunable(): Builder
	{
		return static::query()->where('created_at', '<=', now()->subDays(60));
	}

	protected $fillable = [
		'user_id',
		'note',
	];

	public function user(): BelongsTo
	{
		return $this->belongsTo(User::class);
	}

	public function results(): HasMany
	{
		return $this->hasMany(DomainCheckResult::class, 'batch_id');
	}
}



