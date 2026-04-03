<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add new permissions
        $permissions = [
            'view_domain_comparer',
            'view_domain_extractor',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
        }

        // Give admin role all permissions
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $adminRole->syncPermissions(Permission::all());
        }

        // Give user role standard permissions
        $userRole = Role::where('name', 'user')->first();
        if ($userRole) {
            $userPermissions = [
                'view_dashboard',
                'view_domain_generator',
                'view_domain_checker',
                'view_domain_history',
                'view_domain_list',
                'view_domain_comparer',
                'view_domain_extractor',
            ];
            $userRole->syncPermissions($userPermissions);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Permission::where('name', 'view_domain_comparer')->delete();
        Permission::where('name', 'view_domain_extractor')->delete();
    }
};
