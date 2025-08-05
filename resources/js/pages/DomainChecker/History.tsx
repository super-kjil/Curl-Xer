import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, BadgeCheckIcon, CheckCircle, Copy, Trash, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Domain History',
        href: '/domain-checker/history',
    },
];

interface HistoryItem {
    id: string;
    command: string;
    url_count: number;
    success_rate: number;
    primary_dns: string;
    secondary_dns: string;
    timestamp: string;
    results: any[];
}

export default function DomainCheckerHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();

        // Check for dark mode preference
        const darkMode = localStorage.getItem('darkMode') === 'true';
        setIsDarkMode(darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const loadHistory = async () => {
        try {
            const response = await axios.get('/domain-checker/history/data');
            if (response.data.success) {
                setHistory(response.data.history);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode.toString());
        document.documentElement.classList.toggle('dark', newDarkMode);
        toast.success(`Switched to ${newDarkMode ? 'dark' : 'light'} mode`);
    };

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    const openDeleteDialog = (id: string) => {
        setItemToDelete(id);
        setShowDeleteDialog(true);
    };

    const deleteHistoryItem = async () => {
        if (!itemToDelete) return;

        try {
            const response = await axios.delete('/domain-checker/history', {
                data: { id: itemToDelete },
            });
            if (response.data.success) {
                setHistory((prev) => prev.filter((item) => item.id !== itemToDelete));
                toast.success('History item deleted');
            }
        } catch (error) {
            console.error('Failed to delete history item:', error);
            toast.error('Failed to delete history item');
        } finally {
            setShowDeleteDialog(false);
            setItemToDelete(null);
        }
    };

    const openClearDialog = () => {
        setShowClearDialog(true);
    };

    const clearHistory = async () => {
        try {
            const response = await axios.delete('/domain-checker/history/clear');
            if (response.data.success) {
                setHistory([]);
                toast.success('History cleared');
            }
        } catch (error) {
            console.error('Failed to clear history:', error);
            toast.error('Failed to clear history');
        } finally {
            setShowClearDialog(false);
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

    const formatDNS = (primary: string, secondary: string) => {
        const primaryDNS = primary || 'Auto';
        const secondaryDNS = secondary || '0.0.0.0';
        return `Primary: ${primaryDNS}, Secondary: ${secondaryDNS}`;
    };

    const copyHistory = (historyItem: HistoryItem) => {
        if (!historyItem.results || historyItem.results.length === 0) {
            toast.error('No results to copy');
            return;
        }
        const urls = historyItem.results.map((result) => `${result.url} ${new Date(result.timestamp).toLocaleDateString()}`);
        const textToCopy = urls.join('\n');
        navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
                toast.success('URLs with timestamps copied to clipboard');
            })
            .catch(() => {
                toast.error('Failed to copy URLs');
            });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Domain Checker" />

            <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 py-8 text-white shadow-lg">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="flex items-center text-3xl font-bold">
                                    <i className="fas fa-history mr-3"></i> History
                                </h1>
                                <p className="mt-2 opacity-90">View past URL check results</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <a href="/domain-checker" className="flex items-center text-white hover:text-gray-200" title="Back to Home">
                                    <i className="fas fa-globe text-xl"></i>
                                </a>
                                <button
                                    onClick={toggleDarkMode}
                                    className="text-white hover:text-gray-200 focus:outline-none"
                                    title="Toggle Dark Mode"
                                >
                                    <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-xl`}></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Check History ({history.length} items)</h2>
                        {history.length > 0 && (
                            <Button onClick={openClearDialog} className="bg-red-500 hover:bg-red-600 dark:text-white">
                                <Trash />
                                Clear All
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className="py-12 text-center">
                            <i className="fas fa-spinner fa-spin mb-4 text-4xl text-gray-400"></i>
                            <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                            <i className="fas fa-history mb-4 text-4xl"></i>
                            <p>No history found. Start checking URLs to see results here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => (
                                <div key={item.id} className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center space-x-2">
                                                        {item.command && (
                                                            <Badge variant="secondary" className="text-md text-black dark:text-white">
                                                                <BadgeCheckIcon className="text-blue-700" />
                                                                {item.command}
                                                            </Badge>
                                                        )}
                                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            {new Date(item.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex items-center space-x-4">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Total URLs: <span className="font-semibold">{item.url_count}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Success Rate: <span className="font-semibold text-green-600">{item.success_rate}%</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        DNS:{' '}
                                                        <span className="font-mono text-xs">{formatDNS(item.primary_dns, item.secondary_dns)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                {/* <Button 
                                                    variant="outline"
                                                    onclick={() => expend}
                                                    >

                                                </Button> */}
                                                <Button variant="outline" onClick={() => copyHistory(item)} title="Copy URLs with timestamps">
                                                    <Copy />
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    onClick={() => openDeleteDialog(item.id)}
                                                    className="bg-red-500 text-white hover:bg-red-600 dark:text-white"
                                                    title="Delete"
                                                >
                                                    <Trash />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <div className={`history-details ${expandedItems.has(item.id) ? 'expanded' : 'collapsed'}`}>
                                        <div className="border-t border-gray-200 dark:border-gray-500 p-6 bg-gray-50 dark:bg-gray-800">
                                            <div className="space-x-2 space-y-2 max-h-64 overflow-y-auto">
                                                {item.results.map((result, index) => (
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
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {result.url}
                                                                </div>
                                                                <div className="flex items-center space-x-4 mt-1">
                                                                    <span className={`text-xs font-medium ${getStatusColor(result.status)}`}>
                                                                        {result.status} - {getStatusText(result.status)}
                                                                    </span>
                                                                    {result.error && (
                                                                        <span className="text-xs text-red-600 dark:text-red-400">
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
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete History Item
                        </DialogTitle>
                        <DialogDescription>Are you sure you want to delete this history item? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteHistoryItem}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Clear All Confirmation Dialog */}
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Clear All History
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to clear all history? This action cannot be undone and will permanently delete all history items.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={clearHistory}>
                            Clear All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// DomainCheckerHistory.layout = (page: any) => <AppLayout children={page} />;
