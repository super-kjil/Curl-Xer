<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class AdminController extends Controller
{
    public function index()
    {
        // Only show regular users (non-admin users) in the admin panel
        $regularUsers = User::with('roles')->whereDoesntHave('roles', function($query) {
            $query->where('name', 'admin');
        })->get();
        
        $roles = Role::with(['permissions', 'users'])->get();
        $permissions = Permission::all();

        // Get statistics for regular users only
        $stats = [
            'total_users' => $regularUsers->count(),
            'active_users' => $regularUsers->count(), // You can add active status logic
            'admin_users' => User::role('admin')->count(), // Show admin count but don't display them
            'new_users' => $regularUsers->where('created_at', '>=', now()->startOfMonth())->count(),
            'total_roles' => $roles->count(),
            'total_permissions' => $permissions->count(),
        ];

        return Inertia::render('Admin/Index', [
            'users' => $regularUsers,
            'roles' => $roles,
            'permissions' => $permissions,
            'stats' => $stats,
        ]);
    }

    // User Management Methods
    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|exists:roles,name',
        ]);

        // Prevent creating admin users through admin panel
        if ($request->role === 'admin') {
            return redirect()->back()->with('error', 'Cannot create admin users through the admin panel. Admin users should use the profile settings.');
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);

        $user->assignRole($request->role);

        return redirect()->back()->with('success', 'User created successfully.');
    }

    public function updateUser(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => 'required|string|exists:roles,name',
        ]);

        // Prevent changing users to admin role through admin panel
        if ($request->role === 'admin') {
            return redirect()->back()->with('error', 'Cannot assign admin role through the admin panel. Admin users should use the profile settings.');
        }

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        // Sync roles (remove old, add new)
        $user->syncRoles([$request->role]);

        return redirect()->back()->with('success', 'User updated successfully.');
    }

    public function deleteUser(User $user)
    {
        // Prevent deleting admin users through admin panel
        if ($user->hasRole('admin')) {
            return redirect()->back()->with('error', 'Cannot delete admin users through the admin panel. Admin users should use the profile settings.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully.');
    }

    // Role Management Methods
    public function storeRole(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = Role::create(['name' => $request->name]);

        if ($request->permissions) {
            $role->syncPermissions($request->permissions);
        }

        return redirect()->back()->with('success', 'Role created successfully.');
    }

    public function updateRole(Request $request, Role $role)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role->update(['name' => $request->name]);

        if ($request->permissions !== null) {
            $role->syncPermissions($request->permissions);
        }

        return redirect()->back()->with('success', 'Role updated successfully.');
    }

    public function deleteRole(Role $role)
    {
        // Prevent deleting system roles
        if (in_array($role->name, ['admin', 'user'])) {
            return redirect()->back()->with('error', 'Cannot delete system roles.');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete role with assigned users.');
        }

        $role->delete();

        return redirect()->back()->with('success', 'Role deleted successfully.');
    }

    // Get data for forms
    public function getUserData(User $user)
    {
        return response()->json([
            'user' => $user->load('roles'),
            'roles' => Role::all(),
        ]);
    }

    public function getRoleData(Role $role)
    {
        return response()->json([
            'role' => $role->load('permissions'),
            'permissions' => Permission::all(),
        ]);
    }
}
