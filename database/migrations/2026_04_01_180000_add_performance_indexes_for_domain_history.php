<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domain_check_batches', function (Blueprint $table) {
            $table->index('created_at', 'idx_batches_created_at');
        });

        Schema::table('domain_check_results', function (Blueprint $table) {
            $table->index(['batch_id', 'checked_at'], 'idx_results_batch_checked_at');
            $table->index(['batch_id', 'http_status'], 'idx_results_batch_http_status');
        });
    }

    public function down(): void
    {
        Schema::table('domain_check_results', function (Blueprint $table) {
            $table->dropIndex('idx_results_batch_http_status');
            $table->dropIndex('idx_results_batch_checked_at');
        });

        Schema::table('domain_check_batches', function (Blueprint $table) {
            $table->dropIndex('idx_batches_created_at');
        });
    }
};

