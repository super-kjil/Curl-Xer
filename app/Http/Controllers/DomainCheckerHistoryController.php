<?php

namespace App\Http\Controllers;

use App\Models\UrlCheck;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DomainCheckerHistoryController extends Controller
{
    public function index()
    {
        return Inertia::render('DomainChecker/History');
    }

    public function getHistory(Request $request)
    {
        $history = UrlCheck::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($check) {
                return [
                    'id' => $check->check_id,
                    'command' => $check->command,
                    'url_count' => $check->url_count,
                    'success_rate' => $check->success_rate,
                    'primary_dns' => $check->primary_dns,
                    'secondary_dns' => $check->secondary_dns,
                    'timestamp' => $check->timestamp->format('Y-m-d H:i:s'),
                    'results' => $check->results
                ];
            });

        return response()->json([
            'success' => true,
            'history' => $history
        ]);
    }

    public function deleteHistory(Request $request)
    {
        $request->validate([
            'id' => 'required|string'
        ]);

        $check = UrlCheck::where('check_id', $request->id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$check) {
            return response()->json([
                'success' => false,
                'message' => 'History item not found'
            ], 404);
        }

        $check->delete();

        return response()->json([
            'success' => true,
            'message' => 'History item deleted'
        ]);
    }

    public function clearHistory()
    {
        UrlCheck::where('user_id', Auth::id())->delete();

        return response()->json([
            'success' => true,
            'message' => 'History cleared'
        ]);
    }

    public function getHistoryDetails(Request $request)
    {
        $request->validate([
            'id' => 'required|string'
        ]);

        $check = UrlCheck::where('check_id', $request->id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$check) {
            return response()->json([
                'success' => false,
                'message' => 'History item not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'details' => [
                'id' => $check->check_id,
                'command' => $check->command,
                'url_count' => $check->url_count,
                'success_rate' => $check->success_rate,
                'primary_dns' => $check->primary_dns,
                'secondary_dns' => $check->secondary_dns,
                'timestamp' => $check->timestamp->format('Y-m-d H:i:s'),
                'results' => $check->results
            ]
        ]);
    }

    public function getChartData(Request $request)
    {
        $request->validate([
            'filter' => 'required|in:7days,1month,3months,custom',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $query = UrlCheck::where('user_id', Auth::id());

        switch ($request->filter) {
            case '7days':
                $query->where('timestamp', '>=', now()->subDays(7));
                break;
            case '1month':
                $query->where('timestamp', '>=', now()->subMonth());
                break;
            case '3months':
                $query->where('timestamp', '>=', now()->subMonths(3));
                break;
            case 'custom':
                if ($request->start_date && $request->end_date) {
                    $query->whereBetween('timestamp', [$request->start_date, $request->end_date]);
                }
                break;
        }

        $data = $query->orderBy('timestamp', 'asc')->get();

        // Group by date and calculate averages
        $groupedData = $data->groupBy(function ($item) {
            return $item->timestamp->format('Y-m-d');
        })->map(function ($group) {
            $avgSuccessRate = round($group->avg('success_rate'), 2);
            $totalUrls = $group->sum('url_count');
            $successUrls = round(($avgSuccessRate / 100) * $totalUrls);
            $failedUrls = $totalUrls - $successUrls;
            
            return [
                'success_rate' => $avgSuccessRate,
                'url_count' => $totalUrls,
                'success_urls' => $successUrls,
                'failed_urls' => $failedUrls,
                'count' => $group->count(),
            ];
        });

        // Convert to chart format
        $chartData = $groupedData->map(function ($item, $date) {
            return [
                'name' => $date,
                'success_rate' => $item['success_rate'],
                'url_count' => $item['url_count'],
                'success_urls' => $item['success_urls'],
                'failed_urls' => $item['failed_urls'],
                'checks' => $item['count'],
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $chartData,
            'total_checks' => $data->count(),
            'avg_success_rate' => round($data->avg('success_rate'), 2),
            'total_urls' => $data->sum('url_count'),
        ]);
    }
}
