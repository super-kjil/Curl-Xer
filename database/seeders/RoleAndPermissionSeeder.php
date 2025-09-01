<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    public function run()
    {
        // Create permissions
        $permissions = [
            'view_dashboard',
            'view_domain_extractor',
            'view_domain_generator',
            'view_domain_checker',
            'view_domain_history',
            'view_dns_settings',
            'manage_users',
            'manage_roles',
            'manage_permissions',
            'access_admin_panel'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create admin role and assign all permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->syncPermissions($permissions);
    }
}
