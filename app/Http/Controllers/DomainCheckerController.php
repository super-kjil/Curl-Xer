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
        // \Log::info('Using user performance settings', [
        //     'user_id' => Auth::id(),
        //     'batch_size' => $batch_size,
        //     'large_batch_size' => $large_batch_size,
        //     'timeout' => $timeout,
        //     'url_count' => $url_count
        // ]);

        // Choose processing method based on URL count and user settings
        if ($url_count > 10000) {
            // Use optimized method for large URL sets with user's large batch size
            $batch_size = $this->urlCheckerService->calculateOptimalBatchSize($url_count, $batch_size, $large_batch_size);
            $estimated_time = $this->urlCheckerService->estimateProcessingTime($url_count, $batch_size, $timeout);
            
            // \Log::info('Using optimized processing method', [
            //     'url_count' => $url_count,
            //     'calculated_batch_size' => $batch_size,
            //     'estimated_time_seconds' => $estimated_time
            // ]);
            
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
            // \Log::info('Using standard processing method', [
            //     'url_count' => $url_count,
            //     'batch_size' => $batch_size
            // ]);
            
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

        // Persist using domain_check_* schema (batch + results)
        $batch = DomainCheckBatch::create([
            'user_id' => Auth::id(),
            'note' => $command,
        ]);

        // Prepare bulk insert for results
        $now = now();
        $rows = array_map(function ($r) use ($batch, $now) {
            $resultKind = $r['result_kind'] ?? null;
            $httpStatus = isset($r['status']) && $r['status'] !== null ? (int)$r['status'] : null;

            // Backward compatibility: if result_kind is missing, infer from old status mapping.
            if (!$resultKind && $httpStatus !== null) {
                if ($httpStatus === 403) {
                    $resultKind = 'blocked';
                } elseif ($httpStatus === 404) {
                    $resultKind = 'not_existed';
                } elseif ($httpStatus === 200) {
                    $resultKind = 'not_blocked';
                }
            }

            // We no longer store fake http status for nslookup results.
            $storeHttpStatus = $resultKind ? null : $httpStatus;

            $remark = [
                'accessible' => $r['accessible'] ?? false,
                'result_kind' => $resultKind,
            ];
            return [
                'batch_id' => $batch->id,
                'domain_name' => $r['url'] ?? '',
                'http_status' => $storeHttpStatus,
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
        $os = strtoupper(substr(PHP_OS, 0, 3));
        
        $debug_info = [
            'success' => true,
            'dns' => $dns,
            'os' => PHP_OS,
            'php_user' => get_current_user(),
            'exec_enabled' => function_exists('exec'),
        ];

        if ($os === 'WIN') {
            // Windows diagnostics
            $ps_output = [];
            exec('powershell -Command "Get-DnsClientServerAddress | Select-Object -ExpandProperty ServerAddresses"', $ps_output);
            $debug_info['powershell_output'] = $ps_output;
            
            $ipconfig_output = [];
            exec('ipconfig /all', $ipconfig_output);
            $debug_info['ipconfig_output'] = array_slice($ipconfig_output, 0, 50);
        } else {
            // Linux/Ubuntu diagnostics
            $resolv_output = [];
            if (file_exists('/etc/resolv.conf')) {
                $resolv_output = file('/etc/resolv.conf', FILE_IGNORE_NEW_LINES);
            }
            $debug_info['resolv_conf'] = $resolv_output;
            
            $nslookup_test = [];
            exec('nslookup google.com 2>&1', $nslookup_test);
            $debug_info['nslookup_test'] = $nslookup_test;

            $which_nslookup = [];
            exec('which nslookup 2>&1', $which_nslookup);
            $debug_info['nslookup_path'] = $which_nslookup;
        }
        
        return response()->json($debug_info);
    }
}
