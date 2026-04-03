<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DomainComparerController extends Controller
{
    /**
     * Display the domain comparer page
     */
    public function index()
    {
        return Inertia::render('DomainComparer/index');
    }

    /**
     * Compare two lists of domains
     */
    public function compare(Request $request)
    {
        $request->validate([
            'list1_content' => 'nullable|string',
            'list1_file' => 'nullable|file|mimes:txt|max:5120',
            'list2_content' => 'nullable|string',
            'list2_file' => 'nullable|file|mimes:txt|max:5120',
        ]);

        try {
            // Extract domains from list 1
            $list1Content = $request->input('list1_content', '');
            if ($request->hasFile('list1_file')) {
                $list1Content = file_get_contents($request->file('list1_file')->getRealPath());
            }

            // Extract domains from list 2
            $list2Content = $request->input('list2_content', '');
            if ($request->hasFile('list2_file')) {
                $list2Content = file_get_contents($request->file('list2_file')->getRealPath());
            }

            // Extract and validate domains
            $list1Domains = $this->extractDomains($list1Content);
            $list2Domains = $this->extractDomains($list2Content);

            // Compare
            $missingInList1 = array_diff($list2Domains, $list1Domains);
            $missingInList2 = array_diff($list1Domains, $list2Domains);

            // Sort for consistency
            sort($missingInList1);
            sort($missingInList2);

            return response()->json([
                'success' => true,
                'list1_count' => count($list1Domains),
                'list2_count' => count($list2Domains),
                'missing_in_list1' => $missingInList1,
                'missing_in_list2' => $missingInList2,
                'missing_in_list1_count' => count($missingInList1),
                'missing_in_list2_count' => count($missingInList2),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error comparing domains: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Extract and validate domains from text content
     * 
     * @param string $content The text content to extract domains from
     * @return array Array of unique, valid domains
     */
    private function extractDomains($content)
    {
        $domains = [];
        
        if (empty($content)) {
            return $domains;
        }

        // Split by newlines
        $lines = preg_split('/[\r\n]+/', $content);

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // Extract domain using regex pattern - allows Unicode characters via /u flag
            if (preg_match('/[\w.\-]+\.[\w.]+/u', $line, $matches)) {
                $domain = strtolower($matches[0]);
                
                if ($this->isValidDomain($domain)) {
                    $domains[] = $domain;
                }
            }
        }

        // Remove duplicates and re-index
        return array_values(array_unique($domains));
    }

    /**
     * Validate domain name format
     * 
     * @param string $domain The domain to validate
     * @return bool True if domain is valid, false otherwise
     */
    private function isValidDomain($domain)
    {
        if (empty($domain) || strlen($domain) > 253) {
            return false;
        }

        // Check for consecutive dots or leading/trailing dots
        if (strpos($domain, '..') !== false || 
            substr($domain, 0, 1) === '.' || 
            substr($domain, -1) === '.') {
            return false;
        }

        // Must have at least one dot
        if (strpos($domain, '.') === false) {
            return false;
        }

        // Split labels
        $labels = explode('.', $domain);
        
        if (count($labels) < 2) {
            return false;
        }

        // Each label should not be empty and not exceed 63 characters
        foreach ($labels as $label) {
            if (empty($label) || strlen($label) > 63) {
                return false;
            }
        }

        return true;
    }

    /**
     * Download comparison results as text files
     */
    public function downloadResults(Request $request)
    {
        $request->validate([
            'list1_content' => 'nullable|string',
            'list1_file' => 'nullable|file|mimes:txt|max:5120',
            'list2_content' => 'nullable|string',
            'list2_file' => 'nullable|file|mimes:txt|max:5120',
            'file_type' => 'required|string|in:missing_in_list1,missing_in_list2',
        ]);

        try {
            // Extract domains from list 1
            $list1Content = $request->input('list1_content', '');
            if ($request->hasFile('list1_file')) {
                $list1Content = file_get_contents($request->file('list1_file')->getRealPath());
            }

            // Extract domains from list 2
            $list2Content = $request->input('list2_content', '');
            if ($request->hasFile('list2_file')) {
                $list2Content = file_get_contents($request->file('list2_file')->getRealPath());
            }

            // Extract and validate domains
            $list1Domains = $this->extractDomains($list1Content);
            $list2Domains = $this->extractDomains($list2Content);

            // Compare
            $missingInList1 = array_diff($list2Domains, $list1Domains);
            $missingInList2 = array_diff($list1Domains, $list2Domains);

            // Sort for consistency
            sort($missingInList1);
            sort($missingInList2);

            // Determine which results to download
            $results = $request->input('file_type') === 'missing_in_list1' 
                ? $missingInList1 
                : $missingInList2;

            $filename = $request->input('file_type') === 'missing_in_list1'
                ? 'missing_in_list1_' . date('Y-m-d_H-i-s') . '.txt'
                : 'missing_in_list2_' . date('Y-m-d_H-i-s') . '.txt';

            $content = implode("\n", $results);

            return response()->streamDownload(function () use ($content) {
                echo $content;
            }, $filename, [
                'Content-Type' => 'text/plain; charset=utf-8',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error downloading results: ' . $e->getMessage()
            ], 400);
        }
    }
}
