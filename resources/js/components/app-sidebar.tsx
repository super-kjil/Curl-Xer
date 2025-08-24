import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, Globe, History, LayoutGrid, Link2, Settings, Users, Shield } from 'lucide-react';
import AppLogo from './app-logo';
import { usePermissions } from '@/hooks/use-permissions';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        permission: 'view_dashboard',
    },
    {
        title: 'Domain Generator',
        href: '/domain-generator',
        icon: Link2,
        permission: 'view_domain_generator',
    },
    {
        title: 'Domain Checker',
        href: '/domain-checker',
        icon: Globe,
        permission: 'view_domain_checker',
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
    {
        title: 'Admin Panel',
        href: '/admin',
        icon: Shield,
        permission: 'manage_users',
        role: 'admin',
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
