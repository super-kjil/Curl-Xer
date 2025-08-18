import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
    useHistoryStore, 
    useHistoryData, 
    useHistoryLoading, 
    useHistoryError,
    useHistoryStats 
} from '@/stores/useHistoryStore';

export const useHistoryData = () => {
    const {
        history,
        loading,
        error,
        lastFetched,
        setHistory,
        setLoading,
        setError,
        setLastFetched,
        removeHistoryItem,
        clearHistory,
        isCacheValid,
        invalidateCache,
    } = useHistoryStore();

    const loadHistory = useCallback(async (forceRefresh = false) => {
        // Check if cache is valid and we don't need to force refresh
        if (!forceRefresh && isCacheValid()) {
            return; // Use cached data
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get('/domain-history/history/grouped');
            
            if (response.data.success) {
                setHistory(response.data.history);
                toast.success('History loaded successfully');
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
    }, [setHistory, setLoading, setError, isCacheValid]);

    const deleteHistoryItem = useCallback(async (command: string) => {
        try {
            const response = await axios.delete('/domain-history/history', {
                data: { id: command },
            });
            
            if (response.data.success) {
                removeHistoryItem(command);
                toast.success('History item deleted');
            } else {
                toast.error('Failed to delete history item');
            }
        } catch (error: any) {
            console.error('Failed to delete history item:', error);
            toast.error('Failed to delete history item');
        }
    }, [removeHistoryItem]);

    const clearAllHistory = useCallback(async () => {
        try {
            const response = await axios.delete('/domain-history/history/clear');
            
            if (response.data.success) {
                clearHistory();
                toast.success('All history cleared');
            } else {
                toast.error('Failed to clear history');
            }
        } catch (error: any) {
            console.error('Failed to clear history:', error);
            toast.error('Failed to clear history');
        }
    }, [clearHistory]);

    const refreshHistory = useCallback(() => {
        invalidateCache();
        loadHistory(true);
    }, [invalidateCache, loadHistory]);

    // Auto-load history on mount if cache is invalid
    useEffect(() => {
        if (!isCacheValid()) {
            loadHistory();
        }
    }, [loadHistory, isCacheValid]);

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
        
        // Computed values
        totalUrls: history.reduce((total, item) => total + item.totalUrls, 0),
        averageSuccessRate: history.length > 0 
            ? Math.round(history.reduce((sum, item) => sum + item.avgSuccessRate, 0) / history.length)
            : 0,
        itemCount: history.length,
        
        // Cache info
        isCacheValid: isCacheValid(),
        cacheAge: lastFetched ? Date.now() - lastFetched : null,
    };
};

// Optimized selector hooks for specific use cases
export const useHistoryByCommand = (command: string) => {
    return useHistoryStore((state) => state.getHistoryByCommand(command));
};

export const useAccessibleDomains = (command: string) => {
    return useHistoryStore((state) => state.getAccessibleDomains(command));
};

export const useInaccessibleDomains = (command: string) => {
    return useHistoryStore((state) => state.getInaccessibleDomains(command));
};

export const useHistoryStats = () => {
    return useHistoryStore((state) => ({
        totalUrls: state.getTotalUrls(),
        averageSuccessRate: state.getAverageSuccessRate(),
        itemCount: state.history.length,
    }));
};
