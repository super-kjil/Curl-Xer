import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Pagination, 
    PaginationContent, 
    PaginationEllipsis, 
    PaginationItem, 
    PaginationLink, 
    PaginationNext, 
    PaginationPrevious 
} from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    User, 
    Globe, 
    Monitor, 
    Clock, 
    ShieldCheck,
    LogOut,
    LogIn,
    UserPlus,
    Lock,
    KeyRound,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Plus,
    Trash2,
    Eraser
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Activity {
    id: number;
    log_name: string;
    description: string;
    event: string;
    causer?: {
        id: number;
        name: string;
        email: string;
    };
    properties: {
        device?: {
            ip: string;
            user_agent: string;
        };
        email?: string;
        [key: string]: any;
    };
    created_at: string;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface ActivitiesPaginated {
    data: Activity[];
    links: PaginationLinks[];
    current_page: number;
    last_page: number;
    total: number;
}

interface ActivityLogProps {
    activities: ActivitiesPaginated;
    filters: {
        sort: string;
        direction: 'asc' | 'desc';
    };
    can: {
        delete: boolean;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Activity Logs',
        href: '/activity-logs',
    },
];

const getEventIcon = (event: string) => {
    switch (event?.toLowerCase()) {
        case 'login': return <LogIn className="h-4 w-4 text-green-500" />;
        case 'logout': return <LogOut className="h-4 w-4 text-gray-500" />;
        case 'failed': return <ShieldCheck className="h-4 w-4 text-destructive" />;
        case 'lockout': return <Lock className="h-4 w-4 text-destructive" />;
        case 'registered': return <UserPlus className="h-4 w-4 text-primary" />;
        case 'passwordreset': return <KeyRound className="h-4 w-4 text-purple-500" />;
        default: return <Plus className="h-4 w-4 text-blue-500" />;
    }
};

export default function ActivityLog({ activities, filters, can }: ActivityLogProps) {
    const handleSort = (column: string) => {
        const direction = filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(route('admin.activity-logs.index'), { sort: column, direction }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id: number) => {
        router.delete(route('admin.activity-logs.destroy', id), {
            onSuccess: () => toast.success('Activity log deleted'),
        });
    };

    const handleClearAll = () => {
        router.delete(route('admin.activity-logs.clear'), {
            onSuccess: () => toast.success('All activity logs cleared'),
        });
    };

    const getSortIcon = (column: string) => {
        if (filters.sort !== column) return <ArrowUpDown className="h-3 w-3 ml-1" />;
        return filters.direction === 'asc' 
            ? <ArrowUp className="h-3 w-3 ml-1 text-primary" /> 
            : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />

            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Activity Logs</h1>
                        <div className="text-xs text-muted-foreground mt-1">
                            Total Records: {activities.total}
                        </div>
                    </div>
                    
                    {can.delete && activities.total > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Eraser className="mr-2" />
                                    Clear All
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Clear all logs?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. All activity records will be permanently removed from the database.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                                        Clear All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>

                <div className="p-6">
                    <div className="border border-border rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-b border-border hover:bg-transparent">
                                    <TableHead className="w-[150px] text-xs font-semibold uppercase tracking-wider">Event</TableHead>
                                    <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider">User / Target</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Description</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Device Info</TableHead>
                                    <TableHead 
                                        className="text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center">
                                            Timestamp
                                            {getSortIcon('created_at')}
                                        </div>
                                    </TableHead>
                                    {can.delete && <TableHead className="w-[50px]"></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activities.data.length > 0 ? (
                                    activities.data.map((activity) => (
                                        <TableRow key={activity.id} className="border-b border-border hover:bg-muted/30 transition-colors group">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getEventIcon(activity.event)}
                                                    <Badge variant="secondary" className="capitalize font-medium text-[10px] px-2 py-0">
                                                        {activity.event || activity.log_name}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 text-sm font-medium">
                                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {activity.causer?.name || 'System'}
                                                    </div>
                                                    {activity.properties.email && (
                                                        <span className="text-[11px] text-muted-foreground ml-5">{activity.properties.email}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {activity.description}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Globe className="h-3.5 w-3.5" />
                                                        {activity.properties.device?.ip || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 truncate max-w-[180px]">
                                                        <Monitor className="h-3.5 w-3.5 shrink-0" />
                                                        <span title={activity.properties.device?.user_agent}>
                                                            {activity.properties.device?.user_agent || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm py-4">
                                                <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {format(new Date(activity.created_at), 'dd-MM-yy, h:mm a')}
                                                </div>
                                            </TableCell>
                                            {can.delete && (
                                                <TableCell>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete this log?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This activity record will be permanently deleted.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(activity.id)} className="bg-destructive hover:bg-destructive/90">
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={can.delete ? 6 : 5} className="h-32 text-center text-muted-foreground">
                                            No activity logs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-6">
                        <Pagination>
                            <PaginationContent>
                                {activities.links.map((link, i) => {
                                    const isPrevious = link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');
                                    const isEllipsis = link.label === '...';

                                    if (isPrevious) {
                                        return (
                                            <PaginationItem key={i}>
                                                <PaginationPrevious 
                                                    href={link.url || '#'} 
                                                    className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>
                                        );
                                    }

                                    if (isNext) {
                                        return (
                                            <PaginationItem key={i}>
                                                <PaginationNext 
                                                    href={link.url || '#'} 
                                                    className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>
                                        );
                                    }

                                    if (isEllipsis) {
                                        return (
                                            <PaginationItem key={i}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }

                                    return (
                                        <PaginationItem key={i}>
                                            <PaginationLink 
                                                href={link.url || '#'} 
                                                isActive={link.active}
                                            >
                                                {link.label}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
