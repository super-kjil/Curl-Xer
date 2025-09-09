import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { PermissionGate } from '@/components/permission-gate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ExternalLink } from 'lucide-react';
import React from 'react'

function index() {
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
                <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                    <div className="flex items-center justify-between space-y-2">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Domain List</h1>
                            <p className="text-muted-foreground">
                                Access external domain dashboards and tools
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center grid gap-4 md:grid-cols-2 lg:grid-cols-2 p-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ExternalLink className="h-5 w-5" />
                                    Dashboard DNS-28
                                </CardTitle>
                                <CardDescription>
                                    Access the external dashboard on server 28
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full">
                                    <a href="http://87.247.167.28/trcwebsite" target="_blank" rel="noopener noreferrer">
                                        Open Dashboard 28
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ExternalLink className="h-5 w-5" />
                                    Dashboard DNS-29
                                </CardTitle>
                                <CardDescription>
                                    Access the external dashboard on server 29
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full">
                                    <a href="http://87.247.167.29/trcwebsite" target="_blank" rel="noopener noreferrer">
                                        Open Dashboard 29
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PermissionGate>
        </AppLayout>
    )
}

export default index