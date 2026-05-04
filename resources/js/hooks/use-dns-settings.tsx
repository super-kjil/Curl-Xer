import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface DNSSettings {
    primary_dns: string;
    secondary_dns: string;
    batch_size: number;
    large_batch_size: number;
    timeout: number;
    auto_detect_dns: boolean;
    dns_source?: 'server' | 'user';
}

interface ServerDNSInfo {
    primary: string;
    secondary: string;
}

interface CacheInfo {
    cached: boolean;
    cache_duration: string;
}

interface UseDNSSettingsReturn {
    settings: DNSSettings;
    loading: boolean;
    saving: boolean;
    detecting: boolean;
    refreshing: boolean;
    serverDNS: ServerDNSInfo | null;
    cacheInfo: CacheInfo | null;
    updateSettings: (newSettings: Partial<DNSSettings>) => void;
    saveSettings: () => Promise<void>;
    detectDNS: () => Promise<void>;
    refreshServerDNS: () => Promise<void>;
}

export function useDNSSettings(): UseDNSSettingsReturn {
    const [settings, setSettings] = useState<DNSSettings>({
        primary_dns: '8.8.8.8',
        secondary_dns: '1.1.1.1',
        batch_size: 100,
        large_batch_size: 1000,
        timeout: 30,
        auto_detect_dns: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [serverDNS, setServerDNS] = useState<ServerDNSInfo | null>(null);
    const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);

    // Load settings with server DNS caching info
    const loadSettings = async () => {
        setLoading(true);
        
        try {
            const response = await axios.get('/domain-checker/settings/get');
            if (response.data.success) {
                const serverSettings = response.data.settings;
                // Ensure we have default values if server settings are incomplete
                const completeSettings = {
                    primary_dns: serverSettings.primary_dns || '8.8.8.8',
                    secondary_dns: serverSettings.secondary_dns || '1.1.1.1',
                    batch_size: serverSettings.batch_size || 100,
                    large_batch_size: serverSettings.large_batch_size || 1000,
                    timeout: serverSettings.timeout || 30,
                    auto_detect_dns: serverSettings.auto_detect_dns !== undefined ? serverSettings.auto_detect_dns : true,
                    dns_source: serverSettings.dns_source || 'server'
                };
                setSettings(completeSettings);
                
                // Set server DNS info
                if (response.data.server_dns) {
                    setServerDNS(response.data.server_dns);
                }
                
                // Set cache info
                if (response.data.cache_info) {
                    setCacheInfo(response.data.cache_info);
                }
            }
        } catch (error: unknown) {
            console.error('Failed to load DNS settings:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load DNS settings';
            toast.error('Error', {
                className: 'warning-toast',
                description: errorMessage,
            });
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
                toast.success('Successfully', {
                    className: 'success-toast',
                    description: 'DNS settings saved successfully',
                });
            } else {
                toast.error('Error', {
                    className: 'warning-toast',
                    description: response.data.message || 'Failed to save DNS settings',
                });
            }
        } catch (error: unknown) {
            console.error('Failed to save DNS settings:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save DNS settings';
            toast.error('Error', {
                className: 'warning-toast',
                description: errorMessage,
            });
        } finally {
            setSaving(false);
        }
    };

    // Detect DNS from server (clears cache and gets fresh)
    const detectDNS = async () => {
        setDetecting(true);
        try {
            const response = await axios.get('/domain-checker/settings/detect-dns');
            if (response.data.success) {
                // Update server DNS info
                if (response.data.dns) {
                    setServerDNS(response.data.dns);
                    // Update settings with new DNS
                    setSettings(prev => ({
                        ...prev,
                        primary_dns: response.data.dns.primary || '8.8.8.8',
                        secondary_dns: response.data.dns.secondary || '1.1.1.1'
                    }));
                }
                
                // Update cache info
                setCacheInfo({
                    cached: true,
                    cache_duration: response.data.cache_duration || '15 minutes'
                });
                
                toast.success('Successfully', {
                    className: 'success-toast',
                    description: response.data.message || 'Server DNS settings detected successfully',
                });
                if (response.data.note) {
                    toast.info('Info', {
                        className: 'info-toast',
                        descriptionClassName: 'info-toast-description',
                        description: response.data.note,
                    });
                }
            } else {
                toast.error('Error', {
                    className: 'warning-toast',
                    description: 'Failed to detect DNS settings',
                });
            }
        } catch (error: unknown) {
            console.error('Failed to detect DNS:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to detect DNS settings';
            toast.error('Error', {
                className: 'warning-toast',
                description: errorMessage,
            });
        } finally {
            setDetecting(false);
        }
    };

    // Refresh server DNS cache
    const refreshServerDNS = async () => {
        setRefreshing(true);
        try {
            const response = await axios.post('/domain-checker/settings/refresh-server-dns');
            if (response.data.success) {
                // Update server DNS info
                if (response.data.dns) {
                    setServerDNS(response.data.dns);
                    // Update settings with refreshed DNS
                    setSettings(prev => ({
                        ...prev,
                        primary_dns: response.data.dns.primary || '8.8.8.8',
                        secondary_dns: response.data.dns.secondary || '1.1.1.1'
                    }));
                }
                
                // Update cache info
                setCacheInfo({
                    cached: true,
                    cache_duration: '15 minutes'
                });
                
                toast.success('Successfully', {
                    className: 'success-toast',
                    description: response.data.message || 'Server DNS cache refreshed successfully',
                });
            } else {
                toast.error('Error', {
                    className: 'warning-toast',
                    description: 'Failed to refresh server DNS cache',
                });
            }
        } catch (error: unknown) {
            console.error('Failed to refresh server DNS:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh server DNS cache';
            toast.error('Error', {
                className: 'warning-toast',
                description: errorMessage,
            });
        } finally {
            setRefreshing(false);
        }
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
        refreshing,
        serverDNS,
        cacheInfo,
        updateSettings,
        saveSettings,
        detectDNS,
        refreshServerDNS
    };
}