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
        $settings = DomainCheckerSetting::where('user_id', Auth::id())->first();
        
        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }

    public function detectDNS()
    {
        try {
            $dns = $this->urlCheckerService->getDefaultDNS();
            
            // Log the detected DNS for debugging
            Log::info('DNS Detection Result', [
                'user_id' => Auth::id(),
                'detected_dns' => $dns,
                'os' => PHP_OS
            ]);
            
            // Save detected DNS to database
            $settings = DomainCheckerSetting::updateOrCreate(
                ['user_id' => Auth::id()],
                [
                    'primary_dns' => $dns['primary'] ?? '',
                    'secondary_dns' => $dns['secondary'] ?? '',
                    'auto_detect_dns' => true,
                ]
            );
            
            return response()->json([
                'success' => true,
                'dns' => $dns,
                'settings' => $settings,
                'message' => 'DNS settings detected and saved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('DNS Detection Error', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to detect DNS settings: ' . $e->getMessage()
            ], 500);
        }
    }
}
