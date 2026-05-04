import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, DomainLink } from '@/types';
import { Head } from '@inertiajs/react';
import { PermissionGate } from '@/components/permission-gate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AxGuard from '@public/AxGuard.png';

interface DomainListProps {
    domainLinks: DomainLink[];
}

export default function DomainList({ domainLinks = [] }: DomainListProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Domain List',
            href: '/domain-list',
        },
    ];



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Domain List" />
            <PermissionGate
                permission="view_domain_list"
                fallback={
                    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                        <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                                You don't have permission to access the Domain List. Please contact your administrator if you believe this is an error.
                            </AlertDescription>
                        </Alert>
                    </div>
                }
            >
                <div className="flex-1 space-y-4 p-8 md:p-8 pt-4">
                    <div className="flex items-center justify-between space-y-2">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Domain List</h1>
                            <p className="text-muted-foreground">
                                Access external monitoring dashboards and DNS management tools
                            </p>
                        </div>
                    </div>

                    {domainLinks && domainLinks.length > 0 ? (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                            {domainLinks.map((link) => (
                                <Card key={link.id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                                {/* <img
                                                    className='w-10'
                                                    src={AxGuard}
                                                    alt="Dashboard"
                                                /> */}
                                            <div className='text-2xl font-bold'>
                                                {link.title}
                                            </div>
                                            {link.badge && <Badge className='text-lg'>{link.badge}</Badge>}
                                        </CardTitle>
                                        <CardDescription>
                                            {link.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button asChild className="w-full">
                                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                Open {link.title}
                                            </a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-[40vh] items-center justify-center rounded-lg border border-dashed p-8 text-center">
                            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center space-y-3">
                                <Shield className="h-10 w-10 text-muted-foreground" />
                                <h3 className="text-xl font-semibold">No Links Available</h3>
                                <p className="text-sm text-muted-foreground">
                                    There are currently no domain links configured. 
                                    An administrator must add them from the Admin Panel.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </PermissionGate>
        </AppLayout>
    );
}