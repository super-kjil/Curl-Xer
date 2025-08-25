<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_user_can_access_admin_routes(): void
    {
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

        // Create admin role
        $adminRole = Role::create(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Create admin user
        $adminUser = User::factory()->create();
        $adminUser->assignRole('admin');

        $this->actingAs($adminUser);

        // Test admin routes access
        $response = $this->get('/admin');
        $response->assertStatus(200);
    }

    public function test_regular_user_cannot_access_admin_routes(): void
    {
        // Create permissions
        $permissions = [
            'view_dashboard',
            'view_domain_generator',
            'view_domain_checker',
            'view_domain_history',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create user role
        $userRole = Role::create(['name' => 'user']);
        $userRole->givePermissionTo($permissions);

        // Create regular user
        $regularUser = User::factory()->create();
        $regularUser->assignRole('user');

        $this->actingAs($regularUser);

        // Test admin routes access - should be denied
        $response = $this->get('/admin');
        $response->assertStatus(403);
    }

    public function test_user_has_correct_permissions(): void
    {
        // Create permissions
        $permissions = [
            'view_dashboard',
            'view_domain_generator',
            'view_domain_checker',
            'view_domain_history',
            'manage_users', // Add this permission
            'manage_roles', // Add this permission
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create user role
        $userRole = Role::create(['name' => 'user']);
        $userRole->givePermissionTo([
            'view_dashboard',
            'view_domain_generator',
            'view_domain_checker',
            'view_domain_history',
        ]);

        // Create regular user
        $regularUser = User::factory()->create();
        $regularUser->assignRole('user');

        $this->actingAs($regularUser);

        // Test that user has the correct permissions
        $this->assertTrue($regularUser->hasPermissionTo('view_dashboard'));
        $this->assertTrue($regularUser->hasPermissionTo('view_domain_generator'));
        $this->assertTrue($regularUser->hasPermissionTo('view_domain_checker'));
        $this->assertTrue($regularUser->hasPermissionTo('view_domain_history'));
        $this->assertFalse($regularUser->hasPermissionTo('manage_users'));
        $this->assertFalse($regularUser->hasPermissionTo('manage_roles'));
    }

    public function test_admin_user_has_all_permissions(): void
    {
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

        // Create admin role
        $adminRole = Role::create(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Create admin user
        $adminUser = User::factory()->create();
        $adminUser->assignRole('admin');

        $this->actingAs($adminUser);

        // Test that admin has all permissions
        foreach ($permissions as $permission) {
            $this->assertTrue($adminUser->hasPermissionTo($permission));
        }

        $this->assertTrue($adminUser->hasRole('admin'));
    }
}
