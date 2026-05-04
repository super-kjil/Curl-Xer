<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\DomainLink;
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
        $domainLinks = DomainLink::all();

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
            'domainLinks' => $domainLinks,
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
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|string|exists:roles,name',
        ]);

        // Prevent changing users to admin role through admin panel
        if ($request->role === 'admin') {
            return redirect()->back()->with('error', 'Cannot assign admin role through the admin panel. Admin users should use the profile settings.');
        }

        $userData = [
            'name' => $request->name,
            'email' => $request->email,
        ];

        // Only update password if provided and the acting user is an admin
        if ($request->filled('password') && $request->user()->hasRole('admin')) {
            $userData['password'] = bcrypt($request->password);
        }

        $user->update($userData);

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

    public function storageStatus()
    {
        $path = base_path();
        $totalSpace = disk_total_space($path);
        $freeSpace = disk_free_space($path);
        $usedSpace = $totalSpace - $freeSpace;
        
        // Calculate App size (base_path without storage/logs)
        // Note: This is an estimation to avoid slow recursive directory sizing
        $appSize = 0; // Fallback
        
        // Database Size Estimation
        $dbSize = 0;
        try {
            $dbName = config('database.connections.mysql.database');
            $results = \Illuminate\Support\Facades\DB::select("
                SELECT SUM(data_length + index_length) as size 
                FROM information_schema.TABLES 
                WHERE table_schema = ?", [$dbName]);
            $dbSize = $results[0]->size ?? 0;
        } catch (\Exception $e) {
            // Fallback if not MySQL or permission denied
        }

        // Storage/Logs size estimation
        $storagePath = storage_path();
        $logsSize = 0;
        try {
            // Robust recursive directory size calculation
            $getDirSize = function($dir) use (&$getDirSize) {
                $size = 0;
                foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS)) as $file) {
                    $size += $file->getSize();
                }
                return $size;
            };

            if (is_dir($storagePath)) {
                $logsSize = $getDirSize($storagePath);
            }
        } catch (\Exception $e) {
            $logsSize = 0;
        }

        // Application size (everything else used)
        $appSize = max(0, $usedSpace - $dbSize - $logsSize);

        $percentageUsed = $totalSpace > 0 ? ($usedSpace / $totalSpace) * 100 : 0;

        $formatBytes = function ($bytes, $precision = 2) {
            if ($bytes <= 0) return '0 B';
            $units = ['B', 'KB', 'MB', 'GB', 'TB'];
            $pow = floor(log($bytes) / log(1024));
            $pow = min($pow, count($units) - 1);
            $bytes /= pow(1024, $pow);
            return round($bytes, $precision) . ' ' . $units[$pow];
        };

        return Inertia::render('Admin/StorageStatus', [
            'storage' => [
                'total' => $formatBytes($totalSpace),
                'free' => $formatBytes($freeSpace),
                'used' => $formatBytes($usedSpace),
                'percentage' => round($percentageUsed, 1),
                'breakdown' => [
                    'app' => [
                        'label' => 'Application Files',
                        'size' => $formatBytes($appSize),
                        'percentage' => $usedSpace > 0 ? ($appSize / $totalSpace) * 100 : 0,
                        'color' => '#4285F4', // Google Blue
                    ],
                    'database' => [
                        'label' => 'Database',
                        'size' => $formatBytes($dbSize),
                        'percentage' => $usedSpace > 0 ? ($dbSize / $totalSpace) * 100 : 0,
                        'color' => '#FBBC04', // Google Yellow
                    ],
                    'logs' => [
                        'label' => 'Storage & Logs',
                        'size' => $formatBytes($logsSize),
                        'percentage' => $usedSpace > 0 ? ($logsSize / $totalSpace) * 100 : 0,
                        'color' => '#EA4335', // Google Red
                    ],
                ],
                'raw' => [
                    'total' => $totalSpace,
                    'free' => $freeSpace,
                    'used' => $usedSpace,
                ]
            ]
        ]);
    }
}
