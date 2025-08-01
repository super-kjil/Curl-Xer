import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { useDNSSettings } from '@/hooks/use-dns-settings';
import { DNSLoadingSkeleton } from '@/components/dns-loading-skeleton';
import { DNSCache } from '@/lib/dns-cache';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Domain Settings',
        href: '/domain-checker/settings',
    },
];
export default function DomainCheckerSettings() {
    const {
        settings,
        loading,
        saving,
        detecting,
        updateSettings,
        saveSettings,
        detectDNS,
        addCustomDNS,
        removeCustomDNS
    } = useDNSSettings();

    const handleRefreshSettings = () => {
        DNSCache.clear();
        window.location.reload();
    };
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check for dark mode preference
        const darkMode = localStorage.getItem('darkMode') === 'true';
        setIsDarkMode(darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode.toString());
        document.documentElement.classList.toggle('dark', newDarkMode);
    };

    const handleSave = async () => {
        await saveSettings();
    };

    const handleAddCustomDNS = () => {
        const newDNS = prompt('Enter DNS server IP address:');
        if (newDNS) {
            addCustomDNS(newDNS);
        }
    };

    if (loading) {
        return <DNSLoadingSkeleton />;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Domain Checker" />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-8 shadow-lg">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold flex items-center">
                                    <i className="fas fa-cog mr-3"></i> Settings
                                </h1>
                                <p className="mt-2 opacity-90">
                                    Configure DNS and application settings
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <a
                                    href="/domain-checker"
                                    className="text-white hover:text-gray-200 flex items-center"
                                    title="Back to Home"
                                >
                                    <i className="fas fa-globe text-xl"></i>
                                </a>
                                <button
                                    onClick={handleRefreshSettings}
                                    className="text-white hover:text-gray-200 focus:outline-none"
                                    title="Refresh Settings"
                                >
                                    <i className="fas fa-sync-alt text-xl"></i>
                                </button>
                                <button
                                    onClick={toggleDarkMode}
                                    className="text-white hover:text-gray-200 focus:outline-none"
                                    title="Toggle Dark Mode"
                                >
                                    <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-xl`}></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                                <i className="fas fa-server mr-2 text-blue-500"></i> DNS Settings
                            </h2>

                            <div className="space-y-6">
                                {/* Auto Detect DNS */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Auto-detect DNS
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Automatically detect system DNS settings
                                        </p>
                                    </div>
                                    <button
                                        onClick={detectDNS}
                                        disabled={detecting}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {detecting ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                                Detecting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-search mr-2"></i>
                                                Detect DNS
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Primary DNS */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Primary DNS
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.primary_dns}
                                        onChange={(e) => updateSettings({ primary_dns: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        placeholder="8.8.8.8"
                                    />
                                </div>

                                {/* Secondary DNS */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Secondary DNS
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.secondary_dns}
                                        onChange={(e) => updateSettings({ secondary_dns: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        placeholder="8.8.4.4"
                                    />
                                </div>

                                {/* Custom DNS Servers */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Custom DNS Servers
                                        </label>
                                        <button
                                            onClick={handleAddCustomDNS}
                                            className="text-blue-500 hover:text-blue-600 text-sm"
                                        >
                                            <i className="fas fa-plus mr-1"></i>
                                            Add
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {settings.custom_dns_servers.map((dns, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value={dns}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                />
                                                <button
                                                    onClick={() => removeCustomDNS(index)}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        ))}
                                        {settings.custom_dns_servers.length === 0 && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                No custom DNS servers added
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-gray-200 dark:border-gray-700" />

                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                    <i className="fas fa-tachometer-alt mr-2 text-blue-500"></i> Performance Settings
                                </h3>

                                {/* Batch Size */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Batch Size
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.batch_size}
                                        onChange={(e) => updateSettings({ batch_size: parseInt(e.target.value) || 100 })}
                                        min="1"
                                        max="1000"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Number of URLs to check in each batch
                                    </p>
                                </div>

                                {/* Timeout */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Timeout (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.timeout}
                                        onChange={(e) => updateSettings({ timeout: parseInt(e.target.value) || 30 })}
                                        min="5"
                                        max="120"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Maximum time to wait for each URL response
                                    </p>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save mr-2"></i>
                                                Save Settings
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 

