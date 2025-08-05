import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useDNSSettings } from '@/hooks/use-dns-settings';
import { 
    Globe, 
    Search, 
    History, 
    Settings, 
    Sun, 
    Moon, 
    Inbox,
    Edit, 
    BarChart3, 
    CheckCircle, 
    XCircle, 
    Loader2,
    Server
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Domain Checker',
        href: '/domain-checker',
    },
];

interface UrlResult {
    url: string;
    status: number;
    time: number;
    accessible: boolean;
    error?: string;
}

interface CheckResponse {
    success: boolean;
    check_id: string;
    results: UrlResult[];
    success_rate: number;
    total_urls: number;
    timestamp: string;
    processing_method?: string;
    estimated_time?: number;
}

export default function DomainCheckerIndex() {
    const [urls, setUrls] = useState('');
    const [command, setCommand] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [results, setResults] = useState<UrlResult[]>([]);
    const [successRate, setSuccessRate] = useState(0);
    const [totalUrls, setTotalUrls] = useState(0);
    const [checkId, setCheckId] = useState('');
    const [timestamp, setTimestamp] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [progress, setProgress] = useState(0);
    const [checkedUrls, setCheckedUrls] = useState(0);
    const [progressIntervalId, setProgressIntervalId] = useState<NodeJS.Timeout | null>(null);
    
    const { settings, loading: dnsLoading } = useDNSSettings();

    useEffect(() => {
        // Check for dark mode preference
        const darkMode = localStorage.getItem('darkMode') === 'true';
        setIsDarkMode(darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    // Cleanup effect for progress interval
    useEffect(() => {
        return () => {
            // Cleanup progress interval when component unmounts
            if (progressIntervalId) {
                clearInterval(progressIntervalId);
            }
        };
    }, [progressIntervalId]);

    const getCurrentDNSDisplay = () => {
        if (dnsLoading) return 'Loading DNS settings...';
        
        // Safety check for null settings
        if (!settings) return 'DNS settings not available';
        
        const primary = settings.primary_dns || 'Auto';
        const secondary = settings.secondary_dns || '0.0.0.0';
        return `Primary: ${primary}, Secondary: ${secondary}`;
    };

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode.toString());
        document.documentElement.classList.toggle('dark', newDarkMode);
    };

    const handleCheckUrls = async () => {
        if (!urls.trim()) {
            toast.error("URLs field is required", {
                description: "Please enter at least one URL to check",
            });
            return;
        }

        if (!command.trim()) {
            toast.error("Command field is required", {
                description: "Please enter a command identifier before checking URLs",
            });
            return;
        }

        setIsChecking(true);
        setResults([]);
        setProgress(0);
        setCheckedUrls(0);

        // Calculate total URLs to check
        const urlList = urls.trim().split('\n').filter(url => url.trim());
        const totalUrlsToCheck = urlList.length;
        setTotalUrls(totalUrlsToCheck);

        // Show different progress behavior for large URL sets
        const isLargeUrlSet = totalUrlsToCheck > 10000;
        
        if (isLargeUrlSet) {
            toast.info("Large URL set detected", {
                description: `Processing ${totalUrlsToCheck.toLocaleString()} URLs. This may take several minutes.`,
                duration: 5000
            });
        }

        // Simulate progress updates
        const intervalId = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev; // Don't go beyond 90% until complete
                return prev + Math.random() * 15 + 5; // Random increment between 5-20%
            });
            setCheckedUrls(prev => {
                const newChecked = Math.min(prev + Math.floor(Math.random() * 3) + 1, totalUrlsToCheck);
                return newChecked;
            });
        }, 500); // Update every 500ms
        
        setProgressIntervalId(intervalId);

        try {
            const response = await axios.post<CheckResponse>('/domain-checker/check-urls', {
                urls,
                primary_dns: settings?.primary_dns || '8.8.8.8',
                secondary_dns: settings?.secondary_dns || '1.1.1.1',
                command
            });

            // Clear the progress interval
            if (progressIntervalId) {
                clearInterval(progressIntervalId);
                setProgressIntervalId(null);
            }

            if (response.data.success) {
                setResults(response.data.results);
                setSuccessRate(response.data.success_rate);
                setTotalUrls(response.data.total_urls);
                setCheckId(response.data.check_id);
                setTimestamp(response.data.timestamp);
                setProgress(100);
                setCheckedUrls(response.data.total_urls);
                
                // Show different success messages based on processing method
                const processingMethod = response.data.processing_method;
                const estimatedTime = response.data.estimated_time;
                
                let description = `Checked ${response.data.total_urls.toLocaleString()} URLs with ${response.data.success_rate}% success rate`;
                
                if (processingMethod === 'optimized' && estimatedTime) {
                    const minutes = Math.round(estimatedTime / 60);
                    description += ` (Optimized processing, estimated ${minutes} minutes)`;
                }
                
                toast.success("URLs checked successfully", {
                    description: description,
                });
            }
        } catch (error: any) {
            // Clear the progress interval on error
            if (progressIntervalId) {
                clearInterval(progressIntervalId);
                setProgressIntervalId(null);
            }
            console.error('Error checking URLs:', error);
            toast.error("Failed to check URLs", {
                description: error.response?.data?.message || 'An unexpected error occurred',
            });
        } finally {
            setIsChecking(false);
        }
    };

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-green-600';
        if (status >= 300 && status < 400) return 'text-blue-600';
        if (status >= 400 && status < 500) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusText = (status: number) => {
        if (status >= 200 && status < 300) return 'Success';
        if (status >= 300 && status < 400) return 'Redirect';
        if (status >= 400 && status < 500) return 'Client Error';
        if (status >= 500) return 'Server Error';
        return 'Unknown';
    };

    const getUrlCount = () => {
        return urls.trim() ? urls.trim().split('\n').filter(url => url.trim()).length : 0;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Domain Checker" />
            
            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-8 shadow-lg">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold flex items-center">
                                    <Globe className="mr-3 h-8 w-8" /> DNS URL Checker
                                </h1>
                                <p className="mt-2 opacity-90">
                                    Check multiple URLs for accessibility and response times
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="hidden md:block">
                                    <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
                                        <Server className="mr-2 h-4 w-4" />
                                        <span className="font-mono text-sm">{getCurrentDNSDisplay()}</span>
                                    </Badge>
                                </div>

                                {/* <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={toggleDarkMode}
                                    title="Toggle Dark Mode"
                                >
                                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </Button> */}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Input Panel */}
                        <div className="lg:col-span-1">
                            <Card className=' dark:bg-gray-800'>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Edit className="mr-2 h-5 w-5" />
                                            Input Domains
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {getUrlCount()} URLs
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>

                                {/* URLs Input */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label htmlFor="urls">
                                            URLs (one per line) <span className="text-red-500">*</span>
                                        </Label>
                                        <span className="text-xs text-muted-foreground">
                                            {getUrlCount()} URLs entered
                                        </span>
                                    </div>
                                    <Textarea
                                        id="urls"
                                        value={urls}
                                        onChange={(e) => setUrls(e.target.value)}
                                        className="h-48 mt-2 resize-y dark:bg-gray-900"
                                        placeholder="Enter URLs here...&#10;example.com&#10;https://google.com&#10;http://github.com"
                                    />
                                </div>

                                {/* Command */}
                                <div className="mb-6">
                                    <Label htmlFor="command">
                                       File name (Remark)
                                    </Label>
                                    <Input 
                                        id="command"
                                        required
                                        type="text"
                                        value={command}
                                        onChange={(e) => setCommand(e.target.value)}
                                        className="mt-2 dark:bg-gray-900"
                                        placeholder="Input file name or Domain name"
                                    />
                                </div>

                                {/* Check Button */}
                                <Button
                                    onClick={handleCheckUrls}
                                    disabled={isChecking || !urls.trim()}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isChecking ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Checking URLs...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="mr-2 h-4 w-4" />
                                            Check URLs
                                        </>
                                    )}
                                </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Results Panel */}
                        <div className="lg:col-span-2">
                            <Card className=' dark:bg-gray-800'>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center">
                                            <BarChart3 className="mr-2 h-5 w-5" />
                                            Results
                                        </CardTitle>
                                        {/* {results.length > 0 && ( */}
                                            <div className="flex items-center space-x-4">
                                                <Badge variant="outline">
                                                    Total: {totalUrls}
                                                </Badge>
                                                <Badge variant="outline">
                                                    Success Rate: <span className="font-semibold text-green-600 ml-1">{successRate}%</span>
                                                </Badge>
                                            </div>
                                        {/* )} */}
                                    </div>
                                </CardHeader>
                                <CardContent>

                                {/* Progress Bar */}
                                {isChecking && (
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">Checking URLs...</span>
                                            <span className="text-sm text-muted-foreground">
                                                {checkedUrls} / {totalUrls} URLs checked
                                            </span>
                                        </div>
                                        <Progress value={progress} className="w-full" />
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-muted-foreground">
                                                {Math.round(progress)}% complete
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {totalUrls - checkedUrls} remaining
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {results.length > 0 ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {results.map((result, index) => (
                                            <div
                                                key={index}
                                                className={`p-2 rounded-lg border ${
                                                    result.accessible
                                                        ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                                                        : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">
                                                            {result.url}
                                                        </div>
                                                        <div className="flex items-center space-x-4 mt-1">
                                                            <Badge variant="outline" className={getStatusColor(result.status)}>
                                                                {result.status} - {getStatusText(result.status)}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {result.time}ms
                                                            </span>
                                                            {result.error && (
                                                                <span className="text-xs text-destructive">
                                                                    {result.error}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        {result.accessible ? (
                                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5 text-red-600" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground border border-gray-200 rounded-lg">
                                        <Inbox className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                        <p>No results yet. Enter URLs and click "Check URLs" to get started.</p>
                                    </div>
                                )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}


