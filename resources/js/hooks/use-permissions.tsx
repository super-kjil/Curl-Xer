import { usePage } from '@inertiajs/react';
import { type User, type PermissionHelpers } from '@/types';

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
        // Accept either array of role objects or array of role names
        return (user.roles as Array<string | Record<string, string>>).some((r) => (typeof r === 'string' ? r === role : r?.name === role));
    };

    const hasPermission = (permission: string): boolean => {
        if (!user || !user.permissions) return false;
        // Accept either array of permission objects or array of permission names
        return (user.permissions as Array<string | Record<string, string>>).some((p) => (typeof p === 'string' ? p === permission : p?.name === permission));
    };

    const hasAnyRole = (roles: string[]): boolean => {
        if (!user || !user.roles) return false;
        const userRoles = user.roles as Array<string | Record<string, string>>;
        return roles.some(role => userRoles.some((r) => (typeof r === 'string' ? r === role : r?.name === role)));
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!user || !user.permissions) return false;
        const userPerms = user.permissions as Array<string | Record<string, string>>;
        return permissions.some(perm => userPerms.some((p) => (typeof p === 'string' ? p === perm : p?.name === perm)));
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
