import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { compress, decompress } from 'lz-string';

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
    truncated?: boolean;
    totalItems?: number;
}

const CACHE_KEY = 'domain-checker-history-cache';
const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const CHUNK_SIZE = 100; // Store 100 items per chunk
const STORAGE_THRESHOLD = 500; // Use IndexedDB if more than 500 items
const COMPRESSION_THRESHOLD = 1000; // Compress if more than 1000 items

// IndexedDB implementation
class IndexedDBCache {
    private dbName = 'HistoryCacheDB';
    private storeName = 'cache';
    private version = 1;

    private async initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'key' });
                }
            };
        });
    }

    async set(key: string, value: unknown): Promise<void> {
        const db = await this.initDB();
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.put({ key, value, timestamp: Date.now() });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async get(key: string): Promise<unknown> {
        const db = await this.initDB();
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(key: string): Promise<void> {
        const db = await this.initDB();
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(): Promise<void> {
        const db = await this.initDB();
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

const dbCache = new IndexedDBCache();

export const useHistoryCache = () => {
    const [history, setHistory] = useState<GroupedHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<number | null>(null);

    // Smart cache loading with fallback
    const loadFromCache = useCallback(async (): Promise<GroupedHistoryItem[] | null> => {
        try {
            // Try localStorage first (for small datasets)
            const localCached = localStorage.getItem(CACHE_KEY);
            if (localCached) {
                const parsed: CachedHistory = JSON.parse(localCached);
                if (parsed.version === CACHE_VERSION && 
                    Date.now() - parsed.timestamp < CACHE_EXPIRY) {
                    
                    // Check if data was truncated
                    if (parsed.truncated) {
                        console.warn(`Cache data was truncated. Showing ${parsed.data.length} of ${parsed.totalItems} total items.`);
                        // You could show a toast notification here
                        toast.warning(`Showing cached data (${parsed.data.length} of ${parsed.totalItems} items). Refresh to load complete data.`);
                    }
                    
                    return parsed.data;
                }
            }

            // Try IndexedDB (for large datasets)
            const dbCached = await dbCache.get(CACHE_KEY);
            if (dbCached && dbCached.version === CACHE_VERSION && 
                Date.now() - dbCached.timestamp < CACHE_EXPIRY) {
                
                // Handle compressed data
                if (dbCached.compressed) {
                    try {
                        const decompressed = decompress(dbCached.data);
                        const parsed = JSON.parse(decompressed);
                        return parsed.data;
                    } catch (decompressError) {
                        console.warn('Failed to decompress cached data:', decompressError);
                        return null;
                    }
                }
                
                // Check if data was truncated
                if (dbCached.truncated) {
                    console.warn(`Cache data was truncated. Showing ${dbCached.data.length} of ${dbCached.totalItems} total items.`);
                    toast.warning(`Showing cached data (${dbCached.data.length} of ${dbCached.totalItems} items). Refresh to load complete data.`);
                }
                
                return dbCached.data;
            }

            return null;
        } catch (error) {
            console.warn('Failed to load from cache:', error);
            return null;
        }
    }, []);

    // Smart cache saving with compression and chunking
    const saveToCache = useCallback(async (data: GroupedHistoryItem[]) => {
        try {
            const cacheData: CachedHistory = {
                data,
                timestamp: Date.now(),
                version: CACHE_VERSION
            };

            if (data.length > STORAGE_THRESHOLD) {
                // Large dataset: Use IndexedDB with chunking and compression
                if (data.length > COMPRESSION_THRESHOLD) {
                    // Compress data for very large datasets
                    const compressed = compress(JSON.stringify(cacheData));
                    await dbCache.set(CACHE_KEY, { 
                        compressed: true, 
                        data: compressed,
                        version: CACHE_VERSION,
                        timestamp: Date.now()
                    });
                } else {
                    // Use IndexedDB without compression
                    await dbCache.set(CACHE_KEY, cacheData);
                }

                // Also save chunks for better performance
                await saveChunks(data);
            } else {
                // Small dataset: Use localStorage
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
                } catch {
                    // If localStorage fails, try IndexedDB even for small data
                    console.warn('localStorage failed, falling back to IndexedDB:');
                    await dbCache.set(CACHE_KEY, cacheData);
                }
            }
        } catch (error) {
            console.warn('Failed to save to cache:', error);
            // Try to save only essential data if everything fails
            try {
                // Save minimal data structure to avoid quota issues
                const minimalData = {
                    data: data.slice(0, 100), // Only save first 100 items
                    timestamp: Date.now(),
                    version: CACHE_VERSION,
                    truncated: true,
                    totalItems: data.length
                };
                
                // Try localStorage first
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(minimalData));
                } catch {
                    // If localStorage still fails, try IndexedDB
                    await dbCache.set(CACHE_KEY, minimalData);
                }
            } catch (fallbackError) {
                console.error('All cache save methods failed:', fallbackError);
                // At this point, we can't cache anything - user will need to reload from API
            }
        }
    }, [saveChunks]);

    // Save data in chunks for better performance
    const saveChunks = useCallback(async (data: GroupedHistoryItem[]) => {
        try {
            const chunks = [];
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                chunks.push(data.slice(i, i + CHUNK_SIZE));
            }

            // Store chunk metadata
            const chunkMeta = {
                totalChunks: chunks.length,
                timestamp: Date.now(),
                version: CACHE_VERSION
            };
            await dbCache.set(`${CACHE_KEY}_chunks_meta`, chunkMeta);

            // Store each chunk
            for (let i = 0; i < chunks.length; i++) {
                await dbCache.set(`${CACHE_KEY}_chunk_${i}`, chunks[i]);
            }
        } catch (error) {
            console.warn('Failed to save chunks:', error);
        }
    }, []);

    // Clear all cache types
    const clearCache = useCallback(async () => {
        try {
            // Clear localStorage
            localStorage.removeItem(CACHE_KEY);
            
            // Clear IndexedDB
            await dbCache.clear();
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
    }, []);

    // Clear old cache data to prevent quota issues
    const clearOldCache = useCallback(async () => {
        try {
            // Clear localStorage
            localStorage.removeItem(CACHE_KEY);
            
            // Clear IndexedDB
            await dbCache.clear();
            
            console.log('Old cache cleared to prevent quota issues');
        } catch (error) {
            console.warn('Failed to clear old cache:', error);
        }
    }, []);

    // Check if cache is valid
    const isCacheValid = useCallback((): boolean => {
        if (!lastFetched) return false;
        return Date.now() - lastFetched < CACHE_EXPIRY;
    }, [lastFetched]);

    // Load history data with smart caching
    const loadHistory = useCallback(async (forceRefresh = false) => {
        // Try to load from cache first
        if (!forceRefresh) {
            const cachedData = await loadFromCache();
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
                await saveToCache(historyData);
                setError(null);
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
                await saveToCache(updatedHistory);
                toast.success('History item deleted');
            } else {
                toast.error('Failed to delete history item');
            }
        } catch (error: unknown) {
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
                await clearCache();
                toast.success('All history cleared');
            } else {
                toast.error('Failed to clear history');
            }
        } catch (error: unknown) {
            console.error('Failed to clear history:', error);
            toast.error('Failed to clear history');
        }
    }, [clearCache]);

    // Refresh history (force reload)
    const refreshHistory = useCallback(async () => {
        await clearCache();
        loadHistory(true);
    }, [clearCache, loadHistory]);

    // Initialize with cached data on mount
    useEffect(() => {
        const initializeCache = async () => {
            const cachedData = await loadFromCache();
            if (cachedData) {
                setHistory(cachedData);
                setLastFetched(Date.now());
            } else {
                loadHistory();
            }
        };

        initializeCache();
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
        clearOldCache,
    };
};
