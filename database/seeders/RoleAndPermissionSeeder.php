<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->createPermissions();
        $this->createRoles();
        $this->assignPermissionsToRoles();
    }

    /**
     * Create all permissions
     */
    private function createPermissions(): void
    {
        $permissions = [
            // Dashboard permissions
            'view_dashboard',
            
            // Domain tool permissions
            'view_domain_extractor',
            'view_domain_generator',
            'view_domain_list',
            'view_domain_checker',
            'view_domain_history',
            'view_dns_settings',
            
            // Admin permissions
            'access_admin_panel',
            'manage_users',
            'manage_roles',
            'manage_permissions',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $this->command->info('Permissions created successfully.');
    }

    /**
     * Create all roles
     */
    private function createRoles(): void
    {
        $roles = [
            'admin',
            'user',
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        $this->command->info('Roles created successfully.');
    }

    /**
     * Assign permissions to roles
     */
    private function assignPermissionsToRoles(): void
    {
        // Get all permissions
        $allPermissions = Permission::all();
        
        // Admin role - gets all permissions
        $adminRole = Role::where('name', 'admin')->first();
        $adminRole->syncPermissions($allPermissions);
        
        // User role - gets basic permissions
        $userRole = Role::where('name', 'user')->first();
        $userRole->syncPermissions([
            'view_dashboard',
            'view_domain_generator',
            'view_domain_list',
            'view_domain_checker',
            'view_domain_history',
        ]);
        
        $this->command->info('Permissions assigned to roles successfully.');
    }
}
