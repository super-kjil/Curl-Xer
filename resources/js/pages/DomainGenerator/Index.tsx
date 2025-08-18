import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { AtSign, Calendar, Copy, CopyCheck, Globe, Link2, Loader2, Tag, Trash2, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Domain Generator',
        href: '/domain-generator',
    },
];

interface GenerateResponse {
    success: boolean;
    results: {
        www?: string[];
        non_www?: string[];
    };
    total_urls: number;
    total_generated: number;
    duplicate_count: number;
    prefix: string;
    date: string;
    include_www: boolean;
    include_non_www: boolean;
}

interface StoredResult {
    results: GenerateResponse['results'];
    totalUrls: number;
    totalGenerated: number;
    duplicateCount: number;
    prefix: string;
    date: string;
    timestamp: number;
    sessionId: string;
}

const STORAGE_KEY = 'url_generator_results';
const SESSION_DURATION = 5 * 60 * 1000; // 24 hours in milliseconds

export default function UrlGeneratorIndex() {
    const [urls, setUrls] = useState('');
    const [prefix, setPrefix] = useState('TRC');
    const [date, setDate] = useState('');
    const [includeWww, setIncludeWww] = useState(true);
    const [includeNonWww, setIncludeNonWww] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<GenerateResponse['results']>({});
    const [totalUrls, setTotalUrls] = useState(0);
    const [totalGenerated, setTotalGenerated] = useState(0);
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
    const [hasStoredResults, setHasStoredResults] = useState(false);

    // Generate a session ID based on current session
    const getSessionId = () => {
        let sessionId = localStorage.getItem('url_generator_session_id');
        if (!sessionId) {
            sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('url_generator_session_id', sessionId);
        }
        return sessionId;
    };

    // Check if session is expired by checking Laravel session cookie
    const isSessionExpired = () => {
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find((cookie) => cookie.trim().startsWith('laravel_session=') || cookie.trim().startsWith('XSRF-TOKEN='));
        return !sessionCookie;
    };

    // Save results to localStorage
    const saveResultsToStorage = (data: GenerateResponse) => {
        const storedResult: StoredResult = {
            results: data.results,
            totalUrls: data.total_urls,
            totalGenerated: data.total_generated,
            duplicateCount: data.duplicate_count,
            prefix: data.prefix,
            date: data.date,
            timestamp: Date.now(),
            sessionId: getSessionId(),
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storedResult));
            setHasStoredResults(true);
        } catch (error) {
            console.warn('Failed to save results to localStorage:', error);
        }
    };

    // Load results from localStorage
    const loadResultsFromStorage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;

            const storedResult: StoredResult = JSON.parse(stored);

            // Check if data is expired (older than SESSION_DURATION)
            const isExpired = Date.now() - storedResult.timestamp > SESSION_DURATION;

            // Check if session has changed or expired
            const currentSessionId = getSessionId();
            const sessionChanged = storedResult.sessionId !== currentSessionId;

            if (isExpired || sessionChanged || isSessionExpired()) {
                clearStoredResults();
                return null;
            }

            return storedResult;
        } catch (error) {
            console.warn('Failed to load results from localStorage:', error);
            clearStoredResults();
            return null;
        }
    };

    // Clear stored results
    const clearStoredResults = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setHasStoredResults(false);
            setResults({});
            setTotalUrls(0);
            setTotalGenerated(0);
            setDuplicateCount(0);
            toast.success('Stored results cleared');
        } catch (error) {
            console.warn('Failed to clear stored results:', error);
        }
    };

    useEffect(() => {
        // Set today's date on component mount
        setTodayDate();

        // Load stored results if available
        const storedResults = loadResultsFromStorage();
        if (storedResults) {
            setResults(storedResults.results);
            setTotalUrls(storedResults.totalUrls);
            setTotalGenerated(storedResults.totalGenerated);
            setDuplicateCount(storedResults.duplicateCount);
            setHasStoredResults(true);
            toast.info('Previous results restored from storage');
        }

        // Set up periodic session check
        const sessionCheckInterval = setInterval(() => {
            if (isSessionExpired()) {
                clearStoredResults();
                toast.warning('Session expired, stored results cleared');
            }
        }, 60000); // Check every minute

        return () => clearInterval(sessionCheckInterval);
    }, []);

    const setTodayDate = () => {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = today.toLocaleString('default', { month: 'short' });
        const year = today.getFullYear();
        setDate(`${day}-${month}-${year}`);
    };

    const getUrlCount = () => {
        return urls.trim()
            ? urls
                  .trim()
                  .split('\n')
                  .filter((url) => url.trim()).length
            : 0;
    };

    const copyToClipboard = async (text: string, itemId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedItems((prev) => new Set(prev).add(itemId));
            toast.success('Copied to clipboard!');

            // Remove the copied state after 2 seconds
            setTimeout(() => {
                setCopiedItems((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(itemId);
                    return newSet;
                });
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                setCopiedItems((prev) => new Set(prev).add(itemId));
                toast.success('Copied to clipboard!');
                setTimeout(() => {
                    setCopiedItems((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(itemId);
                        return newSet;
                    });
                }, 2000);
            } catch (err) {
                toast.error('Failed to copy to clipboard');
            }
            document.body.removeChild(textarea);
        }
    };

    const handleGenerate = async () => {
        if (!urls.trim()) {
            toast.error('Please enter at least one URL');
            return;
        }

        if (!includeWww && !includeNonWww) {
            toast.error('Please select at least one option (With www or Without www)');
            return;
        }

        setIsGenerating(true);
        setResults({});

        try {
            const response = await axios.post<GenerateResponse>('/domain-generator/generate', {
                urls,
                prefix: prefix || 'TRC',
                date,
                include_www: includeWww,
                include_non_www: includeNonWww,
            });

            if (response.data.success) {
                setResults(response.data.results);
                setTotalUrls(response.data.total_urls);
                setTotalGenerated(response.data.total_generated);
                setDuplicateCount(response.data.duplicate_count);

                // Save results to localStorage
                saveResultsToStorage(response.data);

                let message = `Generated ${response.data.total_generated} URL variants from ${response.data.total_urls} unique URLs`;
                if (response.data.duplicate_count > 0) {
                    message += ` (${response.data.duplicate_count} duplicates removed)`;
                }

                toast.success('URLs generated successfully', {
                    description: message + ' (Results saved to storage)',
                });
            }
        } catch (error: any) {
            console.error('Error generating URLs:', error);
            toast.error('Failed to generate URLs', {
                description: error.response?.data?.message || 'An unexpected error occurred',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const renderUrlGroup = (title: string, urls: string[], icon: React.ReactNode, groupKey: string) => {
        if (!urls || urls.length === 0) return null;

        const allUrlsText = urls.join('\n');
        const groupCopyId = `group-${groupKey}`;

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            {icon}
                            <span className="ml-2">{title}</span>
                        </CardTitle>
                        <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {urls.length} URLs
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(allUrlsText, groupCopyId)}
                                className="flex items-center"
                            >
                                {copiedItems.has(groupCopyId) ? (
                                    <CopyCheck className="mr-1.5 h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="mr-1.5 h-4 w-4" />
                                )}
                                Copy All
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-96 overflow-y-auto rounded-lg">
                        <div className="space-y-2">
                            {urls.map((url, index) => {
                                const itemCopyId = `${groupKey}-${index}`;
                                return (
                                    <div
                                        key={index}
                                        className="group flex items-center justify-between rounded-md p-2 transition-colors"
                                    >
                                        <span className="flex-1 font-mono text-sm break-all">{url}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(url, itemCopyId)}
                                            className="ml-3 p-1"
                                        >
                                            {copiedItems.has(itemCopyId) ? (
                                                <CopyCheck className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="URL Generator" />

            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className=" py-8">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="flex items-center text-3xl font-bold">
                                    <Link2 className="mr-3 h-8 w-8" /> URL Generator
                                </h1>
                                <p className="mt-2 opacity-90">Create formatted URLs with automatic www/non-www variants</p>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="container mx-auto max-w-6xl px-4 py-8">
                    {/* Input Form */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                URL Generator Settings
                                <Button
                                    disabled={!hasStoredResults}
                                    size="lg"
                                    onClick={clearStoredResults}
                                    // className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    <Trash2 />
                                    Clear All
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* URLs Input */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <Label htmlFor="urls" className="flex items-center">
                                            <Link2 className="mr-1 h-4 w-4" />
                                            URLs (one per line)
                                        </Label>
                                        <Badge
                                            variant="outline"
                                            className={getUrlCount() > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                                        >
                                            {getUrlCount()} URLs entered
                                        </Badge>
                                    </div>
                                    <Textarea
                                        id="urls"
                                        value={urls}
                                        onChange={(e) => setUrls(e.target.value)}
                                        className="h-32 resize-y"
                                        placeholder="Enter URLs here...&#10;example.com&#10;google.com&#10;github.com"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {/* Tag Input */}
                                    <div>
                                        <Label htmlFor="prefix" className="mb-2 flex items-center">
                                            <Tag className="mr-1 h-4 w-4" />
                                            Tag
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="prefix"
                                                value={prefix}
                                                onChange={(e) => setPrefix(e.target.value)}
                                                className="pl-8"
                                                placeholder="TRC"
                                            />
                                            <span className="absolute top-2.5 left-3 text-gray-400 dark:text-gray-500">#</span>
                                        </div>
                                    </div>

                                    {/* Date Input */}
                                    <div>
                                        <Label htmlFor="date" className="mb-2 flex items-center">
                                            <Calendar className="mr-1 h-4 w-4" />
                                            Date
                                        </Label>
                                        <div className="flex">
                                            <Input
                                                id="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="rounded-r-none"
                                                readOnly
                                            />
                                            <Button type="button" onClick={setTodayDate} className="rounded-l-none" variant="outline">
                                                Today
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Options */}
                                    <div>
                                        <Label className="mb-2 flex items-center">Options</Label>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-www"
                                                    checked={includeWww}
                                                    onCheckedChange={(checked) => setIncludeWww(checked as boolean)}
                                                />
                                                <Label htmlFor="include-www" className="text-sm">
                                                    With www
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-non-www"
                                                    checked={includeNonWww}
                                                    onCheckedChange={(checked) => setIncludeNonWww(checked as boolean)}
                                                />
                                                <Label htmlFor="include-non-www" className="text-sm">
                                                    Without www
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <div className="flex justify-between pt-2">
                                    <Button onClick={handleGenerate} disabled={isGenerating || !urls.trim()} className="w-full" size="lg">
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating URLs...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="mr-2 h-4 w-4" />
                                                Generate URLs
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    {(results.www || results.non_www) && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {results.www && renderUrlGroup('With www', results.www, <Globe className="h-5 w-5 text-blue-500" />, 'www')}
                            {results.non_www &&
                                renderUrlGroup('Without www', results.non_www, <AtSign className="h-5 w-5 text-purple-500" />, 'non-www')}
                        </div>
                    )}

                    {/* Summary */}
                    {totalGenerated > 0 && (
                        <Card className="mt-6">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-foreground">{totalUrls}</div>
                                        <div>Unique URLs</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-foreground">{totalGenerated}</div>
                                        <div>Generated Variants</div>
                                    </div>
                                    {duplicateCount > 0 && (
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-yellow-600">{duplicateCount}</div>
                                            <div>Duplicates Removed</div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
