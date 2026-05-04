import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HardDrive, Info, ChevronDown, Filter, Calendar } from 'lucide-react';

interface BreakdownItem {
    label: string;
    size: string;
    percentage: number;
    color: string;
}

interface StorageData {
    total: string;
    free: string;
    used: string;
    percentage: number;
    breakdown: {
        app: BreakdownItem;
        database: BreakdownItem;
        logs: BreakdownItem;
    };
    raw: {
        total: number;
        free: number;
        used: number;
    };
}

interface StorageStatusProps {
    storage: StorageData;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Storage',
        href: '/storage',
    },
];

export default function StorageStatus({ storage }: StorageStatusProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Storage Status" />

            <div className="min-h-screen bg-white dark:bg-[#131314]">
                {/* Google Drive Style Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-[#3c4043]">
                    <h1 className="text-2xl font-normal text-[#1f1f1f] dark:text-[#e3e3e3]">Storage</h1>
                </div>

                <div className="p-6 max-w-5xl">
                    {/* Filters Placeholder */}
                    {/* <div className="flex gap-2 mb-8">
                        <Button variant="outline" className="rounded-lg h-9 text-xs font-medium border-gray-300 dark:border-[#444746] dark:bg-transparent dark:text-[#c4c7c5]">
                            Type <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="rounded-lg h-9 text-xs font-medium border-gray-300 dark:border-[#444746] dark:bg-transparent dark:text-[#c4c7c5]">
                            Modified <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="rounded-lg h-9 text-xs font-medium border-gray-300 dark:border-[#444746] dark:bg-transparent dark:text-[#c4c7c5]">
                            Source <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </div> */}

                    {/* Main Usage Text */}
                    <div className="mb-4 flex items-baseline gap-2">
                        <span className="text-4xl font-normal text-[#1f1f1f] dark:text-[#e3e3e3]">{storage.used}</span>
                        <span className="text-sm text-[#444746] dark:text-[#c4c7c5]">of {storage.total} used</span>
                    </div>

                    {/* Segmented Progress Bar */}
                    <div className="w-full max-w-2xl h-2 bg-gray-100 dark:bg-[#3c4043] rounded-full overflow-hidden flex mb-6">
                        <div 
                            style={{ width: `${storage.breakdown.app.percentage}%`, backgroundColor: storage.breakdown.app.color }} 
                            className="h-full transition-all duration-500"
                        />
                        <div 
                            style={{ width: `${storage.breakdown.database.percentage}%`, backgroundColor: storage.breakdown.database.color }} 
                            className="h-full transition-all duration-500"
                        />
                        <div 
                            style={{ width: `${storage.breakdown.logs.percentage}%`, backgroundColor: storage.breakdown.logs.color }} 
                            className="h-full transition-all duration-500"
                        />
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-6 mb-8">
                        {Object.values(storage.breakdown).map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-[#444746] dark:text-[#c4c7c5]">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mb-12">
                        {/* <Button className="rounded-full px-6 bg-white border border-gray-300 text-[#0b57d0] hover:bg-blue-50 dark:bg-transparent dark:border-[#444746] dark:text-[#a8c7fa] dark:hover:bg-[#1a1c1e]">
                            <Info className="mr-2 h-4 w-4" /> Get more info
                        </Button> */}
                        {/* <Button variant="ghost" className="rounded-full px-6 text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-blue-50 dark:hover:bg-[#1a1c1e]">
                            Clean up space
                        </Button> */}
                    </div>

                    {/* Details List */}
                    <div className="border-t border-gray-200 dark:border-[#3c4043]">
                        <div className="grid grid-cols-12 px-2 py-3 text-sm font-medium text-[#444746] dark:text-[#c4c7c5] border-b border-gray-200 dark:border-[#3c4043]">
                            <div className="col-span-8 flex items-center gap-2">
                                Name <Filter className="h-3 w-3" />
                            </div>
                            <div className="col-span-4 text-right">Size</div>
                        </div>

                        {/* List Items */}
                        {Object.values(storage.breakdown).map((item, i) => (
                            <div key={i} className="grid grid-cols-12 px-2 py-4 text-sm text-[#1f1f1f] dark:text-[#e3e3e3] border-b border-gray-200 dark:border-[#3c4043] hover:bg-gray-50 dark:hover:bg-[#1e1f20] transition-colors cursor-default">
                                <div className="col-span-8 flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#3c4043]">
                                        <HardDrive className="h-4 w-4 text-gray-500 dark:text-[#c4c7c5]" />
                                    </div>
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                <div className="col-span-4 text-right flex items-center justify-end text-[#444746] dark:text-[#c4c7c5]">
                                    {item.size}
                                </div>
                            </div>
                        ))}
                        
                        <div className="grid grid-cols-12 px-2 py-4 text-sm text-[#1f1f1f] dark:text-[#e3e3e3] border-b border-gray-200 dark:border-[#3c4043] hover:bg-gray-50 dark:hover:bg-[#1e1f20] transition-colors cursor-default opacity-60">
                            <div className="col-span-8 flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#3c4043]">
                                    <Info className="h-4 w-4 text-gray-500 dark:text-[#c4c7c5]" />
                                </div>
                                <span className="font-medium text-gray-400">Available Free Space</span>
                            </div>
                            <div className="col-span-4 text-right flex items-center justify-end text-[#444746] dark:text-[#c4c7c5]">
                                {storage.free}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
