import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGateProps {
    children: ReactNode;
    permission?: string;
    role?: string;
    fallback?: ReactNode;
}

export function PermissionGate({ children, permission, role, fallback = null }: PermissionGateProps) {
    const { hasPermission, hasRole } = usePermissions();

    // Check if user has the required permission
    if (permission && !hasPermission(permission)) {
        return <>{fallback}</>;
    }

    // Check if user has the required role
    if (role && !hasRole(role)) {
        return <>{fallback}</>;
    }

    // If no permission or role required, or user has them, render children
    return <>{children}</>;
}
