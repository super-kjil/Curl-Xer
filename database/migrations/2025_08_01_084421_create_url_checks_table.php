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
        Schema::create('url_checks', function (Blueprint $table) {
            $table->id();
            $table->string('check_id')->unique(); // This corresponds to the legacy 'id' field
            $table->text('command')->nullable();
            $table->integer('url_count');
            $table->json('results');
            $table->timestamp('timestamp');
            $table->integer('success_rate');
            $table->string('primary_dns')->nullable();
            $table->string('secondary_dns')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('url_checks');
    }
};
