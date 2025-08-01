import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface DNSSettings {
    primary_dns: string;
    secondary_dns: string;
    batch_size: number;
    timeout: number;
    auto_detect_dns: boolean;
    custom_dns_servers: string[];
}

interface UseDNSSettingsReturn {
    settings: DNSSettings;
    loading: boolean;
    saving: boolean;
    detecting: boolean;
    updateSettings: (newSettings: Partial<DNSSettings>) => void;
    saveSettings: () => Promise<void>;
    detectDNS: () => Promise<void>;
    addCustomDNS: (dns: string) => void;
    removeCustomDNS: (index: number) => void;
}

const STORAGE_KEY = 'dns_settings_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useDNSSettings(): UseDNSSettingsReturn {
    const [settings, setSettings] = useState<DNSSettings>({
        primary_dns: '',
        secondary_dns: '',
        batch_size: 100,
        timeout: 30,
        auto_detect_dns: true,
        custom_dns_servers: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [detecting, setDetecting] = useState(false);

    // Load cached settings from localStorage
    const loadCachedSettings = (): DNSSettings | null => {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const now = Date.now();
                
                // Check if cache is still valid
                if (now - timestamp < CACHE_DURATION) {
                    return data;
                }
            }
        } catch (error) {
            console.error('Failed to load cached DNS settings:', error);
        }
        return null;
    };

    // Save settings to localStorage cache
    const saveCachedSettings = (data: DNSSettings) => {
        try {
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Failed to save cached DNS settings:', error);
        }
    };

    // Load settings from server or cache
    const loadSettings = async () => {
        setLoading(true);
        
        try {
            // First try to load from cache
            const cachedSettings = loadCachedSettings();
            
            if (cachedSettings) {
                setSettings(cachedSettings);
                setLoading(false);
                return;
            }

            // If no cache or expired, load from server
            const response = await axios.get('/domain-checker/settings/get');
            if (response.data.success) {
                const serverSettings = response.data.settings;
                setSettings(serverSettings);
                saveCachedSettings(serverSettings);
            }
        } catch (error) {
            console.error('Failed to load DNS settings:', error);
            toast.error('Failed to load DNS settings');
        } finally {
            setLoading(false);
        }
    };

    // Update settings locally
    const updateSettings = (newSettings: Partial<DNSSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    // Save settings to server
    const saveSettings = async () => {
        setSaving(true);
        try {
            const response = await axios.post('/domain-checker/settings', settings);
            if (response.data.success) {
                saveCachedSettings(settings);
                toast.success('DNS settings saved successfully');
            } else {
                toast.error(response.data.message || 'Failed to save DNS settings');
            }
        } catch (error: any) {
            console.error('Failed to save DNS settings:', error);
            toast.error(error.response?.data?.message || 'Failed to save DNS settings');
        } finally {
            setSaving(false);
        }
    };

    // Detect DNS from server
    const detectDNS = async () => {
        setDetecting(true);
        try {
            const response = await axios.get('/domain-checker/settings/detect-dns');
            if (response.data.success) {
                // Use the settings returned from server (which includes the saved data)
                const serverSettings = response.data.settings;
                setSettings(serverSettings);
                saveCachedSettings(serverSettings);
                toast.success(response.data.message || 'DNS settings detected and saved successfully');
            } else {
                toast.error('Failed to detect DNS settings');
            }
        } catch (error: any) {
            console.error('Failed to detect DNS:', error);
            toast.error(error.response?.data?.message || 'Failed to detect DNS settings');
        } finally {
            setDetecting(false);
        }
    };

    // Add custom DNS server
    const addCustomDNS = (dns: string) => {
        if (dns && /^(\d{1,3}\.){3}\d{1,3}$/.test(dns)) {
            const newSettings = {
                ...settings,
                custom_dns_servers: [...settings.custom_dns_servers, dns]
            };
            setSettings(newSettings);
            saveCachedSettings(newSettings);
            toast.success('Custom DNS server added');
        } else {
            toast.error('Invalid DNS server format');
        }
    };

    // Remove custom DNS server
    const removeCustomDNS = (index: number) => {
        const newSettings = {
            ...settings,
            custom_dns_servers: settings.custom_dns_servers.filter((_, i) => i !== index)
        };
        setSettings(newSettings);
        saveCachedSettings(newSettings);
        toast.success('Custom DNS server removed');
    };

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    return {
        settings,
        loading,
        saving,
        detecting,
        updateSettings,
        saveSettings,
        detectDNS,
        addCustomDNS,
        removeCustomDNS
    };
} 