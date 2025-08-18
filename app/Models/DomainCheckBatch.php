<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DomainCheckBatch extends Model
{
	use HasFactory;

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



