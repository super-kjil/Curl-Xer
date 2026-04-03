export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
    roles?: Role[];
    permissions?: Permission[];
    avatar?: string;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    permissions?: Permission[];
    users?: User[];
}

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
}

export interface BreadcrumbItem {
    title: string;
    href?: string;
}

export interface NavItem {
    title: string;
    href: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any;
    isExternal?: boolean;
    permission?: string;
    role?: string;
    badge?: React.ReactNode;
}

export interface SharedData {
    user: User | null;
    flash: {
        success?: string;
        error?: string;
    };
    errors: Record<string, string[]>;
    app_timezone?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface PageProps {
    auth: {
        user: User | null;
        status?: string;
    };
    name?: string;
    sidebarOpen?: boolean;
    app_timezone?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface PermissionHelpers {
    can: (permission: string) => boolean;
    cannot: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
}

export interface GroupedHistoryItem {
    command: string;
    totalUrls: number;
    avgSuccessRate: number;
    latestTimestamp: string;
    batches: BatchItem[];
    primaryDns: string;
    secondaryDns: string;
}

export interface BatchItem {
    id: string;
    command: string;
    urlCount: number;
    results?: DomainCheckResult[];
    timestamp: string;
    successRate: number;
    primaryDns: string;
    secondaryDns: string;
}

export interface DomainCheckResult {
    id: number;
    domain: string;
    accessible: boolean;
    status_code?: number;
    error_message?: string;
    created_at: string;
    updated_at: string;
}
