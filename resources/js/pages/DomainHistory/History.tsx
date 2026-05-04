import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertTriangle, BadgeCheckIcon, CheckCircle, Trash, XCircle, ChevronDown, ChevronUp, History, ClipboardList, RefreshCw, Search, Inbox, User } from 'lucide-react';
import { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { useHistoryCache } from '@/hooks/use-history-cache';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Domain History',
        href: '/domain-history/history',
    },
];

interface BatchResult {
    url: string;
    status: number;
    time: number;
    accessible: boolean;
    result_kind?: string;
    timestamp: string;
    error?: string;
    remark?: string;
}

interface BatchItem {
    id: string;
    command?: string;
    urlCount: number;
    successRate: number;
    primaryDns: string;
    secondaryDns: string;
    timestamp: string;
    results: BatchResult[];
}

interface GroupedHistoryItem {
    command: string;
    totalUrls: number;
    avgSuccessRate: number;
    latestTimestamp: string;
    primaryDns: string;
    secondaryDns: string;
    batches: BatchItem[];
    created_by?: string;
}

export default function DomainCheckerHistory() {
    const {
        history,
        loading,
        deleteHistoryItem,
        clearAllHistory,
        refreshHistory,
        updateHistoryItem,
        deleteDomainResult
    } = useHistoryCache();

    const { hasRole } = usePermissions();
    const isAdmin = hasRole('admin');

    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [expandingItems, setExpandingItems] = useState<Set<string>>(new Set());
    const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [itemToEdit, setItemToEdit] = useState<GroupedHistoryItem | null>(null);
    const [editedCommand, setEditedCommand] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDeleteResultDialog, setShowDeleteResultDialog] = useState(false);
    const [resultToDelete, setResultToDelete] = useState<{ batchId: string; url: string } | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Highlight search terms in text
    const highlightSearchTerm = useCallback((text: string, searchTerm: string) => {
        if (!searchTerm.trim()) return text;

        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
    }, []);

    // Filter history based on search query
    const filteredHistory = useMemo(() => {
        if (!searchQuery.trim()) return history;

        const query = searchQuery.toLowerCase().trim();
        return history.filter(item => {
            // Search in command name
            if (item.command.toLowerCase().includes(query)) return true;

            // Search in URLs within batches
            return item.batches.some(batch =>
                batch.results.some(result =>
                    result.url.toLowerCase().includes(query)
                )
            );
        });
    }, [history, searchQuery]);

    const toggleExpanded = useCallback(async (command: string) => {
        // Prevent multiple rapid clicks
        if (expandingItems.has(command)) return;

        setExpandingItems(prev => new Set(prev).add(command));

        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(command)) {
            newExpanded.delete(command);
        } else {
            newExpanded.add(command);
        }
        setExpandedItems(newExpanded);

        // Small delay to prevent rapid toggling
        setTimeout(() => {
            setExpandingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(command);
                return newSet;
            });
        }, 150);
    }, [expandingItems, expandedItems]);

    const toggleResultsExpanded = useCallback((batchId: string) => {
        const newExpanded = new Set(expandedResults);
        if (newExpanded.has(batchId)) {
            newExpanded.delete(batchId);
        } else {
            newExpanded.add(batchId);
        }
        setExpandedResults(newExpanded);
    }, [expandedResults]);

    const openDeleteDialog = (command: string) => {
        setItemToDelete(command);
        setShowDeleteDialog(true);
    };

    const openClearDialog = () => {
        setShowClearDialog(true);
    };

    const clearHistory = async () => {
        await clearAllHistory();
        setShowClearDialog(false);
    };

    const confirmDeleteHistory = async () => {
        if (itemToDelete) {
            await deleteHistoryItem(itemToDelete);
            setShowDeleteDialog(false);
            setItemToDelete(null);
        }
    };

    const getStatusColorClass = (result: BatchResult) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const kind = (result as any).result_kind as string | undefined;

        if (kind === 'not_existed') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        if (kind === 'blocked') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        if (kind === 'not_blocked') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';

        // Fallback for old rows that don't have result_kind stored
        if (result.status === 404) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        if (result.status === 403) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';

        // New nslookup rows store http_status as NULL; use accessible boolean instead.
        if (result.accessible) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    };


    const copyHistory = (group: GroupedHistoryItem) => {
        const allResults = group.batches.flatMap((b) => b.results || []);
        if (!allResults || allResults.length === 0) {
            toast.error('Error', {
                className: 'error-toast',
                descriptionClassName: 'error-toast-description',
                duration: 3000,
                description: 'No results to copy',
            });
            return;
        }

        // Format date to DD/MM/YYYY
        const formatDate = (timestamp: string) => {
            const date = new Date(timestamp);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const urls = allResults.map((result) => `${result.url}      ${formatDate(result.timestamp)}`);
        const textToCopy = urls.join('\n');

        // Modern clipboard API with fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(textToCopy)
                .then(() => {
                    toast.success('Successfully', {
                        className: 'success-toast',
                        descriptionClassName: 'success-toast-description',
                        duration: 3000,
                        description: 'Successfully copied to clipboard',
                    });
                })
                .catch(() => {
                    // Fallback to legacy method
                    fallbackCopyTextToClipboard(textToCopy);
                });
        } else {
            // Fallback for older browsers
            fallbackCopyTextToClipboard(textToCopy);
        }
    };

    // Fallback copy method for older browsers
    const fallbackCopyTextToClipboard = (text: string) => {
        try {
            // Create temporary textarea element
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                toast.success('Successfully', {
                    className: 'success-toast',
                    descriptionClassName: 'success-toast-description',
                    description: 'URLs with timestamps copied to clipboard',
                });
            } else {
                toast.error('Error', {
                    className: 'warning-toast',
                    description: 'Failed to copy URLs. Please copy manually.',
                });
            }
        } catch (err) {
            toast.error('Error', {
                className: 'warning-toast',
                description: 'Failed to copy URLs. Please copy manually.',
            });
            console.error('Fallback copy failed:', err);
        }
    };


    // Keyboard shortcut for search (Ctrl+F)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Checked History" />

            <div className="min-h-screen">
                {/* Header */}
                <div className="bg-gradient-to-r py-8 ">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="flex items-center text-3xl font-bold">
                                    <History className="mr-2 font-bold " /> History Logs
                                </h1>
                                <p className="mt-2 opacity-90">View checked domains results</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center">
                                <ClipboardList className="mr-2" /> Checked History
                            </h2>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                onClick={refreshHistory}
                                disabled={loading}
                                title="Refresh history data"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            {isAdmin && (
                                <>
                                    {history.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            onClick={openClearDialog}
                                            title="Clear all history"
                                        >
                                            <Trash className="mr-2" />
                                            Erase All History
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-4">
                        <div className="grid w-full max-w-sm items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Search />
                                <Label>Search by filename, or URL... (Ctrl+F)</Label>
                            </div>
                            <div className=" flex gap-2 items-center">
                                <Input
                                    className='w-lg'
                                    ref={searchInputRef}
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setSearchQuery('');
                                        }
                                    }}
                                /> 
                                <Button
                                    onClick={() => setSearchQuery('')}
                                    disabled={!searchQuery}
                                >
                                   Clear Search
                                </Button>
                            </div>
                            {/* {searchQuery && (
                                <Button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )} */}
                        </div>
                        {searchQuery && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Found {filteredHistory.length} results for "{searchQuery}"
                            </p>
                        )}
                    </div>

                    {loading ? (
                        <div className="py-12 text-center">
                            <i className="fas fa-spinner fa-spin mb-4 text-4xl text-gray-400"></i>
                            <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                            {searchQuery ? (
                                <>
                                    <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                    <p>No results found for "{searchQuery}"</p>
                                    <p className="text-sm mt-2">Try a different search term or clear the search</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSearchQuery('')}
                                        className="mt-4"
                                    >
                                        Clear Search
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Inbox className="mx-auto mb-4 h-12 w-12 text-gray-400 " />
                                    <p>No history found. Start checking URLs to see results here.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredHistory
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((item) => (
                                    <div key={item.command} className="overflow-hidden">
                                        <Card className="p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center space-x-2">
                                                            {item.command && (
                                                                <Badge variant="outline" className="text-sm text-black bg-blue-200">
                                                                    <BadgeCheckIcon className="text-blue-700 mr-1 " />
                                                                    <span
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: highlightSearchTerm(item.command, searchQuery)
                                                                        }}
                                                                    />
                                                                </Badge>
                                                            )}
                                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                                {new Date(item.latestTimestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 flex items-center space-x-4">
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            Total Domains: <span className="font-semibold">{item.totalUrls}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            Success Rate: <span className="font-semibold text-green-600">{item.avgSuccessRate}%</span>
                                                        </div>
                                                        {item.created_by && (
                                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                <User className="h-3 w-3 mr-1" />
                                                                {item.created_by}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Button variant="outline" onClick={() => copyHistory(item)} title="Copy URLs with timestamps">
                                                        {/* <Copy className="mr-1" /> */}
                                                        Copy
                                                    </Button>

                                                    {isAdmin && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setItemToEdit(item);
                                                                    setEditedCommand(item.command);
                                                                    setShowEditDialog(true);
                                                                }}
                                                                title="Edit"
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => openDeleteDialog(item.command)}
                                                                title="Delete"
                                                            >
                                                                Delete
                                                            </Button>
                                                        </>
                                                    )}

                                                    <Button
                                                        variant="outline"
                                                        onClick={() => toggleExpanded(item.command)}
                                                        className="text-gray-500 hover:text-gray-700"
                                                        title={expandedItems.has(item.command) ? "Collapse" : "Expand"}
                                                        disabled={expandingItems.has(item.command)}
                                                    >
                                                        {expandingItems.has(item.command) ? (
                                                            <ChevronUp className="animate-spin" />
                                                        ) : (
                                                            expandedItems.has(item.command) ? <ChevronUp /> : <ChevronDown />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Expanded Details */}
                                        <div
                                            className={`border-gray-200 overflow-hidden transition-all duration-200 ease-out ${expandedItems.has(item.command)
                                                    ? 'opacity-100 translate-y-0'
                                                    : 'opacity-0 -translate-y-2 pointer-events-none'
                                                }`}
                                            style={{
                                                maxHeight: expandedItems.has(item.command) ? 'none' : '0px',
                                                display: expandedItems.has(item.command) ? 'block' : 'none'
                                            }}
                                        >
                                            <Card className="p-2 space-y-2 rounded-lg">
                                                {item.batches.map((batch) => (
                                                    <div key={batch.id} className=" rounded-lg p-2">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <CardTitle >
                                                                Total Domains: {batch.urlCount}
                                                            </CardTitle>
                                                            <div className="flex items-center space-x-2">
                                                                <CardDescription className={`${batch.successRate > 80 ? "text-green-600 dark:text-green-400" : batch.successRate > 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                                                                    {batch.successRate}% accessible
                                                                </CardDescription>
                                                                <CardDescription className="text-xs ">
                                                                    {new Date(batch.timestamp).toLocaleString()}
                                                                </CardDescription>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(batch.results || [])
                                                                .sort((a, b) => {
                                                                     
                                                                    const aNotExisted =
                                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                        (a as any).result_kind === 'not_existed' || a.status === 404;
                                                                    const bNotExisted =
                                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                        (b as any).result_kind === 'not_existed' || b.status === 404;

                                                                    // Not Existed always on top
                                                                    if (aNotExisted !== bNotExisted) {
                                                                        return aNotExisted ? -1 : 1;
                                                                    }

                                                                    // Then sort by accessibility (accessible domains on top)
                                                                    if (a.accessible !== b.accessible) {
                                                                        return b.accessible ? 1 : -1;
                                                                    }

                                                                    // Then sort by response time (faster responses first)
                                                                    return a.time - b.time;
                                                                })
                                                                .slice(0, expandedResults.has(batch.id) ? undefined : 10)
                                                                .map((result, resultIndex) => (
                                                                    <div key={resultIndex} className="flex items-start justify-between">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p
                                                                                className="text-sm font-medium truncate"
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: highlightSearchTerm(result.url, searchQuery)
                                                                                }}
                                                                            />
                                                                            <div className="mt-1 flex items-center text-xs">
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded ${getStatusColorClass(result)}`}>
                                                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                                                {(result as any).result_kind === 'not_existed' || result.status === 404
                                                                                    ? 'Not Existed'
                                                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                                    : (result as any).result_kind === 'blocked' || result.status === 403
                                                                                        ? 'Blocked'
                                                                                        : result.accessible
                                                                                            ? 'Not Blocked'
                                                                                            : 'DNS Failed'}
                                                                            </span>
                                                                                <span className="ml-2">{result.time}ms</span>
                                                                                <span className="ml-2">{new Date(result.timestamp).toLocaleTimeString()}</span>
                                                                                {result.error && (
                                                                                    <span className="ml-2 text-red-600 dark:text-red-400">{result.error}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex ml-4 flex-shrink-0 items-center space-x-2">
                                                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                                        {(result as any).result_kind === 'not_existed' || result.status === 404 ? (
                                                                            <AlertTriangle className="h-5 w-5 text-blue-600" />
                                                                        ) : result.accessible ? (
                                                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                                                        ) : (
                                                                            <XCircle className="h-5 w-5 text-red-600" />
                                                                        )}
                                                                            {isAdmin && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="text-red-500 hover:text-red-700"
                                                                                    onClick={() => {
                                                                                        setResultToDelete({ batchId: batch.id, url: result.url });
                                                                                        setShowDeleteResultDialog(true);
                                                                                    }}
                                                                                    title="Delete result"
                                                                                >
                                                                                    <Trash className="h-4 w-4" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                            {batch.results && batch.results.length > 10 && (
                                                                <div className="pt-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => toggleResultsExpanded(batch.id)}
                                                                        className="w-full"
                                                                    >
                                                                        {expandedResults.has(batch.id)
                                                                            ? `Show Less`
                                                                            : `Show More (${batch.results.length - 10} more results)`
                                                                        }
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </Card>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

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

            {/* Delete History Item Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete History Item
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this history item? This action cannot be undone and will permanently delete all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteHistory}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit History Item Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit History Item</DialogTitle>
                        <DialogDescription>
                            Edit the command name for this history item.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="command">Command</Label>
                            <Input
                                id="command"
                                value={editedCommand}
                                onChange={(e) => setEditedCommand(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={async () => {
                            if (itemToEdit && editedCommand) {
                                const success = await updateHistoryItem(itemToEdit.command, editedCommand);
                                if (success) {
                                    setShowEditDialog(false);
                                    setItemToEdit(null);
                                }
                            }
                        }}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Result Confirmation Dialog */}
            <Dialog open={showDeleteResultDialog} onOpenChange={setShowDeleteResultDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete Domain Result
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this domain result? This action cannot be undone.
                            {resultToDelete && (
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                    <code className="text-sm break-all">{resultToDelete.url}</code>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteResultDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (resultToDelete) {
                                    await deleteDomainResult(resultToDelete.batchId, resultToDelete.url);
                                    setShowDeleteResultDialog(false);
                                    setResultToDelete(null);
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pagination Controls */}
            {filteredHistory.length > itemsPerPage && (
                <div className="m-4 flex justify-center ">
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="mr-2"
                        >
                            Previous
                        </Button>
                        <span className="mx-4 flex items-center">
                            Page {currentPage} of {Math.ceil(filteredHistory.length / itemsPerPage)}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredHistory.length / itemsPerPage), p + 1))}
                            disabled={currentPage >= Math.ceil(filteredHistory.length / itemsPerPage)}
                            className="ml-2"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}