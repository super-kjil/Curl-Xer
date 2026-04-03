import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { PermissionGate } from '@/components/permission-gate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Copy } from 'lucide-react';
import React, { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

interface ComparisonResult {
    missing_in_list1: string[];
    missing_in_list2: string[];
    missing_in_list1_count: number;
    missing_in_list2_count: number;
    list1_count: number;
    list2_count: number;
}

export default function DomainComparerPage() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Domain Comparer',
            href: '/domain-comparer',
        },
    ];

    const [list1Content, setList1Content] = useState('');
    const [list2Content, setList2Content] = useState('');
    const [list1File, setList1File] = useState<File | null>(null);
    const [list2File, setList2File] = useState<File | null>(null);
    const [results, setResults] = useState<ComparisonResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [list1Tab, setList1Tab] = useState('paste');
    const [list2Tab, setList2Tab] = useState('paste');

    const list1FileRef = useRef<HTMLInputElement>(null);
    const list2FileRef = useRef<HTMLInputElement>(null);

    const handleCompare = async () => {
        setError('');
        setResults(null);

        if ((!list1Content && !list1File) || (!list2Content && !list2File)) {
            toast.error('Warning',{
                className: 'warning-toast',
                description: 'Please provide at least one domain in each list, either by pasting or uploading a file.',
            });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('list1_content', list1Content);
        formData.append('list2_content', list2Content);
        if (list1File) {
            formData.append('list1_file', list1File);
        }
        if (list2File) {
            formData.append('list2_file', list2File);
        }

        try {
            const response = await axios.post('/domain-comparer/compare', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setResults(response.data);
                toast.success('Successfully', {
                    className: 'success-toast',
                    description: 'Domains compared successfully',
                });
            } else {
                throw new Error(response.data.message || 'Failed to compare domains');
            }
        } catch (err) {
            const message = axios.isAxiosError(err) 
                ? err.response?.data?.message || err.message
                : err instanceof Error ? err.message : 'An error occurred';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (domains: string[], listName: string) => {
        const text = domains.join('\n');
        
        // Try Clipboard API first (modern browsers)
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                toast.success('Successfully', {
                    className: 'success-toast',
                    description: `Copied ${domains.length} domains from ${listName} to clipboard`,
                });
            }).catch(() => {
                fallbackCopy(text, domains.length, listName);
            });
        } else {
            // Fallback for non-HTTPS or older browsers
            fallbackCopy(text, domains.length, listName);
        }
    };

    const fallbackCopy = (text: string, count: number, listName: string) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        
        try {
            textarea.select();
            document.execCommand('copy');
            toast.success('Successfully', {
                className: 'success-toast',
                description: `Copied ${count} domains from ${listName} to clipboard`,
            });
        } catch (error) {
            toast.error('Failed to copy to clipboard');
        } finally {
            document.body.removeChild(textarea);
        }
    };

    const handleList1FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setList1File(file);
            setList1Content('');
        }
    };

    const handleList2FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setList2File(file);
            setList2Content('');
        }
    };

    const clearList1 = () => {
        setList1Content('');
        setList1File(null);
        if (list1FileRef.current) list1FileRef.current.value = '';
    };

    const clearList2 = () => {
        setList2Content('');
        setList2File(null);
        if (list2FileRef.current) list2FileRef.current.value = '';
    };

    const clearAll = () => {
        clearList1();
        clearList2();
        setResults(null);
        setError('');
        toast.success('Successfully', {
                className: 'info-toast',
                description: 'All lists and results have been cleared',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Domain Comparer" />
            <PermissionGate
                permission="view_domain_comparer"
                fallback={
                    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                        <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                                You don't have permission to access the Domain Comparer. Please contact your administrator if you believe this is an error.
                            </AlertDescription>
                        </Alert>
                    </div>
                }
            >
                <div className="flex-1 space-y-4 p-8 md:p-8 pt-4">
                    <div className="flex items-center justify-between space-y-2">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Domain Comparer</h1>
                            <p className="text-muted-foreground">
                                Compare two domain lists and find differences
                            </p>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                        {/* List 1 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>List 1</span>
                                    {results && (
                                        <Badge variant="outline">{results.list1_count} domains</Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Upload or paste first domain list
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Tabs value={list1Tab} onValueChange={setList1Tab}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="paste">Paste Text</TabsTrigger>
                                        <TabsTrigger value="upload">Upload File</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="paste" className="space-y-2">
                                        <Label>Paste domain list (one per line)</Label>
                                        <Textarea
                                            placeholder="example.com&#10;test.org&#10;domain.net"
                                            value={list1Content}
                                            onChange={(e) => {
                                                setList1Content(e.target.value);
                                                setList1File(null);
                                                if (list1FileRef.current) list1FileRef.current.value = '';
                                            }}
                                            rows={12}
                                            className="h-48 resize-y max-h-200 min-h-100"
                                        />
                                    </TabsContent>
                                    <TabsContent value="upload" className="space-y-2">
                                        <Label htmlFor="list1-file">Select file</Label>
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                ref={list1FileRef}
                                                id="list1-file"
                                                type="file"
                                                accept=".txt"
                                                onChange={handleList1FileChange}
                                            />
                                            {list1File && (
                                                <p className="text-sm text-muted-foreground">
                                                    File: {list1File.name}
                                                </p>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                                <Button
                                    variant="outline"
                                    onClick={clearList1}
                                    className="w-full"
                                >
                                    Clear List 1
                                </Button>
                            </CardContent>
                        </Card>

                        {/* List 2 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>List 2</span>
                                    {results && (
                                        <Badge variant="outline">{results.list2_count} domains</Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Upload or paste second domain list
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Tabs value={list2Tab} onValueChange={setList2Tab}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="paste">Paste Text</TabsTrigger>
                                        <TabsTrigger value="upload">Upload File</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="paste" className="space-y-2">
                                        <Label>Paste domain list (one per line)</Label>
                                        <Textarea
                                            placeholder="example.com&#10;newdomain.io&#10;test.net"
                                            value={list2Content}
                                            onChange={(e) => {
                                                setList2Content(e.target.value);
                                                setList2File(null);
                                                if (list2FileRef.current) list2FileRef.current.value = '';
                                            }}
                                            rows={12}
                                            className="h-48 resize-y max-h-200 min-h-100"
                                        />
                                    </TabsContent>
                                    <TabsContent value="upload" className="space-y-2">
                                        <Label htmlFor="list2-file">Select file</Label>
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                ref={list2FileRef}
                                                id="list2-file"
                                                type="file"
                                                accept=".txt"
                                                onChange={handleList2FileChange}
                                            />
                                            {list2File && (
                                                <p className="text-sm text-muted-foreground">
                                                    File: {list2File.name}
                                                </p>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                                <Button
                                    variant="outline"
                                    onClick={clearList2}
                                    className="w-full"
                                >
                                    Clear List 2
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 justify-center">
                        <Button
                            onClick={handleCompare}
                            disabled={loading || ((!list1Content && !list1File) || (!list2Content && !list2File))}
                            size="lg"
                        >
                            {loading ? 'Comparing...' : 'Compare Lists'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={clearAll}
                            disabled={!list1Content && !list1File && !list2Content && !list2File && !results}
                            size="lg"
                        >
                            Clear All
                        </Button>
                    </div>

                    {/* Results */}
                    {results && (
                        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                            {/* Missing in List 1 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>In List 2 but not List 1</span>
                                        <Badge variant="secondary">
                                            {results.missing_in_list1_count}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        Domains present in List 2 that are missing from List 1
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted rounded-lg p-4 max-h-[400px] overflow-y-auto">
                                        {results.missing_in_list1.length > 0 ? (
                                            <div className="space-y-1">
                                                {results.missing_in_list1.map((domain, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-sm font-mono text-foreground break-all"
                                                    >
                                                        {domain}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">
                                                No missing domains
                                            </p>
                                        )}
                                    </div>
                                    {results.missing_in_list1.length > 0 && (
                                        <Button
                                            onClick={() => handleCopy(results.missing_in_list1, 'List 1 Missing')}
                                            className="w-full"
                                            variant="default"
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy to Clipboard
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Missing in List 2 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>In List 1 but not List 2</span>
                                        <Badge variant="secondary">
                                            {results.missing_in_list2_count}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        Domains present in List 1 that are missing from List 2
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted rounded-lg p-4 max-h-[400px] overflow-y-auto">
                                        {results.missing_in_list2.length > 0 ? (
                                            <div className="space-y-1">
                                                {results.missing_in_list2.map((domain, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-sm font-mono text-foreground break-all"
                                                    >
                                                        {domain}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">
                                                No missing domains
                                            </p>
                                        )}
                                    </div>
                                    {results.missing_in_list2.length > 0 && (
                                        <Button
                                            onClick={() => handleCopy(results.missing_in_list2, 'List 2 Missing')}
                                            className="w-full"
                                            variant="default"
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy to Clipboard
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </PermissionGate>
        </AppLayout>
    );
}
