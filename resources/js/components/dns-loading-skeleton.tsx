import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';

export function DNSLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-8 shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-8 w-64 bg-white/20" />
                            <Skeleton className="h-4 w-80 mt-2 bg-white/20" />
                        </div>
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-8 w-8 bg-white/20" />
                            <Skeleton className="h-8 w-8 bg-white/20" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Server className="mr-2 h-5 w-5" />
                                DNS Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Auto Detect DNS Skeleton */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-10 w-24" />
                                </div>

                                {/* Primary DNS Skeleton */}
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-full" />
                                </div>

                                {/* Secondary DNS Skeleton */}
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>

                                {/* Custom DNS Servers Skeleton */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-12" />
                                    </div>
                                    <Skeleton className="h-10 w-full" />
                                </div>

                                <div className="border-t pt-6">
                                    <Skeleton className="h-6 w-40 mb-4" />
                                    
                                    {/* Performance Settings Skeleton */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-3 w-56" />
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button Skeleton */}
                                <div className="flex justify-end pt-4">
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 