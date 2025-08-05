<?php

namespace App\Http\Controllers;

use App\Models\UrlCheck;
use App\Services\UrlCheckerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DomainCheckerController extends Controller
{
    protected $urlCheckerService;

    public function __construct(UrlCheckerService $urlCheckerService)
    {
        $this->urlCheckerService = $urlCheckerService;
    }

    public function index()
    {
        return Inertia::render('DomainChecker/Index');
    }

    public function checkUrls(Request $request)
    {
        $request->validate([
            'urls' => 'required|string',
            'primary_dns' => 'nullable|string',
            'secondary_dns' => 'nullable|string',
            'command' => 'nullable|string',
        ]);

        $urls = array_filter(explode("\n", $request->urls));
        $primary_dns = $request->primary_dns;
        $secondary_dns = $request->secondary_dns;
        $command = $request->command;
        $url_count = count($urls);

        // Validate DNS if provided
        if ($primary_dns && !$this->urlCheckerService->isValidDNS($primary_dns)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid primary DNS format'
            ], 400);
        }

        if ($secondary_dns && !$this->urlCheckerService->isValidDNS($secondary_dns)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid secondary DNS format'
            ], 400);
        }

        // Choose processing method based on URL count
        if ($url_count > 10000) {
            // Use optimized method for large URL sets
            $batch_size = $this->urlCheckerService->calculateOptimalBatchSize($url_count);
            $estimated_time = $this->urlCheckerService->estimateProcessingTime($url_count, $batch_size);
            
            $results = $this->urlCheckerService->checkURLsOptimized(
                $urls,
                $primary_dns,
                $secondary_dns,
                $command,
                $batch_size,
                3 // max concurrent batches
            );
        } else {
            // Use standard method for smaller URL sets
            $results = $this->urlCheckerService->checkURLsParallel(
                $urls,
                $primary_dns,
                $secondary_dns,
                $command
            );
        }

        // Calculate success rate
        $success_rate = $this->urlCheckerService->calculateSuccessRate($results);

        // Generate check ID
        $check_id = $this->urlCheckerService->generateCheckId();

        // Save to database
        $urlCheck = UrlCheck::create([
            'check_id' => $check_id,
            'command' => $command,
            'url_count' => $url_count,
            'results' => $results,
            'timestamp' => now(),
            'success_rate' => $success_rate,
            'primary_dns' => $primary_dns,
            'secondary_dns' => $secondary_dns,
            'user_id' => Auth::id(),
        ]);

        return response()->json([
            'success' => true,
            'check_id' => $check_id,
            'results' => $results,
            'success_rate' => $success_rate,
            'total_urls' => $url_count,
            'timestamp' => $urlCheck->timestamp,
            'processing_method' => $url_count > 10000 ? 'optimized' : 'standard',
            'estimated_time' => $url_count > 10000 ? $estimated_time : null
        ]);
    }

    public function getDefaultDNS()
    {
        $dns = $this->urlCheckerService->getDefaultDNS();
        
        return response()->json([
            'success' => true,
            'dns' => $dns
        ]);
    }

    public function debugDNS()
    {
        $dns = $this->urlCheckerService->getDefaultDNS();
        
        // Get raw PowerShell output for debugging
        $output = [];
        exec('powershell -Command "Get-DnsClientServerAddress | Select-Object -ExpandProperty ServerAddresses"', $output);
        
        // Get raw ipconfig output for debugging
        $ipconfig_output = [];
        exec('ipconfig /all', $ipconfig_output);
        
        return response()->json([
            'success' => true,
            'dns' => $dns,
            'powershell_output' => $output,
            'ipconfig_output' => array_slice($ipconfig_output, 0, 50), // First 50 lines
            'os' => PHP_OS
        ]);
    }
}
