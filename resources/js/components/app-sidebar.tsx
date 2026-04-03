import React from 'react';
import { Link } from '@inertiajs/react';
import { type NavItem } from '@/types';
import { 
    Home, 
    Globe, 
    History, 
    Settings, 
    Shield,
    Sparkle,
    ScanText,
    Folders,
    GitCompare
} from 'lucide-react';
import AppLogo from './app-logo';
import { usePermissions } from '@/hooks/use-permissions';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { 
    Sidebar, 
    SidebarContent, 
    SidebarFooter, 
    SidebarHeader, 
    SidebarMenu, 
    SidebarMenuButton, 
    SidebarMenuItem 
} from '@/components/ui/sidebar';
import { Badge } from './ui/badge';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        permission: 'view_dashboard',
    },
    {
        title: 'Domain Extractor',
        href: '/domain-extractor',
        icon: ScanText,
        permission: 'view_domain_extractor'
    },
    {
        title: 'Domain Generator',
        href: '/domain-generator',
        icon: Sparkle,
        permission: 'view_domain_generator',
        
    },
    {
        title: 'Block List',
        href: '/domain-list',
        icon: Folders,
        permission: 'view_domain_list',
        // badge: <Badge variant="secondary" className=" text-green-600">New</Badge>,   // ← Added
    },
    
    {
        title: 'Domain Checker',
        href: '/domain-checker',
        icon: Globe,
        permission: 'view_domain_checker',
    },
    {
        title: 'Domain Comparer',
        href: '/domain-comparer',
        icon: GitCompare,
        permission: 'view_domain_comparer',
        badge: <Badge variant="secondary" className=" text-green-600">New</Badge>,   // ← Added

    },
    {
        title: 'Domain History',
        href: '/domain-history/history',
        icon: History,
        permission: 'view_domain_history',
    },
    {
        title: 'DNS Setting',
        href: '/domain-checker/settings',
        icon: Settings,
        permission: 'view_dns_settings',
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Admin Panel',
        href: '/admin',
        icon: Shield,
        permission: 'manage_users',
        role: 'admin',
    },
];

export function AppSidebar() {
    const { hasPermission, hasRole } = usePermissions();
    
    // Filter menu items based on user permissions and roles
    const filteredMainNavItems = mainNavItems.filter(item => {
        if (item.permission && !hasPermission(item.permission)) {
            return false;
        }
        if (item.role && !hasRole(item.role)) {
            return false;
        }
        return true;
    });

    const filteredFooterNavItems = footerNavItems.filter(item => {
        if (item.permission && !hasPermission(item.permission)) {
            return false;
        }
        if (item.role && !hasRole(item.role)) {
            return false;
        }
        return true;
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredMainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={filteredFooterNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}