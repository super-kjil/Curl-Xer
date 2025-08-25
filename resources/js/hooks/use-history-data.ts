import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export const useHistoryData = () => {
    const [history, setHistory] = useState<GroupedHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = useCallback(async () => {
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
        } catch (error: unknown) {
            console.error('Failed to load history:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            setError(errorMessage);
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteHistoryItem = useCallback(async (command: string) => {
        try {
            const response = await axios.delete('/domain-history/history', {
                data: { id: command },
            });
            
            if (response.data.success) {
                setHistory(prev => prev.filter(item => item.command !== command));
                toast.success('History item deleted');
            } else {
                toast.error('Failed to delete history item');
            }
        } catch (error: unknown) {
            console.error('Failed to delete history item:', error);
            toast.error('Failed to delete history item');
        }
    }, []);

    const clearAllHistory = useCallback(async () => {
        try {
            const response = await axios.delete('/domain-history/history/clear');
            
            if (response.data.success) {
                setHistory([]);
                toast.success('All history cleared');
            } else {
                toast.error('Failed to clear history');
            }
        } catch (error: unknown) {
            console.error('Failed to clear history:', error);
            toast.error('Failed to clear history');
        }
    }, []);

    const refreshHistory = useCallback(() => {
        loadHistory();
    }, [loadHistory]);

    // Auto-load history on mount
    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    return {
        // Data
        history,
        loading,
        error,
        
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
        isCacheValid: true, // No cache implementation, so always true
        cacheAge: null,
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
