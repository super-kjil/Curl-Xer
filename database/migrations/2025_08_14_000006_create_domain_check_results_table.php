<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('domain_check_results')) {
            return;
        }
        Schema::create('domain_check_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('domain_check_batches')->onDelete('cascade');
            $table->string('domain_name');
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->text('remark')->nullable();
            $table->timestamp('checked_at')->useCurrent();
            $table->timestamps();

            $table->index('batch_id', 'idx_results_batch_id');
            $table->index('domain_name', 'idx_results_domain_name');
            $table->index('http_status', 'idx_results_http_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_check_results');
    }
};


