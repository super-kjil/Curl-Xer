// components/nav-main.tsx
import { Link } from '@inertiajs/react';
import { type NavItem } from '@/types';
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuBadge,
} from '@/components/ui/sidebar';

export function NavMain({ items }: { items: NavItem[] }) {
    return (
        <SidebarMenu>
            {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                        <Link href={item.href} prefetch>
                            <item.icon />
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}