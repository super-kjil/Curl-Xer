import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

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

    const deleteHistoryItem = async (id: string) => {
        if (!confirm('Are you sure you want to delete this history item?')) {
            return;
        }

        try {
            const response = await axios.delete('/domain-checker/history', {
                data: { id }
            });
            if (response.data.success) {
                setHistory(prev => prev.filter(item => item.id !== id));
                toast.success('History item deleted');
            }
        } catch (error) {
            console.error('Failed to delete history item:', error);
            toast.error('Failed to delete history item');
        }
    };

    const clearHistory = async () => {
        if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await axios.delete('/domain-checker/history/clear');
            if (response.data.success) {
                setHistory([]);
                toast.success('History cleared');
            }
        } catch (error) {
            console.error('Failed to clear history:', error);
            toast.error('Failed to clear history');
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
        const urls = historyItem.results.map(result => 
            `${result.url} [${new Date(result.timestamp).toLocaleDateString()}]`
        );
        const textToCopy = urls.join('\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
            toast.success('URLs with timestamps copied to clipboard');
        }).catch(() => {
            toast.error('Failed to copy URLs');
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Domain Checker" />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-8 shadow-lg">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold flex items-center">
                                    <i className="fas fa-history mr-3"></i> History
                                </h1>
                                <p className="mt-2 opacity-90">
                                    View past URL check results
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <a
                                    href="/domain-checker"
                                    className="text-white hover:text-gray-200 flex items-center"
                                    title="Back to Home"
                                >
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
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                            Check History ({history.length} items)
                        </h2>
                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <i className="fas fa-trash mr-2"></i>
                                Clear All
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                            <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <i className="fas fa-history text-4xl mb-4"></i>
                            <p>No history found. Start checking URLs to see results here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            {new Date(item.timestamp).toLocaleString()}
                                                        </span>
                                                        {item.command && (
                                                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">
                                                                {item.command}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-2 flex items-center space-x-6">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        URLs: <span className="font-semibold">{item.url_count}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Success Rate: <span className="font-semibold text-green-600">{item.success_rate}%</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        DNS: <span className="font-mono text-xs">
                                                            {formatDNS(item.primary_dns, item.secondary_dns)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => toggleExpanded(item.id)}
                                                    className="text-blue-500 hover:text-blue-600 focus:outline-none"
                                                    title={expandedItems.has(item.id) ? 'Hide Details' : 'Show Details'}
                                                >
                                                    <i className={`fas ${expandedItems.has(item.id) ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                                </button>
                                                <button
                                                    onClick={() => copyHistory(item)}
                                                    className="text-blue-500 hover:text-blue-600 focus:outline-none"
                                                    title="Copy URLs with timestamps"
                                                >
                                                    <i className="fas fa-copy"></i>
                                                </button>
                                                <button
                                                    onClick={() => deleteHistoryItem(item.id)}
                                                    className="text-red-500 hover:text-red-600 focus:outline-none"
                                                    title="Delete"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <div className={`history-details ${expandedItems.has(item.id) ? 'expanded' : 'collapsed'}`}>
                                        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                                URL Results
                                            </h4>
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {item.results.map((result, index) => (
                                                    <div
                                                        key={index}
                                                        className={`p-3 rounded-lg border ${
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
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {result.time}ms
                                                                    </span>
                                                                    {result.error && (
                                                                        <span className="text-xs text-red-600 dark:text-red-400">
                                                                            {result.error}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <i
                                                                    className={`fas ${
                                                                        result.accessible ? 'fa-check-circle text-green-600' : 'fa-times-circle text-red-600'
                                                                    }`}
                                                                ></i>
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
        </AppLayout>
    );
} 

// DomainCheckerHistory.layout = (page: any) => <AppLayout children={page} />; 