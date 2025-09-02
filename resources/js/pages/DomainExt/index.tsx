import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import mammoth from 'mammoth';
import { Upload, FileText, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { BreadcrumbItem } from '@/types';

interface ExtractedContent {
  text: string;
  domains: string[];
}
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Domain Extractor',
        href: '/domain-extractor',
    },
];
export default function Index() {
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // const [copiedItems, setcopiedItems] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

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
        
        setExtractedContent({
          text,
          domains
        });
        
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

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedItems((prev) => new Set(prev).add(itemId));
        toast.success('Copied to clipboard!');
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopiedItems((prev) => new Set(prev).add(itemId));
            toast.success('Copied to clipboard!');
          } else {
            throw new Error('Copy command failed');
          }
        } catch (err) {
          // If both methods fail, show the text in a modal or alert
          showTextModal(text);
          return;
        } finally {
          document.body.removeChild(textArea);
        }
      }

      // Remove the copied state after 3 seconds
      setTimeout(() => {
        setCopiedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 3000);
    } catch (error) {
      console.error('Copy failed:', error);
      // Show text in modal as last resort
      showTextModal(text);
    }
  };

  const showTextModal = (text: string) => {
    // Create a modal to display the text for manual copying
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 80%;
      max-height: 80%;
      overflow: auto;
      position: relative;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #ef4444;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
    `;
    
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = `
      width: 100%;
      height: 300px;
      margin-top: 30px;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    `;
    
    const instructions = document.createElement('p');
    instructions.textContent = 'Select all text (Ctrl+A) and copy (Ctrl+C) manually:';
    instructions.style.cssText = `
      margin: 10px 0;
      font-weight: bold;
      color: #333;
    `;
    
    closeBtn.onclick = () => {
      document.body.removeChild(modal);
    };
    
    content.appendChild(closeBtn);
    content.appendChild(instructions);
    content.appendChild(textArea);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Auto-select the text
    textArea.focus();
    textArea.select();
    
    toast.info('Please copy the text manually from the popup');
  };

  const copyDomains = () => {
    if (extractedContent?.domains) {
      copyToClipboard(extractedContent.domains.join('\n'), 'domains');
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
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
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
                  Extracted Domain Names ({extractedContent.domains.length})
                </span>
                <Button
                  onClick={copyDomains}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copiedItems.has('domains') ? (
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
    </AppLayout>
  );
}