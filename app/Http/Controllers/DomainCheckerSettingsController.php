<?php

namespace App\Http\Controllers;

use App\Models\DomainCheckerSetting;
use App\Services\UrlCheckerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DomainCheckerSettingsController extends Controller
{
    protected $urlCheckerService;

    public function __construct(UrlCheckerService $urlCheckerService)
    {
        $this->urlCheckerService = $urlCheckerService;
    }

    public function index()
    {
        $settings = DomainCheckerSetting::where('user_id', Auth::id())->first();
        
        // Auto-create default settings if they don't exist
        if (!$settings) {
            $serverDNS = $this->urlCheckerService->getServerDNSWithCache();
            $settings = DomainCheckerSetting::create([
                'user_id' => Auth::id(),
                'primary_dns' => $serverDNS['primary'] ?? '8.8.8.8',
                'secondary_dns' => $serverDNS['secondary'] ?? '1.1.1.1',
                'batch_size' => 100,
                'large_batch_size' => 1000,
                'timeout' => 30,
                'auto_detect_dns' => true,
                'custom_dns_servers' => []
            ]);
        }
        
        return Inertia::render('DomainChecker/Settings', [
            'settings' => $settings
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'primary_dns' => 'nullable|string',
            'secondary_dns' => 'nullable|string',
            'batch_size' => 'integer|min:1|max:1000',
            'large_batch_size' => 'integer|min:500|max:2000',
            'timeout' => 'integer|min:5|max:300',
            'auto_detect_dns' => 'boolean',
            'custom_dns_servers' => 'nullable|array',
        ]);

        // Validate DNS if provided
        if ($request->primary_dns && !$this->urlCheckerService->isValidDNS($request->primary_dns)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid primary DNS format'
            ], 400);
        }

        if ($request->secondary_dns && !$this->urlCheckerService->isValidDNS($request->secondary_dns)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid secondary DNS format'
            ], 400);
        }

        $settings = DomainCheckerSetting::updateOrCreate(
            ['user_id' => Auth::id()],
            [
                'primary_dns' => $request->primary_dns,
                'secondary_dns' => $request->secondary_dns,
                'batch_size' => $request->batch_size ?? 100,
                'large_batch_size' => $request->large_batch_size ?? 1000,
                'timeout' => $request->timeout ?? 30,
                'auto_detect_dns' => $request->auto_detect_dns ?? true,
                'custom_dns_servers' => $request->custom_dns_servers,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'settings' => $settings
        ]);
    }

    public function getSettings()
    {
        // Get server DNS (shared for all team members)
        $serverDNS = $this->urlCheckerService->getServerDNSWithCache();
        $cacheInfo = $this->urlCheckerService->getServerDNSCacheInfo();
        
        // Get user-specific settings (batch size, timeout, etc.)
        $userSettings = DomainCheckerSetting::where('user_id', Auth::id())->first();
        
        if (!$userSettings) {
            // Auto-insert default settings into database
            $userSettings = DomainCheckerSetting::create([
                'user_id' => Auth::id(),
                'primary_dns' => $serverDNS['primary'] ?? '8.8.8.8',
                'secondary_dns' => $serverDNS['secondary'] ?? '1.1.1.1',
                'batch_size' => 100,
                'large_batch_size' => 1000,
                'timeout' => 30,
                'auto_detect_dns' => true,
                'custom_dns_servers' => []
            ]);
        }
        
        // Merge server DNS with user settings
        $settings = $userSettings->toArray();
        $settings['primary_dns'] = $serverDNS['primary'] ?? '8.8.8.8';
        $settings['secondary_dns'] = $serverDNS['secondary'] ?? '1.1.1.1';
        $settings['dns_source'] = 'server'; // Indicate DNS comes from server
        
        return response()->json([
            'success' => true,
            'settings' => $settings,
            'server_dns' => $serverDNS,
            'cache_info' => [
                'cached' => $cacheInfo['cached'],
                'cache_duration' => '15 minutes'
            ]
        ]);
    }

    public function detectDNS()
    {
        try {
            // Clear cache and get fresh DNS
            $this->urlCheckerService->clearServerDNSCache();
            $dns = $this->urlCheckerService->getServerDNSWithCache();
            
            Log::info('Server DNS Detection for Team', [
                'detected_dns' => $dns,
                'server_ip' => request()->server('SERVER_ADDR'),
                'user_id' => Auth::id(),
                'timestamp' => now()
            ]);
            
            return response()->json([
                'success' => true,
                'dns' => $dns,
                'message' => 'Server DNS settings detected and cached successfully',
                'note' => 'These DNS settings are shared by all team members',
                'cache_duration' => '15 minutes'
            ]);
        } catch (\Exception $e) {
            Log::error('Server DNS Detection Error', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to detect server DNS settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Refresh server DNS cache (admin function)
     */
    public function refreshServerDNS()
    {
        try {
            $this->urlCheckerService->clearServerDNSCache();
            $dns = $this->urlCheckerService->getServerDNSWithCache();
            
            Log::info('Server DNS Cache Refreshed', [
                'refreshed_by' => Auth::id(),
                'new_dns' => $dns,
                'timestamp' => now()
            ]);
            
            return response()->json([
                'success' => true,
                'dns' => $dns,
                'message' => 'Server DNS cache refreshed successfully',
                'refreshed_at' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error('Server DNS Cache Refresh Error', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh server DNS cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get server DNS cache status
     */
    public function getServerDNSStatus()
    {
        $cacheInfo = $this->urlCheckerService->getServerDNSCacheInfo();
        
        return response()->json([
            'success' => true,
            'cache_info' => $cacheInfo,
            'cache_duration' => '15 minutes'
        ]);
    }
}
