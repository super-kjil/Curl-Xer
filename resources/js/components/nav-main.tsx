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
                    <SidebarMenuButton asChild>
                        <Link href={item.href} prefetch className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                                <item.icon className="mr-2 h-4 w-4" />
                                <span>{item.title}</span>
                            </div>

                            {/* Badge support */}
                            {item.badge && (
                                <SidebarMenuBadge>
                                    {item.badge}
                                </SidebarMenuBadge>
                            )}
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}