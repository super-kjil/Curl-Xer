<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Create permissions
        $permissions = [
            'view_dashboard',
            'view_domain_generator',
            'view_domain_checker',
            'view_domain_history',
            'view_dns_settings',
            'manage_users',
            'manage_roles',
            'manage_permissions',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles
        $adminRole = Role::create(['name' => 'admin']);
        $userRole = Role::create(['name' => 'user']);

        // Assign all permissions to admin role
        $adminRole->givePermissionTo(Permission::all());

        // Assign basic permissions to user role
        $userRole->givePermissionTo([
            'view_dashboard',
            'view_domain_generator',
            'view_domain_checker',
            'view_domain_history',
        ]);

        // Create admin user and assign admin role
        $adminUser = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@curlx.com',
            'password' => bcrypt('123'), // Ensure to hash the password
        ]);

        $adminUser->assignRole('admin');

        // Create a regular user for testing
        $regularUser = User::factory()->create([
            'name' => 'User',
            'email' => 'user@curlx.com',
            'password' => bcrypt('123'),
        ]);

        $regularUser->assignRole('user');
    }
}
