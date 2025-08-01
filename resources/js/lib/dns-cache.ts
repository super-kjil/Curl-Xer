const STORAGE_KEY = 'dns_settings_cache';

export const DNSCache = {
    /**
     * Clear the DNS settings cache
     */
    clear: () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('DNS settings cache cleared');
        } catch (error) {
            console.error('Failed to clear DNS settings cache:', error);
        }
    },

    /**
     * Check if cache exists and is valid
     */
    isValid: (): boolean => {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                const { timestamp } = JSON.parse(cached);
                const now = Date.now();
                const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
                return now - timestamp < CACHE_DURATION;
            }
        } catch (error) {
            console.error('Failed to check DNS cache validity:', error);
        }
        return false;
    },

    /**
     * Get cached DNS settings
     */
    get: () => {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const now = Date.now();
                const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
                
                if (now - timestamp < CACHE_DURATION) {
                    return data;
                }
            }
        } catch (error) {
            console.error('Failed to get cached DNS settings:', error);
        }
        return null;
    },

    /**
     * Set DNS settings cache
     */
    set: (data: any) => {
        try {
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Failed to set DNS settings cache:', error);
        }
    }
}; 