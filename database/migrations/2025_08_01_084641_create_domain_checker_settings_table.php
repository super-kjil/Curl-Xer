<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('domain_checker_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('primary_dns')->nullable();
            $table->string('secondary_dns')->nullable();
            $table->integer('batch_size')->default(100);
            $table->integer('timeout')->default(30);
            $table->boolean('auto_detect_dns')->default(true);
            $table->json('custom_dns_servers')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('domain_checker_settings');
    }
};
