import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import mammoth from 'mammoth';
import { Upload, FileText, Copy, CheckCircle, BadgeCheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ExtractedContent {
  text: string;
  domains: string[];
}
const STORAGE_KEY = 'extracted_domains_v1';
const STORAGE_TTL_MS = 2 * 60 * 1000; // 2 minutes
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
  const [fileName, setFileName] = useState<string | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const [showClipboardModal, setShowClipboardModal] = useState(false);
  const [clipboardModalText, setClipboardModalText] = useState('');
  const clipboardTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const stripExtension = (name: string) => name.replace(/\.[^/.]+$/, '');

  const saveDomainsToStorage = (domains: string[], filename: string | null = null) => {
    try {
      const payload = JSON.stringify({ domains, savedAt: Date.now(), fileName: filename });
      localStorage.setItem(STORAGE_KEY, payload);

      // clear any existing timer
      if (clearTimerRef.current) {
        window.clearTimeout(clearTimerRef.current);
      }
      // schedule clearing after TTL
      clearTimerRef.current = window.setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY);
        setExtractedContent(null);
        setFileName(null);
        clearTimerRef.current = null;
      }, STORAGE_TTL_MS);
    } catch (e) {
      console.error('Failed to save domains to storage', e);
    }
  };

  const clearStoredDomains = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      if (clearTimerRef.current) {
        window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      setFileName(null);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  };

  useEffect(() => {
    // load stored domains on mount if not expired
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { domains: string[]; savedAt: number; fileName?: string | null } | null;
      if (!parsed) return;
      const age = Date.now() - (parsed.savedAt || 0);
      if (age >= STORAGE_TTL_MS) {
        // expired
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // restore domains (text/images not stored)
      setExtractedContent({ text: '', domains: parsed.domains });
      setFileName(parsed.fileName || null);

      // schedule remaining clear
      const remaining = STORAGE_TTL_MS - age;
      clearTimerRef.current = window.setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY);
        setExtractedContent(null);
        setFileName(null);
        clearTimerRef.current = null;
      }, remaining);
    } catch (e) {
      console.error('Failed to load stored domains', e);
    }

    return () => {
      if (clearTimerRef.current) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  // Auto-select text in modal when opened
  useEffect(() => {
    if (showClipboardModal) {
      // wait a tick for textarea to render
      setTimeout(() => {
        if (clipboardTextareaRef.current) {
          clipboardTextareaRef.current.focus();
          clipboardTextareaRef.current.select();
        }
      }, 50);
    }
  }, [showClipboardModal]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

  // store file name for UI display (without extension)
  const baseName = stripExtension(file.name);
  setFileName(baseName);

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

        setExtractedContent({
          text,
          domains
        });

    // persist domains and filename (without extension) to localStorage with TTL
    saveDomainsToStorage(domains, baseName);

        toast.success(`Extracted ${domains.length} domain names`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error("Failed to extract content from the document");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  const extractDomains = (text: string): string[] => {
    // Regex to match domain names
    const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/g;
    const matches = text.match(domainRegex) || [];

    // Clean up domains and remove duplicates
    const cleanDomains = matches
      .map(domain => domain.replace(/^https?:\/\//, '').replace(/^www\./, ''))
      .filter((domain, index, arr) => arr.indexOf(domain) === index)
      .sort();

    return cleanDomains;
  };

  const copyToClipboard = async (text: string, setCopiedState: React.Dispatch<React.SetStateAction<boolean>>) => {
    // Try modern clipboard API first
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedState(true);
        toast.success('Content has been copied successfully');
        setTimeout(() => setCopiedState(false), 2000);
        return true;
      }
    } catch (e) {
      console.warn('navigator.clipboard.writeText failed', e);
    }

    // Fallback: legacy execCommand copy
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-99999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopiedState(true);
        toast.success('Content has been copied successfully');
        setTimeout(() => setCopiedState(false), 2000);
        return true;
      }
    } catch (e) {
      console.warn('execCommand copy failed', e);
    }

    // Last resort: open modal with selectable textarea so user can copy manually
    setClipboardModalText(text);
    setShowClipboardModal(true);
    toast.error('Automatic copy failed — opening manual copy dialog');
    return false;
  };

  const copyDomains = () => {
    if (extractedContent?.domains) {
      copyToClipboard(extractedContent.domains.join('\n'), setCopiedDomains);
    }
  };


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Domain Extractor" />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            MS Word Document Extractor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a .docx file to extract domain names and IPv4 addresses
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
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag and drop a .docx file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Processing document...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {extractedContent && (
          <div className="space-y-6">
            {/* Domain Names */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Extracted Domain Names
                    <Badge
                      variant="outline">
                      {extractedContent.domains.length}
                    </Badge>
                    {fileName && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{fileName}</span>
                    )}
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extractedContent.domains.length > 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-4 max-h-96 overflow-y-auto">
                    {extractedContent.domains.map((domain, index) => (
                      <div key={index} className="text-sm font-mono text-gray-800 dark:text-gray-200 py-1">
                        {domain}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No domain names found in the document
                  </p>
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </div>
          {/* Manual copy modal fallback when automatic copy fails */}
          <Dialog open={showClipboardModal} onOpenChange={setShowClipboardModal}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Manual Copy</DialogTitle>
                <DialogDescription>
                  Automatic copy to clipboard failed. You can manually copy the extracted domains below. Use the "Copy to clipboard" button to retry.
                </DialogDescription>
              </DialogHeader>

              <div className="py-2">
                <textarea
                  ref={clipboardTextareaRef}
                  readOnly
                  value={clipboardModalText}
                  className="w-full h-48 p-2 font-mono bg-white dark:bg-gray-900 border rounded"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowClipboardModal(false);
                  setClipboardModalText('');
                }}>
                  Close
                </Button>
                <Button onClick={async () => {
                  const ok = await copyToClipboard(clipboardModalText, setCopiedDomains);
                  if (ok) {
                    setShowClipboardModal(false);
                    setClipboardModalText('');
                  }
                }}>
                  Copy to clipboard
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    </AppLayout>
  );
}
