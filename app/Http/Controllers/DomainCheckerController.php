<?php

namespace App\Http\Controllers;

use App\Models\DomainCheckBatch;
use App\Models\DomainCheckResult;
use App\Models\DomainCheckerSetting;
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

        // Get user's performance settings
        $userSettings = DomainCheckerSetting::where('user_id', Auth::id())->first();
        $batch_size = $userSettings?->batch_size ?? 100;
        $large_batch_size = $userSettings?->large_batch_size ?? 1000;
        $timeout = $userSettings?->timeout ?? 30;

        // Ensure all values are positive
        $batch_size = max(1, $batch_size);
        $large_batch_size = max(1, $large_batch_size);
        $timeout = max(1, $timeout);

        // Log the settings being used
        \Log::info('Using user performance settings', [
            'user_id' => Auth::id(),
            'batch_size' => $batch_size,
            'large_batch_size' => $large_batch_size,
            'timeout' => $timeout,
            'url_count' => $url_count
        ]);

        // Choose processing method based on URL count and user settings
        if ($url_count > 10000) {
            // Use optimized method for large URL sets with user's large batch size
            $batch_size = $this->urlCheckerService->calculateOptimalBatchSize($url_count, $batch_size, $large_batch_size);
            $estimated_time = $this->urlCheckerService->estimateProcessingTime($url_count, $batch_size, $timeout);
            
            \Log::info('Using optimized processing method', [
                'url_count' => $url_count,
                'calculated_batch_size' => $batch_size,
                'estimated_time_seconds' => $estimated_time
            ]);
            
            $results = $this->urlCheckerService->checkURLsOptimized(
                $urls,
                $primary_dns,
                $secondary_dns,
                $command,
                $batch_size,
                3, // max concurrent batches
                $timeout
            );
        } else {
            // Use standard method for smaller URL sets with user's batch size
            \Log::info('Using standard processing method', [
                'url_count' => $url_count,
                'batch_size' => $batch_size
            ]);
            
            $results = $this->urlCheckerService->checkURLsParallel(
                $urls,
                $primary_dns,
                $secondary_dns,
                $command,
                $batch_size,
                $timeout
            );
        }

        // Calculate success rate
        $success_rate = $this->urlCheckerService->calculateSuccessRate($results);

        // Generate check ID
        $check_id = $this->urlCheckerService->generateCheckId();

        // Resolve which DNS values were actually used
        $dnsPrimaryUsed = $primary_dns;
        $dnsSecondaryUsed = $secondary_dns;
        if (empty($dnsPrimaryUsed)) {
            $serverDNS = $this->urlCheckerService->getServerDNSWithCache();
            $dnsPrimaryUsed = $serverDNS['primary'] ?? 'System Default';
            $dnsSecondaryUsed = $serverDNS['secondary'] ?? '0.0.0.0';
        }

        // Persist using domain_check_* schema (batch + results)
        $batch = DomainCheckBatch::create([
            'user_id' => Auth::id(),
            'note' => $command,
        ]);

        // Prepare bulk insert for results
        $now = now();
        $rows = array_map(function ($r) use ($batch, $now, $dnsPrimaryUsed, $dnsSecondaryUsed) {
            $remark = [
                'time' => $r['time'] ?? 0,
                'accessible' => $r['accessible'] ?? false,
                'used_dns' => $dnsPrimaryUsed,
                'secondary_dns' => $dnsSecondaryUsed,
            ];
            return [
                'batch_id' => $batch->id,
                'domain_name' => $r['url'] ?? '',
                'http_status' => isset($r['status']) ? (int)$r['status'] : null,
                'remark' => json_encode($remark),
                'checked_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $results);

        // Insert in chunks for large datasets
        $chunkSize = 1000;
        for ($i = 0; $i < count($rows); $i += $chunkSize) {
            $chunk = array_slice($rows, $i, $chunkSize);
            DomainCheckResult::insert($chunk);
        }

        return response()->json([
            'success' => true,
            'check_id' => (string)$batch->id,
            'results' => $results,
            'success_rate' => $success_rate,
            'total_urls' => $url_count,
            'timestamp' => $batch->created_at,
            'processing_method' => $url_count > 10000 ? 'optimized' : 'standard',
            'estimated_time' => $url_count > 10000 ? $estimated_time : null,
            'settings_used' => [
                'batch_size' => $batch_size,
                'timeout' => $timeout,
                'large_batch_size' => $large_batch_size
            ]
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
