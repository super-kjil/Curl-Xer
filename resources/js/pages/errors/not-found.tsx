import React from 'react';
import { Head } from '@inertiajs/react';
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from '@inertiajs/react';

interface NotFoundProps {
    message: string;
    status: number;
}

export default function NotFound({ message, status }: NotFoundProps) {
    const goBack = () => {
        router.visit('/dashboard');
    };

    return (
        <>
            <Head title="Page Not Found" />
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Page Not Found</CardTitle>
                        <CardDescription>
                            Error {status} - The page you are looking for could not be found
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="mb-6 text-muted-foreground">{message}</p>
                        <Button onClick={goBack} className="w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
