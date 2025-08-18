<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DomainGeneratorController extends Controller
{
    public function index()
    {
        return Inertia::render('DomainGenerator/Index');
    }

    public function generate(Request $request)
    {
        $request->validate([
            'urls' => 'required|string',
            'prefix' => 'nullable|string|max:50',
            'date' => 'required|string',
            'include_www' => 'boolean',
            'include_non_www' => 'boolean',
        ]);

        $urls = array_filter(explode("\n", $request->urls));
        $prefix = $request->prefix ?: 'TRC';
        $date = $request->date;
        $includeWww = $request->include_www ?? true;
        $includeNonWww = $request->include_non_www ?? true;

        // Remove duplicates (case-insensitive)
        $uniqueUrls = [];
        $seenUrls = [];

        foreach ($urls as $url) {
            $cleanUrl = trim($url);
            $lowerUrl = strtolower($cleanUrl);

            if (!empty($cleanUrl) && !in_array($lowerUrl, $seenUrls)) {
                $uniqueUrls[] = $cleanUrl;
                $seenUrls[] = $lowerUrl;
            }
        }

        $results = [];

        if ($includeWww) {
            $wwwUrls = [];
            foreach ($uniqueUrls as $url) {
                $cleanUrl = preg_replace('/^(https?:\/\/)?(www\.)?/i', '', $url);
                $cleanUrl = strtolower($cleanUrl);
                $formattedUrl = 'www.' . $cleanUrl;
                $urlLine = $formattedUrl . "\t\t#" . $prefix . '-' . $date;
                $wwwUrls[] = $urlLine;
            }
            $results['www'] = $wwwUrls;
        }

        if ($includeNonWww) {
            $nonWwwUrls = [];
            foreach ($uniqueUrls as $url) {
                $cleanUrl = preg_replace('/^(https?:\/\/)?(www\.)?/i', '', $url);
                $cleanUrl = strtolower($cleanUrl);
                $urlLine = $cleanUrl . "\t\t#" . $prefix . '-' . $date;
                $nonWwwUrls[] = $urlLine;
            }
            $results['non_www'] = $nonWwwUrls;
        }

        $duplicateCount = count($urls) - count($uniqueUrls);
        $totalGenerated = count($uniqueUrls) * (($includeWww ? 1 : 0) + ($includeNonWww ? 1 : 0));

        return response()->json([
            'success' => true,
            'results' => $results,
            'total_urls' => count($uniqueUrls),
            'total_generated' => $totalGenerated,
            'duplicate_count' => $duplicateCount,
            'prefix' => $prefix,
            'date' => $date,
            'include_www' => $includeWww,
            'include_non_www' => $includeNonWww,
        ]);
    }
}
