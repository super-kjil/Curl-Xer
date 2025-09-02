<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    // Create roles and permissions for testing
    $adminRole = Role::firstOrCreate(['name' => 'admin']);
    $userRole = Role::firstOrCreate(['name' => 'user']);
    
    $permissions = [
        'view_dashboard',
        'view_domain_history',
        'manage_users',
    ];
    
    foreach ($permissions as $permission) {
        Permission::firstOrCreate(['name' => $permission]);
    }
    
    $adminRole->syncPermissions($permissions);
    $userRole->syncPermissions(['view_dashboard', 'view_domain_history']);
});

test('admin can access domain history page', function () {
    $admin = createAdminUser();
    
    $response = actingAsAdmin($admin)
        ->get('/domain-history/history');
    
    $response->assertStatus(200);
});

test('regular user can access domain history page', function () {
    $user = createRegularUser();
    
    $response = actingAsUser($user)
        ->get('/domain-history/history');
    
    $response->assertStatus(200);
});

test('guest user cannot access domain history page', function () {
    $response = $this->get('/domain-history/history');
    
    $response->assertRedirect('/login');
});

test('admin can delete history items', function () {
    $admin = createAdminUser();
    
    // Create some test data
    $batch = DB::table('domain_check_batches')->insertGetId([
        'note' => 'Test batch',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    $response = actingAsAdmin($admin)
        ->delete('/domain-history/history', ['id' => $batch]);
    
    $response->assertStatus(200)
        ->assertJson(['success' => true]);
});

test('regular user cannot delete history items', function () {
    $user = createRegularUser();
    
    // Create some test data
    $batch = DB::table('domain_check_batches')->insertGetId([
        'note' => 'Test batch',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    $response = actingAsUser($user)
        ->delete('/domain-history/history', ['id' => $batch]);
    
    $response->assertStatus(403)
        ->assertJson(['success' => false]);
});

test('dashboard is accessible to authenticated users', function () {
    $user = createRegularUser();
    
    $response = actingAsUser($user)
        ->get('/dashboard');
    
    $response->assertStatus(200);
});

test('dashboard redirects unauthenticated users to login', function () {
    $response = $this->get('/dashboard');
    
    $response->assertRedirect('/login');
});
