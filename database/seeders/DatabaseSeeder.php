<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@dnschecker.com',
            'password' => bcrypt('P@ssw0rd807'), // Ensure to hash the password
            'is_admin' => true, // Assuming you have an is_admin field to distinguish admin
        ]);
    }
}
