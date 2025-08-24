# Laravel Spatie Permission System Implementation

This document explains how to use the role-based permission system implemented in CurlX using Laravel Spatie Permission package.

## Overview

The system implements a comprehensive role-based access control (RBAC) system that allows you to:
- Define roles (admin, user, etc.)
- Assign permissions to roles
- Control menu visibility based on user permissions
- Protect routes with middleware
- Conditionally render UI components

## System Architecture

### 1. Database Structure
- **permissions** table: Stores individual permissions
- **roles** table: Stores user roles
- **model_has_roles** table: Links users to roles
- **model_has_permissions** table: Links users to permissions
- **role_has_permissions** table: Links roles to permissions

### 2. User Model
The `User` model uses the `HasRoles` trait from Spatie, providing methods like:
- `hasRole('admin')`
- `hasPermissionTo('manage_users')`
- `assignRole('admin')`
- `givePermissionTo('view_dashboard')`

### 3. Middleware
- **AdminMiddleware**: Protects admin-only routes
- **HandleInertiaRequests**: Shares user roles and permissions with frontend

## Default Roles and Permissions

### Admin Role
- **Permissions**: All permissions
- **Access**: Full system access including admin panels
- **Menu Items**: All menu items visible

### User Role
- **Permissions**: Basic user permissions
- **Access**: Limited to core functionality
- **Menu Items**: Basic menu items only

## Implementation Details

### 1. Backend (Laravel)

#### Database Seeder
```php
// database/seeders/DatabaseSeeder.php
// Creates default roles and permissions
// Assigns admin role to admin@curlx.com
// Creates regular user with user role
```

#### Middleware Registration
```php
// bootstrap/app.php
$middleware->alias([
    'admin' => AdminMiddleware::class,
]);
```

#### Route Protection
```php
// routes/web.php
Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Admin/Index');
    })->name('index');
});
```

### 2. Frontend (React/TypeScript)

#### Permission Hook
```typescript
// resources/js/hooks/use-permissions.tsx
const { hasRole, hasPermission, hasAnyRole, hasAnyPermission } = usePermissions();

// Usage examples:
if (hasRole('admin')) { /* admin logic */ }
if (hasPermission('manage_users')) { /* user management logic */ }
```

#### Permission Gate Component
```typescript
// resources/js/components/permission-gate.tsx
<PermissionGate permission="manage_users" role="admin">
    <AdminPanel />
</PermissionGate>
```

#### Menu Filtering
```typescript
// resources/js/components/app-sidebar.tsx
const filteredMainNavItems = mainNavItems.filter(item => {
    if (item.permission && !hasPermission(item.permission)) {
        return false;
    }
    if (item.role && !hasRole(item.role)) {
        return false;
    }
    return true;
});
```

## Usage Examples

### 1. Checking Permissions in Controllers
```php
public function index()
{
    if (!auth()->user()->hasPermissionTo('view_dashboard')) {
        abort(403, 'Access denied');
    }
    
    // Controller logic here
}
```

### 2. Blade Templates (if using)
```php
@can('manage_users')
    <a href="/admin/users">User Management</a>
@endcan

@role('admin')
    <div class="admin-panel">Admin content</div>
@endrole
```

### 3. Frontend Components
```typescript
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent() {
    const { hasPermission } = usePermissions();
    
    return (
        <div>
            {hasPermission('manage_users') && (
                <button>Manage Users</button>
            )}
        </div>
    );
}
```

### 4. Route Protection
```php
// Protect entire route groups
Route::middleware(['admin'])->group(function () {
    // Admin-only routes
});

// Protect individual routes
Route::get('/admin/users', [UserController::class, 'index'])
    ->middleware(['admin']);
```

## Adding New Permissions

### 1. Create Permission
```php
use Spatie\Permission\Models\Permission;

Permission::create(['name' => 'new_permission']);
```

### 2. Assign to Role
```php
$role = Role::findByName('admin');
$role->givePermissionTo('new_permission');
```

### 3. Update Frontend
```typescript
// Add to NavItem interface
{
    title: 'New Feature',
    href: '/new-feature',
    permission: 'new_permission'
}
```

## Adding New Roles

### 1. Create Role
```php
use Spatie\Permission\Models\Role;

$newRole = Role::create(['name' => 'moderator']);
```

### 2. Assign Permissions
```php
$newRole->givePermissionTo([
    'view_dashboard',
    'view_domain_checker',
    'moderate_content'
]);
```

### 3. Assign to User
```php
$user->assignRole('moderator');
```

## Testing

### 1. Run Tests
```bash
php artisan test tests/Feature/PermissionTest.php
```

### 2. Manual Testing
- Login as admin@curlx.com / 123 (full access)
- Login as user@curlx.com / 123 (limited access)
- Verify menu items are filtered correctly
- Test admin route access at `/admin`
- Verify both User Management and Role Management tabs are accessible to admin users

## Security Considerations

1. **Always verify permissions on the backend** - Frontend filtering is for UX only
2. **Use middleware** for route protection
3. **Validate permissions** in controllers before performing actions
4. **Cache permissions** for performance (Spatie handles this automatically)
5. **Regular audits** of role assignments and permissions

## Troubleshooting

### Common Issues

1. **Permissions not working**: Check if user has correct role assigned
2. **Menu items not filtering**: Verify permission names match exactly
3. **Middleware errors**: Ensure AdminMiddleware is registered in bootstrap/app.php
4. **Database errors**: Run migrations and seeders

### Debug Commands
```bash
# Check user roles and permissions
php artisan tinker
$user = User::find(1);
$user->getRoleNames();
$user->getAllPermissions()->pluck('name');

# Clear permission cache
php artisan permission:cache-reset
```

## Best Practices

1. **Use descriptive permission names** (e.g., 'manage_users' not 'mu')
2. **Group related permissions** logically
3. **Limit role proliferation** - prefer permissions over roles for fine-grained control
4. **Document permission requirements** for each feature
5. **Regular permission audits** to remove unused permissions
6. **Use permission gates** in components for consistent access control

## Migration and Deployment

1. **Backup database** before running migrations
2. **Test permissions** in staging environment
3. **Update existing users** with appropriate roles
4. **Verify admin access** after deployment
5. **Monitor logs** for permission-related errors

---

This permission system provides a robust foundation for access control in CurlX. For additional features or customizations, refer to the [Spatie Laravel Permission documentation](https://spatie.be/docs/laravel-permission).
