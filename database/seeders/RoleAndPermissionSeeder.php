<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define all permissions
        $permissions = [
            'access_admin_panel',
            'view_dashboard',
            'view_domain_generator',
            'view_domain_checker',
            'view_domain_history',
            'view_domain_list',
            'view_domain_comparer',
            'view_dns_settings',
            'view_domain_extractor',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        // Create roles and assign permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::all());

        $userRole = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        $userRole->syncPermissions([
            'view_dashboard',
            'view_domain_generator',
            'view_domain_checker',
            'view_domain_history',
            'view_domain_list',
            'view_dns_settings',
            'view_domain_comparer',
            'view_domain_extractor',
        ]);

        $this->command->info('Roles and permissions created successfully.');
    }
}
