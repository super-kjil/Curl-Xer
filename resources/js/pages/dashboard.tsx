import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { format, subDays, subMonths } from 'date-fns';
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
    Calendar,
    BarChart3,
    Activity
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface ChartData {
    name: string;
    success_rate: number;
    url_count: number;
    success_urls: number;
    failed_urls: number;
    checks: number;
}

interface DashboardStats {
    total_checks: number;
    avg_success_rate: number;
    total_urls: number;
}

export default function Dashboard() {
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        total_checks: 0,
        avg_success_rate: 0,
        total_urls: 0,
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('7days');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    useEffect(() => {
        loadChartData();
    }, [filter, startDate, endDate]);

    const loadChartData = async () => {
        try {
            setLoading(true);
            const params: any = { filter };
            
            if (filter === 'custom' && startDate && endDate) {
                params.start_date = format(startDate, 'yyyy-MM-dd');
                params.end_date = format(endDate, 'yyyy-MM-dd');
            }

            const response = await axios.get('/domain-checker/history/chart-data', { params });
            
            if (response.data.success) {
                setChartData(response.data.data);
                setStats({
                    total_checks: response.data.total_checks,
                    avg_success_rate: response.data.avg_success_rate,
                    total_urls: response.data.total_urls,
                });
            }
        } catch (error) {
            console.error('Failed to load chart data:', error);
            toast.error('Failed to load chart data');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        if (newFilter !== 'custom') {
            setStartDate(undefined);
            setEndDate(undefined);
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

    const successRateData = chartData.map(item => ({
        name: item.name,
        value: item.success_rate,
    }));

    const urlCountData = chartData.map(item => ({
        name: item.name,
        value: item.url_count,
    }));

    const checksData = chartData.map(item => ({
        name: item.name,
        value: item.checks,
    }));

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
                    </div>
                    
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Select value={filter} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-[180px]">
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
                                    className="w-[140px]"
                                />
                                <DatePicker
                                    date={endDate}
                                    onDateChange={setEndDate}
                                    placeholder="End date"
                                    className="w-[140px]"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_checks}</div>
                            <p className="text-xs text-muted-foreground">
                                Domain checks performed
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.avg_success_rate}%</div>
                            <p className="text-xs text-muted-foreground">
                                Average success rate
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_urls}</div>
                            <p className="text-xs text-muted-foreground">
                                URLs checked
                            </p>
                        </CardContent>
                    </Card>
                </div>
                                    <Card>
                        <CardHeader>
                            <CardTitle>URL Success vs Failed</CardTitle>
                            <CardDescription>
                                Success and failed URLs checked per day
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
