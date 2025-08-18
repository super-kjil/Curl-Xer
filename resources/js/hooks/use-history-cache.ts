import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface BatchResult {
    url: string;
    status: number;
    time: number;
    accessible: boolean;
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
}

interface CachedHistory {
    data: GroupedHistoryItem[];
    timestamp: number;
    version: string;
}

const CACHE_KEY = 'domain-checker-history-cache';
const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const useHistoryCache = () => {
    const [history, setHistory] = useState<GroupedHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<number | null>(null);

    // Load cached data from localStorage
    const loadFromCache = useCallback((): GroupedHistoryItem[] | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const parsed: CachedHistory = JSON.parse(cached);
            
            // Check if cache is valid
            if (parsed.version !== CACHE_VERSION) return null;
            if (Date.now() - parsed.timestamp > CACHE_EXPIRY) return null;

            return parsed.data;
        } catch {
            return null;
        }
    }, []);

    // Save data to cache
    const saveToCache = useCallback((data: GroupedHistoryItem[]) => {
        try {
            const cacheData: CachedHistory = {
                data,
                timestamp: Date.now(),
                version: CACHE_VERSION
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save to cache:', error);
        }
    }, []);

    // Clear cache
    const clearCache = useCallback(() => {
        try {
            localStorage.removeItem(CACHE_KEY);
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
    }, []);

    // Check if cache is valid
    const isCacheValid = useCallback((): boolean => {
        if (!lastFetched) return false;
        return Date.now() - lastFetched < CACHE_EXPIRY;
    }, [lastFetched]);

    // Load history data
    const loadHistory = useCallback(async (forceRefresh = false) => {
        // Try to load from cache first
        if (!forceRefresh) {
            const cachedData = loadFromCache();
            if (cachedData) {
                setHistory(cachedData);
                setLastFetched(Date.now());
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get('/domain-history/history/grouped');
            
            if (response.data.success) {
                const historyData = response.data.history;
                setHistory(historyData);
                setLastFetched(Date.now());
                saveToCache(historyData);
                setError(null);
            } else {
                setError('Failed to load history data');
                toast.error('Failed to load history');
            }
        } catch (error: any) {
            console.error('Failed to load history:', error);
            const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
            setError(errorMessage);
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    }, [loadFromCache, saveToCache]);

    // Delete history item
    const deleteHistoryItem = useCallback(async (command: string) => {
        try {
            const response = await axios.delete('/domain-history/history', {
                data: { id: command },
            });
            
            if (response.data.success) {
                setHistory(prev => prev.filter(item => item.command !== command));
                // Update cache
                const updatedHistory = history.filter(item => item.command !== command);
                saveToCache(updatedHistory);
                toast.success('History item deleted');
            } else {
                toast.error('Failed to delete history item');
            }
        } catch (error: any) {
            console.error('Failed to delete history item:', error);
            toast.error('Failed to delete history item');
        }
    }, [history, saveToCache]);

    // Clear all history
    const clearAllHistory = useCallback(async () => {
        try {
            const response = await axios.delete('/domain-history/history/clear');
            
            if (response.data.success) {
                setHistory([]);
                setLastFetched(null);
                clearCache();
                toast.success('All history cleared');
            } else {
                toast.error('Failed to clear history');
            }
        } catch (error: any) {
            console.error('Failed to clear history:', error);
            toast.error('Failed to clear history');
        }
    }, [clearCache]);

    // Refresh history (force reload)
    const refreshHistory = useCallback(() => {
        clearCache();
        loadHistory(true);
    }, [clearCache, loadHistory]);

    // Initialize with cached data on mount
    useEffect(() => {
        const cachedData = loadFromCache();
        if (cachedData) {
            setHistory(cachedData);
            setLastFetched(Date.now());
        } else {
            loadHistory();
        }
    }, [loadFromCache, loadHistory]);

    // Computed values
    const stats = useMemo(() => ({
        totalUrls: history.reduce((total, item) => total + item.totalUrls, 0),
        averageSuccessRate: history.length > 0 
            ? Math.round(history.reduce((sum, item) => sum + item.avgSuccessRate, 0) / history.length)
            : 0,
        itemCount: history.length,
    }), [history]);

    const cacheInfo = useMemo(() => ({
        isCacheValid: isCacheValid(),
        cacheAge: lastFetched ? Date.now() - lastFetched : null,
        cacheExpiry: CACHE_EXPIRY,
    }), [isCacheValid, lastFetched]);

    return {
        // Data
        history,
        loading,
        error,
        lastFetched,
        
        // Actions
        loadHistory,
        deleteHistoryItem,
        clearAllHistory,
        refreshHistory,
        
        // Stats
        stats,
        
        // Cache info
        cacheInfo,
        
        // Cache management
        isCacheValid: isCacheValid(),
        clearCache,
    };
};
