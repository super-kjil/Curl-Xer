import { useState, useEffect } from 'react';
import axios from 'axios';

interface DNSServers {
    primary_dns: string;
    secondary_dns: string;
    dns_source: string;
}

interface UseDNSServersReturn {
    dnsServers: DNSServers;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useDNSServers(): UseDNSServersReturn {
    const [dnsServers, setDnsServers] = useState<DNSServers>({
        primary_dns: '8.8.8.8',
        secondary_dns: '1.1.1.1',
        dns_source: 'default'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDNSServers = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get('/domain-checker/dns-servers');
            if (response.data.success) {
                setDnsServers({
                    primary_dns: response.data.primary_dns || '8.8.8.8',
                    secondary_dns: response.data.secondary_dns || '1.1.1.1',
                    dns_source: response.data.dns_source || 'server'
                });
            } else {
                setError(response.data.message || 'Failed to load DNS servers');
            }
        } catch (error: unknown) {
            console.error('Failed to load DNS servers:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load DNS servers';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const refresh = async () => {
        await loadDNSServers();
    };

    // Load DNS servers on mount
    useEffect(() => {
        loadDNSServers();
    }, []);

    return {
        dnsServers,
        loading,
        error,
        refresh
    };
}
