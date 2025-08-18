import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

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

interface HistoryState {
    // Data
    history: GroupedHistoryItem[];
    lastFetched: number | null;
    
    // UI State
    loading: boolean;
    error: string | null;
    
    // Pagination/Caching
    page: number;
    hasMore: boolean;
    cacheExpiry: number; // 5 minutes default
    
    // Actions
    setHistory: (history: GroupedHistoryItem[]) => void;
    addHistoryItem: (item: GroupedHistoryItem) => void;
    updateHistoryItem: (command: string, updates: Partial<GroupedHistoryItem>) => void;
    removeHistoryItem: (command: string) => void;
    clearHistory: () => void;
    
    // Fetching
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setLastFetched: (timestamp: number) => void;
    
    // Pagination
    setPage: (page: number) => void;
    setHasMore: (hasMore: boolean) => void;
    
    // Computed values
    getHistoryByCommand: (command: string) => GroupedHistoryItem | undefined;
    getAccessibleDomains: (command: string) => BatchResult[];
    getInaccessibleDomains: (command: string) => BatchResult[];
    getTotalUrls: () => number;
    getAverageSuccessRate: () => number;
    
    // Cache management
    isCacheValid: () => boolean;
    invalidateCache: () => void;
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useHistoryStore = create<HistoryState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                history: [],
                lastFetched: null,
                loading: false,
                error: null,
                page: 1,
                hasMore: true,
                cacheExpiry: CACHE_EXPIRY,
                
                // Actions
                setHistory: (history) => set({ 
                    history, 
                    lastFetched: Date.now(),
                    error: null 
                }),
                
                addHistoryItem: (item) => set((state) => ({
                    history: [item, ...state.history]
                })),
                
                updateHistoryItem: (command, updates) => set((state) => ({
                    history: state.history.map(item => 
                        item.command === command 
                            ? { ...item, ...updates }
                            : item
                    )
                })),
                
                removeHistoryItem: (command) => set((state) => ({
                    history: state.history.filter(item => item.command !== command)
                })),
                
                clearHistory: () => set({ 
                    history: [], 
                    lastFetched: null,
                    page: 1,
                    hasMore: true 
                }),
                
                setLoading: (loading) => set({ loading }),
                setError: (error) => set({ error }),
                setLastFetched: (timestamp) => set({ lastFetched: timestamp }),
                setPage: (page) => set({ page }),
                setHasMore: (hasMore) => set({ hasMore }),
                
                // Computed values
                getHistoryByCommand: (command) => {
                    const state = get();
                    return state.history.find(item => item.command === command);
                },
                
                getAccessibleDomains: (command) => {
                    const state = get();
                    const item = state.getHistoryByCommand(command);
                    if (!item) return [];
                    
                    return item.batches.flatMap(batch => 
                        batch.results?.filter(result => result.accessible) || []
                    );
                },
                
                getInaccessibleDomains: (command) => {
                    const state = get();
                    const item = state.getHistoryByCommand(command);
                    if (!item) return [];
                    
                    return item.batches.flatMap(batch => 
                        batch.results?.filter(result => !result.accessible) || []
                    );
                },
                
                getTotalUrls: () => {
                    const state = get();
                    return state.history.reduce((total, item) => total + item.totalUrls, 0);
                },
                
                getAverageSuccessRate: () => {
                    const state = get();
                    if (state.history.length === 0) return 0;
                    
                    const totalRate = state.history.reduce((sum, item) => sum + item.avgSuccessRate, 0);
                    return Math.round(totalRate / state.history.length);
                },
                
                // Cache management
                isCacheValid: () => {
                    const state = get();
                    if (!state.lastFetched) return false;
                    
                    const now = Date.now();
                    const cacheAge = now - state.lastFetched;
                    return cacheAge < state.cacheExpiry;
                },
                
                invalidateCache: () => set({ lastFetched: null }),
            }),
            {
                name: 'domain-checker-history',
                // Only persist essential data, not UI state
                partialize: (state) => ({
                    history: state.history,
                    lastFetched: state.lastFetched,
                    cacheExpiry: state.cacheExpiry,
                }),
            }
        ),
        {
            name: 'history-store',
        }
    )
);

// Selector hooks for better performance
export const useHistoryData = () => useHistoryStore((state) => state.history);
export const useHistoryLoading = () => useHistoryStore((state) => state.loading);
export const useHistoryError = () => useHistoryStore((state) => state.error);
export const useHistoryStats = () => useHistoryStore((state) => ({
    totalUrls: state.getTotalUrls(),
    averageSuccessRate: state.getAverageSuccessRate(),
    itemCount: state.history.length,
}));
