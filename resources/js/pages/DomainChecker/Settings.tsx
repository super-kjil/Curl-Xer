import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useDNSSettings } from '@/hooks/use-dns-settings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
    } = useDNSSettings();




    // Safety check for null settings
    if (!settings) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="DNS Settings" />
                <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
                    <div className="container mx-auto px-4 py-8">
                        <div className="rounded-lg bg-white p-6 shadow-lg ">
                            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Settings Not Available</h2>
                            <p className="text-gray-600 dark:text-gray-400">DNS settings are not available. Please try refreshing the page.</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="DNS Settings" />

            <div className="min-h-screen">
                {/* Header */}
                <div className="py-8">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="flex items-center text-3xl font-bold">
                                    <Settings className='mr-2' />DNS  Settings
                                </h1>
                                <p className="mt-2 opacity-90">Configure DNS and application settings</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="mx-auto max-w-3xl">

                        <Card className="p-6 shadow-lg ">
                            <h2 className="mb-6 flex items-center text-xl font-semibold text-gray-800 dark:text-gray-100">
                            <Settings className='mr-2' />Settings
                            </h2>

                            <div className="space-y-6">
                                {/* Server DNS Detection */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium  dark:text-gray-300">
                                            Auto detect DNS server
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Detect and cache DNS settings from the server
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={refreshServerDNS}
                                            disabled={refreshing}
                                            title="Refresh DNS cache"
                                        >
                                            {refreshing ? <>Refreshing...</> : <>Refresh Cache</>}
                                        </Button>
                                        <Button
                                            onClick={detectDNS}
                                            disabled={detecting}
                                        >
                                            {detecting ? <>Detecting...</> : <>Detect DNS</>}
                                        </Button>
                                    </div>
                                </div>

                                {/* Primary DNS (Read-only for server DNS) */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium ">Primary DNS (Server)</label>
                                    <Input
                                        value={settings.primary_dns || ''}
                                        className="cursor-not-allowed"
                                        placeholder="Detected from server"
                                        readOnly
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        This DNS is automatically detected from the server and shared by all team members
                                    </p>
                                </div>

                                {/* Secondary DNS (Read-only for server DNS) */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium ">Secondary DNS (Server)</label>
                                    <Input
                                        type="text"
                                        value={settings.secondary_dns || ''}
                                        className="cursor-not-allowed"
                                        placeholder="Detected from server"
                                        readOnly
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Secondary DNS server from the same network configuration
                                    </p>
                                </div>                                

                                {/* Batch Size */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium ">Batch Size</label>
                                    <Input
                                        type="number"
                                        value={settings.batch_size || 100}
                                        onChange={(e) => updateSettings({ batch_size: parseInt(e.target.value) || 100 })}
                                        min="1"
                                        max="1000"
                                        // className="w-full cursor-not-allowed rounded-lg border px-4 py-2"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Number of URLs to check in each batch (recommended: 100-500 for small sets, 500-1000 for large sets)
                                    </p>
                                </div>

                                {/* Large URL Batch Size */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium ">Large URL Batch Size</label>
                                    <Input
                                        type="number"
                                        value={settings.large_batch_size || 1000}
                                        onChange={(e) => updateSettings({ large_batch_size: parseInt(e.target.value) || 1000 })}
                                        min="500"
                                        max="2000"
                                        // className="w-full cursor-not-allowed rounded-lg border px-4 py-2"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Batch size for URL sets with 10,000+ URLs (recommended: 1000 for optimal performance)
                                    </p>
                                </div>

                                {/* Timeout */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium ">Timeout (seconds)</label>
                                    <Input
                                        type="number"
                                        value={settings.timeout || 30}
                                        onChange={(e) => updateSettings({ timeout: parseInt(e.target.value) || 30 })}
                                        min="5"
                                        max="120"
                                        // className="w-full cursor-not-allowed rounded-lg border px-4 py-2"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maximum time to wait for each URL response</p>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={saveSettings}
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
