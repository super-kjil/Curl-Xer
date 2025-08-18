<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domain_checker_settings', function (Blueprint $table) {
            $table->unique('user_id', 'uniq_domain_checker_settings_user');
        });
    }

    public function down(): void
    {
        Schema::table('domain_checker_settings', function (Blueprint $table) {
            $table->dropUnique('uniq_domain_checker_settings_user');
        });
    }
};



