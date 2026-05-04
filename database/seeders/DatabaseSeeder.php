<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // First create permissions and roles
            RoleAndPermissionSeeder::class,

            // Then create users and assign roles
            UserSeeder::class,
        ]);

        $this->command->info('Database seeding completed successfully!');
    }
}
