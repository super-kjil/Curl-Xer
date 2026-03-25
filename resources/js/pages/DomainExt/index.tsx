import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import mammoth from 'mammoth';
import { Upload, FileText, Copy, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Head } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ExtractedContent {
  text: string;
  domains: string[];
  ipv4Addresses: string[];
  fileName: string;
}

interface StoredData {
  content: ExtractedContent;
  timestamp: number;
}

const STORAGE_KEY = 'docx_extractor_data';
const STORAGE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Domain Extractor',
    href: '/domain-extractor',
  },
];
export default function Index() {
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedDomains, setCopiedDomains] = useState(false);
  const [copiedIpv4, setCopiedIpv4] = useState(false);

  const saveToLocalStorage = (content: ExtractedContent) => {
    const data: StoredData = {
      content,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const loadFromLocalStorage = () => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return null;

    const data: StoredData = JSON.parse(storedData);
    const now = Date.now();

    if (now - data.timestamp > STORAGE_DURATION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return data.content;
  };

  // Load stored data on component mount
  React.useEffect(() => {
    const storedContent = loadFromLocalStorage();
    if (storedContent) {
      setExtractedContent(storedContent);
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      toast.error("Please upload a .docx file");
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (result.value) {
        const text = result.value;
        const domains = extractDomains(text);
        const ipv4Addresses = extractIpv4Addresses(text);
        const fileName = file.name;

        const content = {
          text,
          domains,
          ipv4Addresses,
          fileName
        };

        setExtractedContent(content);
        saveToLocalStorage(content);

        toast.success(`Extracted ${domains.length} domain names and ${ipv4Addresses.length} IPv4 addresses`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error("Failed to extract content from the document");
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  const extractDomains = (text: string): string[] => {
    // Match Unicode domains (IDN) as well as ASCII ones.
    // Why: the previous regex used `[a-zA-Z]` only, so `vł88.com` became `88.com`.
    const label =
      '(?:[\\p{L}\\p{N}](?:[\\p{L}\\p{N}-]{0,61}[\\p{L}\\p{N}])?)';
    // Note: we apply the same "label" rules to the TLD too, so punycode domains
    // like `xn--example.com` are still matched.
    const domainRegex = new RegExp(
      `(?:https?:\\/\\/)?(?:www\\.)?((?:${label}\\.)+${label})`,
      'gu',
    );

    const matches = Array.from(text.matchAll(domainRegex), m => m[1] as string);

    const normalizeDomain = (raw: string) => {
      // Strip URL-ish prefixes + trailing punctuation commonly present in text runs.
      const withoutPrefix = raw
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '');

      return withoutPrefix
        .replace(/[)\]\}>,.;:!?]+$/g, '')
        .replace(/\.$/, '') // just in case the match includes a final dot
        .toLowerCase();
    };

    const isValidDomain = (candidate: string) => {
      if (!candidate) return false;

      const parts = candidate.split('.');
      if (parts.length < 2) return false;
      if (parts.some(p => p.length === 0)) return false;

      // Require a "real" TLD: at least 2 chars and must include at least one letter.
      const tld = parts[parts.length - 1];
      if (tld.length < 2) return false;
      if (!/[\p{L}]/u.test(tld)) return false;

      // Basic label validation (Unicode letters/digits + optional internal hyphens).
      const labelPattern = /^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u;
      return parts.every(label => labelPattern.test(label));
    };

    // Clean up domains and remove duplicates (case-insensitive)
    const cleanDomains = Array.from(new Set(matches.map(normalizeDomain)))
      .filter(isValidDomain)
      .sort();

    return cleanDomains;
  };

  const extractIpv4Addresses = (text: string): string[] => {
    // Regex to match IPv4 addresses
    const ipv4Regex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    const matches = text.match(ipv4Regex) || [];

    // Remove duplicates and sort
    return [...new Set(matches)].sort();
  };

  const copyToClipboard = async (text: string, setCopiedState: React.Dispatch<React.SetStateAction<boolean>>) => {
    let success = false;

    // Modern Clipboard API (requires HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (error) {
        console.error('Clipboard API error:', error);
      }
    }

    // Fallback for HTTP/non-secure contexts (legacy method)
    if (!success) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        success = document.execCommand('copy');
      } catch (error) {
        console.error('Fallback copy error:', error);
      } finally {
        document.body.removeChild(textArea);
      }
    }

    if (success) {
      setCopiedState(true);
      toast.success("Content has been copied successfully");
      setTimeout(() => setCopiedState(false), 2000);
    } else {
      toast.error("Could not copy to clipboard. Please select and copy manually.");
    }
  };

  const copyDomains = () => {
    if (extractedContent?.domains) {
      copyToClipboard(extractedContent.domains.join('\n'), setCopiedDomains);
    }
  };

  const copyIpv4 = () => {
    if (extractedContent?.ipv4Addresses) {
      copyToClipboard(extractedContent.ipv4Addresses.join('\n'), setCopiedIpv4);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Domain Extractor" />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            MS Word Document Extractor
          </h1>
          <p className="text-muted-foreground">
            Upload a .docx file to extract domain names and text content
          </p>
        </div>

        {/* File Upload Area */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground hover:bg-muted/50'
                }`}
            >
              <input {...getInputProps()} />
              <Upload className={`mx-auto h-12 w-12 mb-4 transition-colors duration-200 ${isDragActive ? 'text-primary' : 'text-muted-foreground'
                }`} />
              {isDragActive ? (
                <p className="text-primary font-medium">Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-2">
                    Drag and drop a .docx file here, or click to select
                  </p>
                  <p className="text-sm text-muted-foreground/80">
                    Supports Microsoft Word (.docx) files only
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processing State */}
        {isProcessing && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Processing document...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {extractedContent && (
          <div className={`grid grid-cols-1 ${extractedContent.ipv4Addresses.length > 0 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-4xl mx-auto'} gap-6`}>
            {/* Domain Names */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex flex-col gap-1">
                  <div className="text-sm font-normal text-muted-foreground">
                    File Name : 
                    <Badge variant="outline">
                      {extractedContent.fileName.replace('.docx', '')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Extracted Domain Names
                      <Badge>
                        {extractedContent.domains.length}
                      </Badge>
                    </span>
                    <Button
                      onClick={copyDomains}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {copiedDomains ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy All
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extractedContent.domains.length > 0 ? (
                  <div className="bg-muted/30 rounded-lg p-4 max-h-[calc(100vh-24rem)] overflow-y-auto">
                    {extractedContent.domains.map((domain, index) => (
                      <div key={index} className="text-sm font-mono text-foreground py-1">
                        {domain}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No domain names found in the document
                  </p>
                )}
              </CardContent>
            </Card>

            {/* IPv4 Addresses - Only render if IPv4 addresses exist */}
            {extractedContent.ipv4Addresses.length > 0 && (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex flex-col gap-1">
                    <div className="text-sm font-normal text-muted-foreground">
                      File Name : 
                      <Badge variant="outline">
                        {extractedContent.fileName.replace('.docx', '')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        IPv4 Addresses
                        <Badge>
                          {extractedContent.ipv4Addresses.length}
                        </Badge>
                      </span>
                      <Button
                        onClick={copyIpv4}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {copiedIpv4 ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-success" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy All
                          </>
                        )}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4 max-h-[calc(100vh-24rem)] overflow-y-auto">
                    {extractedContent.ipv4Addresses.map((ip, index) => (
                      <div key={index} className="text-sm font-mono text-foreground py-1">
                        {ip}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}