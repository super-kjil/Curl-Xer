import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useDNSSettings } from '@/hooks/use-dns-settings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, SquareActivity } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Domain Settings',
        href: '/domain-checker/settings',
    },
];
export default function DomainCheckerSettings() {
    const {
        settings,
        saving,
        detecting,
        refreshing,
        updateSettings,
        saveSettings,
        detectDNS,
        refreshServerDNS,
        addCustomDNS,
        removeCustomDNS,
    } = useDNSSettings();

    const handleSave = async () => {
        await saveSettings();
    };

    const handleAddCustomDNS = () => {
        const newDNS = prompt('Enter DNS server IP address:');
        if (newDNS) {
            addCustomDNS(newDNS);
        }
    };

    // if (loading) {
    //     return <DNSLoadingSkeleton />;
    // }

    // Safety check for null settings
    if (!settings) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Domain Checker" />
                <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
                    <div className="container mx-auto px-4 py-8">
                        <div className="rounded-lg bg-white p-6 shadow-lg ">
                            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Settings Not Available</h2>
                            <p className="text-gray-600 dark:text-gray-400">DNS settings are not available. Please try refreshing the page.</p>
                            {/* <button onClick={handleRefreshSettings} className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                                Refresh Settings
                            </button> */}
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Domain Checker" />

            <div className="min-h-screen">
                {/* Header */}
                <div className="py-8">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="flex items-center text-3xl font-bold">
                                    <Settings className='mr-2'/>  Settings
                                </h1>
                                <p className="mt-2 opacity-90">Configure DNS and application settings</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="mx-auto max-w-2xl">
                        {/* Server DNS Info Banner */}
                        {/* <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <i className="fas fa-server mr-3 text-lg text-blue-500"></i>
                                    <div className='flex items-center'>
                                        <p className="text-sm text-blue-600 dark:text-blue-300">
                                            Primary: <span className="font-mono font-semibold">{settings.primary_dns}</span> | 
                                            Secondary: <span className="font-mono font-semibold">{settings.secondary_dns}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div> */}

                        <Card className="rounded-xl  p-6 shadow-2xl ">
                            <h2 className="mb-6 flex items-center text-xl font-semibold text-gray-800 dark:text-gray-100">
                                DNS Settings
                            </h2>

                            <div className="space-y-6">
                                {/* Server DNS Detection */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Detect Server DNS</label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Detect and cache DNS settings from the server
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={refreshServerDNS}
                                            disabled={refreshing}
                                            // className="rounded-lg bg-green-500 py-2 text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            title="Refresh DNS cache"
                                        >
                                            {refreshing ? <>Refreshing...</> : <>Refresh Cache</>}
                                        </Button>
                                        <Button
                                            onClick={detectDNS}
                                            disabled={detecting}
                                            // className="rounded-lg bg-blue-500 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {detecting ? <>Detecting...</> : <>Detect Fresh</>}
                                        </Button>
                                    </div>
                                </div>

                                {/* Primary DNS (Read-only for server DNS) */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Primary DNS (Server)</label>
                                    <input
                                        type="text"
                                        value={settings.primary_dns || ''}
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-lg border px-4 py-2"
                                        placeholder="Detected from server"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        This DNS is automatically detected from the server and shared by all team members
                                    </p>
                                </div>

                                {/* Secondary DNS (Read-only for server DNS) */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Secondary DNS (Server)</label>
                                    <input
                                        type="text"
                                        value={settings.secondary_dns || ''}
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-lg border px-4 py-2"
                                        placeholder="Detected from server"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Secondary DNS server from the same network configuration
                                    </p>
                                </div>

                                {/* Custom DNS Servers */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom DNS Servers</label>
                                        <button onClick={handleAddCustomDNS} className="text-sm text-blue-500 hover:text-blue-600">
                                            <i className="fas fa-plus mr-1"></i>
                                            Add
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {(settings.custom_dns_servers || []).map((dns, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value={dns}
                                                    readOnly
                                                    className="w-full cursor-not-allowed rounded-lg border px-4 py-2"
                                                />
                                                <button onClick={() => removeCustomDNS(index)} className="text-red-500 hover:text-red-600">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        ))}
                                        {(settings.custom_dns_servers || []).length === 0 && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No custom DNS servers added</p>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-gray-200 dark:border-gray-700" />

                                <h3 className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-100">
                                    <SquareActivity className='mr-2'/> Performance Settings
                                </h3>

                                {/* Batch Size */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Batch Size</label>
                                    <input
                                        type="number"
                                        value={settings.batch_size || 100}
                                        onChange={(e) => updateSettings({ batch_size: parseInt(e.target.value) || 100 })}
                                        min="1"
                                        max="1000"
                                        className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Number of URLs to check in each batch (recommended: 100-500 for small sets, 500-1000 for large sets)
                                    </p>
                                </div>

                                {/* Large URL Batch Size */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Large URL Batch Size</label>
                                    <input
                                        type="number"
                                        value={settings.large_batch_size || 1000}
                                        onChange={(e) => updateSettings({ large_batch_size: parseInt(e.target.value) || 1000 })}
                                        min="500"
                                        max="2000"
                                        className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Batch size for URL sets with 10,000+ URLs (recommended: 1000 for optimal performance)
                                    </p>
                                </div>

                                {/* Timeout */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Timeout (seconds)</label>
                                    <input
                                        type="number"
                                        value={settings.timeout || 30}
                                        onChange={(e) => updateSettings({ timeout: parseInt(e.target.value) || 30 })}
                                        min="5"
                                        max="120"
                                        className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maximum time to wait for each URL response</p>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        // className="rounded-lg bg-blue-500 px-6 py-2 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                {/* <i className="fas fa-spinner fa-spin mr-2"></i> */}
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                {/* <i className="fas fa-save mr-2"></i> */}
                                                Save Settings
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
