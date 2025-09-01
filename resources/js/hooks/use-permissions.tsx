import { usePage } from '@inertiajs/react';
import { type User, type PermissionHelpers, type Role, type Permission } from '@/types';

type PageProps = {
    auth: {
        user: User | null;
    };
};

export function usePermissions(): PermissionHelpers {
    const page = usePage<PageProps>();
    const user = page.props.auth.user;

    const hasRole = (role: string): boolean => {
        if (!user || !user.roles) return false;
        return user.roles.some((r: Role) => r.name === role);
    };

    const hasPermission = (permission: string): boolean => {
        if (!user || !user.permissions) return false;
        return user.permissions.some((p: Permission) => p.name === permission);
    };

    const hasAnyRole = (roles: string[]): boolean => {
        if (!user || !user.roles) return false;
        return roles.some(role => user.roles!.some((r: Role) => r.name === role));
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!user || !user.permissions) return false;
        return permissions.some(permission => user.permissions!.some((p: Permission) => p.name === permission));
    };

    const can = (permission: string): boolean => {
        return hasPermission(permission);
    };

    const cannot = (permission: string): boolean => {
        return !hasPermission(permission);
    };

    return {
        hasRole,
        hasPermission,
        hasAnyRole,
        hasAnyPermission,
        can,
        cannot
    };
}
