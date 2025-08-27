import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Chart } from '@/components/ui/chart';
import { MultiChart } from '@/components/ui/multi-chart';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    Globe,
    CheckCircle,
    Activity,
    RefreshCw
} from 'lucide-react';
import { useDashboardCache } from '@/hooks/use-dashboard-cache';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const {
        chartData,
        stats,
        loading,
        error,
        loadChartData,
        refreshDashboard,
        successRateData,
        checksData,
        cacheInfo
    } = useDashboardCache();

    const [filter, setFilter] = useState('7days');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        if (newFilter !== 'custom') {
            setStartDate(undefined);
            setEndDate(undefined);
            // Load data for new filter
            loadChartData(newFilter);
        }
    };

    const handleDateChange = () => {
        if (startDate && endDate) {
            loadChartData('custom', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'));
        }
    };

    const getFilterLabel = (filterValue: string) => {
        switch (filterValue) {
            case '7days': return 'Last 7 Days';
            case '1month': return 'Last Month';
            case '3months': return 'Last 3 Months';
            case 'custom': return 'Custom Range';
            default: return 'Last 7 Days';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header with filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Monitor your domain checking activity and performance
                        </p>
                        {/* {cacheInfo.isCacheValid && cacheInfo.cacheAge && (
                            <Badge variant="outline" className="mt-2 text-xs">
                                Cache: {Math.round(cacheInfo.cacheAge / 1000)}s ago
                            </Badge>
                        )} */}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                            variant="outline"
                            onClick={refreshDashboard}
                            disabled={loading}
                            title="Refresh dashboard data"
                        >
                            <RefreshCw className={`mr-2 h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        <Select value={filter} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Select filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7days">Last 7 Days</SelectItem>
                                <SelectItem value="1month">Last Month</SelectItem>
                                <SelectItem value="3months">Last 3 Months</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>

                        {filter === 'custom' && (
                            <div className="flex gap-2">
                                <DatePicker
                                    date={startDate}
                                    onDateChange={setStartDate}
                                    placeholder="Start date"
                                    className="w-[200px]"

                                />
                                <DatePicker
                                    date={endDate}
                                    onDateChange={setEndDate}
                                    placeholder="End date"
                                    className="w-[200px]"
                                />
                                <Button
                                    variant="outline"
                                    onClick={handleDateChange}
                                    disabled={!startDate || !endDate}
                                    // size="sm"
                                >
                                    Apply
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <div className="flex items-center">
                            <CheckCircle className="mr-2 h-6 w-6 text-red-500" />
                            <p className="text-sm text-red-700 dark:text-red-300">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-md font-medium">Total Checks</CardTitle>
                            <Activity className="h-6 w-6 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_checks}</div>
                            <p className="text-sm text-muted-foreground">
                                Domain checks performed
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-md font-medium">Success Rate</CardTitle>
                            <TrendingUp className="h-6 w-6 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.avg_success_rate}%</div>
                            <p className="text-sm text-muted-foreground">
                                Average success rate
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-md font-medium">Total Domains</CardTitle>
                            <Globe className="h-6 w-6 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_urls}</div>
                            <p className="text-sm text-muted-foreground">
                                Domain checked
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>URL Success vs Failed</CardTitle>
                        <CardDescription>
                            Success and failed domains checked per day
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex h-[300px] items-center justify-center">
                                <div className="text-muted-foreground">Loading...</div>
                            </div>
                        ) : chartData.length > 0 ? (
                            <MultiChart
                                data={chartData}
                                height={300}
                            />
                        ) : (
                            <div className="flex h-[300px] items-center justify-center">
                                <div className="text-muted-foreground">No data available</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Charts */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="md:col-span-2 ">
                        <CardHeader>
                            <CardTitle>Success Rate Trend</CardTitle>
                            <CardDescription>
                                Domain check success rate over {getFilterLabel(filter).toLowerCase()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex h-[300px] items-center justify-center">
                                    <div className="text-muted-foreground">Loading...</div>
                                </div>
                            ) : successRateData.length > 0 ? (
                                <Chart
                                    data={successRateData}
                                    height={300}
                                    fill="#3B82F6"
                                    stroke="#3B82F6"
                                />
                            ) : (
                                <div className="flex h-[300px] items-center justify-center">
                                    <div className="text-muted-foreground">No data available</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Checks</CardTitle>
                            <CardDescription>
                                Number of checks performed per day
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex h-[300px] items-center justify-center">
                                    <div className="text-muted-foreground">Loading...</div>
                                </div>
                            ) : checksData.length > 0 ? (
                                <Chart
                                    data={checksData}
                                    height={300}
                                    fill="#F59E0B"
                                    stroke="#F59E0B"
                                />
                            ) : (
                                <div className="flex h-[300px] items-center justify-center">
                                    <div className="text-muted-foreground">No data available</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
