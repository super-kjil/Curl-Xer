<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class DomainListController extends Controller
{
    public function index()
    {
        return Inertia::render('DomainList/index');
    }

    public function fetchList(Request $request)
    {
        $url = trim((string) config('app.domain_list', ''));
        if ($url === '') {
            return response()->json([
                'success' => false,
                'message' => 'DOMAIN_LIST is not configured',
            ], 500);
        }

        $cacheKey = 'domain_list.' . md5($url);
        $ttlSeconds = 300; // 5 minutes
        $forceRefresh = $request->boolean('refresh');

        try {
            $cached = Cache::get($cacheKey);
            if (!$forceRefresh && is_array($cached) && isset($cached['domains'])) {
                return response()->json([
                    'success' => true,
                    'source' => $url,
                    'count' => count($cached['domains']),
                    'domains' => $cached['domains'],
                    'cached' => true,
                    'cached_at' => $cached['cached_at'] ?? null,
                ]);
            }

            $response = Http::timeout(10)->get($url);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch domain list',
                    'status' => $response->status(),
                ], 502);
            }

            $text = (string) $response->body();
            $lines = preg_split("/\r\n|\n|\r/", $text) ?: [];

            $domains = collect($lines)
                ->map(fn ($line) => trim($line))
                ->filter(fn ($line) => $line !== '' && !str_starts_with($line, '#'))
                ->values()
                ->all();

            Cache::put($cacheKey, [
                'domains' => $domains,
                'cached_at' => now()->toIso8601String(),
            ], now()->addSeconds($ttlSeconds));

            return response()->json([
                'success' => true,
                'source' => $url,
                'count' => count($domains),
                'domains' => $domains,
                'cached' => false,
                'cached_at' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch domain list',
            ], 502);
        }
    }
}

