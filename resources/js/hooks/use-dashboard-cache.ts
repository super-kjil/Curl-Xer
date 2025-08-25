import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface ChartData {
    name: string;
    success_rate: number;
    url_count: number;
    success_urls: number;
    failed_urls: number;
    checks: number;
}

interface DashboardStats {
    total_checks: number;
    avg_success_rate: number;
    total_urls: number;
}

interface CachedDashboard {
    data: ChartData[];
    stats: DashboardStats;
    timestamp: number;
    version: string;
    filter: string;
    startDate?: string;
    endDate?: string;
}

const CACHE_KEY = 'domain-checker-dashboard-cache';
const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes (longer than history since dashboard data changes less frequently)

export const useDashboardCache = () => {
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        total_checks: 0,
        avg_success_rate: 0,
        total_urls: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<number | null>(null);
    const [currentFilter, setCurrentFilter] = useState<string>('7days');
    const [currentStartDate, setCurrentStartDate] = useState<string | undefined>();
    const [currentEndDate, setCurrentEndDate] = useState<string | undefined>();

    // Load cached data from localStorage
    const loadFromCache = useCallback((filter: string, startDate?: string, endDate?: string): CachedDashboard | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const parsed: CachedDashboard = JSON.parse(cached);
            
            // Check if cache is valid
            if (parsed.version !== CACHE_VERSION) return null;
            if (Date.now() - parsed.timestamp > CACHE_EXPIRY) return null;
            
            // Check if filter matches
            if (parsed.filter !== filter) return null;
            if (filter === 'custom') {
                if (parsed.startDate !== startDate || parsed.endDate !== endDate) return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }, []);

    // Save data to cache
    const saveToCache = useCallback((data: ChartData[], stats: DashboardStats, filter: string, startDate?: string, endDate?: string) => {
        try {
            const cacheData: CachedDashboard = {
                data,
                stats,
                timestamp: Date.now(),
                version: CACHE_VERSION,
                filter,
                startDate,
                endDate,
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save dashboard to cache:', error);
        }
    }, []);

    // Clear cache
    const clearCache = useCallback(() => {
        try {
            localStorage.removeItem(CACHE_KEY);
        } catch (error) {
            console.warn('Failed to clear dashboard cache:', error);
        }
    }, []);

    // Check if cache is valid
    const isCacheValid = useCallback((): boolean => {
        if (!lastFetched) return false;
        return Date.now() - lastFetched < CACHE_EXPIRY;
    }, [lastFetched]);

    // Load dashboard data
    const loadChartData = useCallback(async (filter: string, startDate?: string, endDate?: string, forceRefresh = false) => {
        // Try to load from cache first
        if (!forceRefresh) {
            const cachedData = loadFromCache(filter, startDate, endDate);
            if (cachedData) {
                setChartData(cachedData.data);
                setStats(cachedData.stats);
                setLastFetched(Date.now());
                setCurrentFilter(filter);
                setCurrentStartDate(startDate);
                setCurrentEndDate(endDate);
                setError(null);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const params: Record<string, string | undefined> = { filter };
            
            if (filter === 'custom' && startDate && endDate) {
                params.start_date = startDate;
                params.end_date = endDate;
            }

            const response = await axios.get('/domain-history/history/chart-data', { params });
            
            if (response.data.success) {
                const newChartData = response.data.data;
                const newStats = {
                    total_checks: response.data.total_checks,
                    avg_success_rate: response.data.avg_success_rate,
                    total_urls: response.data.total_urls,
                };

                setChartData(newChartData);
                setStats(newStats);
                setLastFetched(Date.now());
                setCurrentFilter(filter);
                setCurrentStartDate(startDate);
                setCurrentEndDate(endDate);
                
                // Save to cache
                saveToCache(newChartData, newStats, filter, startDate, endDate);
                setError(null);
            } else {
                setError('Failed to load dashboard data');
                toast.error('Failed to load dashboard data');
            }
        } catch (error: unknown) {
            console.error('Failed to load dashboard data:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            setError(errorMessage);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [loadFromCache, saveToCache]);

    // Refresh dashboard data (force reload)
    const refreshDashboard = useCallback(() => {
        clearCache();
        loadChartData(currentFilter, currentStartDate, currentEndDate, true);
    }, [clearCache, loadChartData, currentFilter, currentStartDate, currentEndDate]);

    // Initialize with cached data on mount
    useEffect(() => {
        const cachedData = loadFromCache('7days');
        if (cachedData) {
            setChartData(cachedData.data);
            setStats(cachedData.stats);
            setLastFetched(Date.now());
            setCurrentFilter(cachedData.filter);
            setCurrentStartDate(cachedData.startDate);
            setCurrentEndDate(cachedData.endDate);
        } else {
            loadChartData('7days');
        }
    }, [loadFromCache, loadChartData]);

    // Computed values
    const successRateData = useMemo(() => 
        chartData.map(item => ({
            name: item.name,
            value: item.success_rate,
        })), [chartData]);

    const urlCountData = useMemo(() => 
        chartData.map(item => ({
            name: item.name,
            value: item.url_count,
        })), [chartData]);

    const checksData = useMemo(() => 
        chartData.map(item => ({
            name: item.name,
            value: item.checks,
        })), [chartData]);

    const cacheInfo = useMemo(() => ({
        isCacheValid: isCacheValid(),
        cacheAge: lastFetched ? Date.now() - lastFetched : null,
        cacheExpiry: CACHE_EXPIRY,
        currentFilter,
        currentStartDate,
        currentEndDate,
    }), [isCacheValid, lastFetched, currentFilter, currentStartDate, currentEndDate]);

    return {
        // Data
        chartData,
        stats,
        loading,
        error,
        lastFetched,
        
        // Actions
        loadChartData,
        refreshDashboard,
        
        // Computed chart data
        successRateData,
        urlCountData,
        checksData,
        
        // Cache info
        cacheInfo,
        
        // Cache management
        isCacheValid: isCacheValid(),
        clearCache,
    };
};
