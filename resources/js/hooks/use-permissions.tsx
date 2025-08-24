import { usePage } from '@inertiajs/react';
import { type User, type PermissionHelpers } from '@/types';

export function usePermissions(): PermissionHelpers {
    const { auth } = usePage().props;
    const user = auth.user as User | null;

    const hasRole = (role: string): boolean => {
        if (!user) return false;
        return user.roles.includes(role);
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        return user.permissions.includes(permission);
    };

    const hasAnyRole = (roles: string[]): boolean => {
        if (!user) return false;
        return roles.some(role => user.roles.includes(role));
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!user) return false;
        return permissions.some(permission => user.permissions.includes(permission));
    };

    return {
        hasRole,
        hasPermission,
        hasAnyRole,
        hasAnyPermission,
    };
}
