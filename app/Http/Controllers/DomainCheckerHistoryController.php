<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DomainCheckerHistoryController extends Controller
{
    public function index()
    {
        return Inertia::render('DomainHistory/History');
    }

    public function getHistory(Request $request)
    {
        $validated = $request->validate([
            'per_page' => 'nullable|integer|min:10|max:50',
            'cursor' => 'nullable|string',
        ]);

        $perPage = $validated['per_page'] ?? 20;

        $hasUserId = Schema::hasColumn('domain_check_batches', 'user_id');
        $baseQuery = DB::table('domain_check_batches as b')
            ->select(
                'b.id',
                DB::raw('b.created_at as timestamp'),
                DB::raw('COUNT(r.id) as url_count'),
                DB::raw('ROUND(100 * SUM(CASE WHEN r.http_status BETWEEN 200 AND 399 THEN 1 ELSE 0 END) / NULLIF(COUNT(r.id),0)) as success_rate')
            )
            ->leftJoin('domain_check_results as r', 'r.batch_id', '=', 'b.id')
            ->groupBy('b.id', 'b.created_at')
            ->orderBy('b.created_at', 'desc');

        // Show all data to all users (guests, regular users, and admins)
        // No filtering by user_id - everyone sees everything

        $rows = $baseQuery->limit($perPage)->get();

        $items = $rows->map(function ($row) {
            return [
                'id' => (string)$row->id,
                'command' => null,
                'url_count' => (int)($row->url_count ?? 0),
                'success_rate' => (int)($row->success_rate ?? 0),
                'primary_dns' => '',
                'secondary_dns' => '',
                'timestamp' => optional($row->timestamp)->format('Y-m-d H:i:s') ?? now()->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'success' => true,
            'history' => $items,
            'has_more' => false,
            'next_cursor' => null,
        ]);
    }

    public function deleteHistory(Request $request)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
        }

        $request->validate([
            'id' => 'required|string'
        ]);

        $batchId = $request->id;
        $hasUserId = Schema::hasColumn('domain_check_batches', 'user_id');
        $query = DB::table('domain_check_batches')->where('id', $batchId);
        if ($hasUserId) {
            $query->where('user_id', Auth::id());
        }
        $deleted = $query->delete();
        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'History item not found'], 404);
        }
        Cache::increment('history:user:' . Auth::id() . ':v');
        return response()->json(['success' => true, 'message' => 'History item deleted']);
    }

    public function clearHistory()
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
        }

        $hasUserId = Schema::hasColumn('domain_check_batches', 'user_id');
        $query = DB::table('domain_check_batches');
        if ($hasUserId) {
            $query->where('user_id', Auth::id());
        }
        $query->delete();
        
        // bump cache version to invalidate history cache
        Cache::increment('history:user:' . Auth::id() . ':v');

        return response()->json([
            'success' => true,
            'message' => 'History cleared'
        ]);
    }

    public function getHistoryDetails(Request $request)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
        }

        $request->validate([
            'id' => 'required|string'
        ]);

        $batchId = $request->id;
        $hasUserId = Schema::hasColumn('domain_check_batches', 'user_id');
        $batchQuery = DB::table('domain_check_batches')->where('id', $batchId);
        if ($hasUserId) {
            $batchQuery->where('user_id', Auth::id());
        }
        $batch = $batchQuery->first();
        if (!$batch) {
            return response()->json(['success' => false, 'message' => 'History item not found'], 404);
        }

        $rows = DB::table('domain_check_results')->where('batch_id', $batchId)->orderBy('checked_at', 'desc')->get();
        $results = $rows->map(function ($r) {
            $remark = !empty($r->remark) ? json_decode($r->remark, true) : null;
            $status = (int)($r->http_status ?? 0);
            return [
                'url' => $r->domain_name,
                'status' => $status,
                'time' => $remark['time'] ?? 0,
                'accessible' => $remark['accessible'] ?? ($status >= 200 && $status < 400),
                'timestamp' => $r->checked_at,
                'error' => null,
                'remark' => $r->remark,
            ];
        })->values();

        $accessibleCount = $results->where('accessible', true)->count();
        return response()->json([
            'success' => true,
            'details' => [
                'id' => (string)$batchId,
                'command' => $batch->note,
                'url_count' => $results->count(),
                'success_rate' => $results->count() ? round(100 * $accessibleCount / $results->count()) : 0,
                'primary_dns' => '',
                'secondary_dns' => '',
                'timestamp' => $batch->created_at,
                'results' => $results,
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

        return $this->getChartDataFromNewTables($request);
    }

    private function getChartDataFromNewTables(Request $request)
    {
        $userId = Auth::id();
        $query = DB::table('domain_check_batches as b');
        
        // Show all data to all users (guests, regular users, and admins)
        // No filtering by user_id - everyone sees everything

        switch ($request->filter) {
            case '7days':
                $query->where('b.created_at', '>=', now()->subDays(7));
                break;
            case '1month':
                $query->where('b.created_at', '>=', now()->subMonth());
                break;
            case '3months':
                $query->where('b.created_at', '>=', now()->subMonths(3));
                break;
            case 'custom':
                if ($request->start_date && $request->end_date) {
                    $query->whereBetween('b.created_at', [$request->start_date, $request->end_date]);
                }
                break;
        }

        $batches = $query->orderBy('b.created_at', 'asc')->get();

        // Group by date
        $groupedData = $batches->groupBy(function ($batch) {
            return Carbon::parse($batch->created_at)->format('Y-m-d');
        })->map(function ($dayBatches) use ($userId) {
            $batchIds = $dayBatches->pluck('id');
            
            // Get results for these batches
            $results = DB::table('domain_check_results')
                ->whereIn('batch_id', $batchIds)
                ->get();

            $totalUrls = $results->count();
            $successfulUrls = $results->where('http_status', '>=', 200)->where('http_status', '<', 400)->count();
            $failedUrls = $totalUrls - $successfulUrls;
            $successRate = $totalUrls > 0 ? round(($successfulUrls / $totalUrls) * 100, 2) : 0;

            return [
                'success_rate' => $successRate,
                'url_count' => $totalUrls,
                'success_urls' => $successfulUrls,
                'failed_urls' => $failedUrls,
                'checks' => $dayBatches->count(),
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
                'checks' => $item['checks'],
            ];
        })->values();

        // Calculate overall stats
        $totalBatches = $batches->count();
        $allResults = DB::table('domain_check_results as r')
            ->join('domain_check_batches as b', 'r.batch_id', '=', 'b.id');
            
        // Show all data to all users (guests, regular users, and admins)
        // No filtering by user_id - everyone sees everything

        // Apply same date filters to results
        switch ($request->filter) {
            case '7days':
                $allResults->where('b.created_at', '>=', now()->subDays(7));
                break;
            case '1month':
                $allResults->where('b.created_at', '>=', now()->subMonth());
                break;
            case '3months':
                $allResults->where('b.created_at', '>=', now()->subMonths(3));
                break;
            case 'custom':
                if ($request->start_date && $request->end_date) {
                    $allResults->whereBetween('b.created_at', [$request->start_date, $request->end_date]);
                }
                break;
        }

        $resultsData = $allResults->get();
        $totalUrls = $resultsData->count();
        $totalSuccessful = $resultsData->where('http_status', '>=', 200)->where('http_status', '<', 400)->count();
        $avgSuccessRate = $totalUrls > 0 ? round(($totalSuccessful / $totalUrls) * 100, 2) : 0;

        return response()->json([
            'success' => true,
            'data' => $chartData,
            'total_checks' => $totalBatches,
            'avg_success_rate' => $avgSuccessRate,
            'total_urls' => $totalUrls,
        ]);
    }

    /**
     * Grouped history like legacy history_db.php: grouped by command with nested batches and results.
     */
    public function getGroupedHistory(Request $request)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
        }

        $userId = Auth::id();

        $batchesQuery = DB::table('domain_check_batches as b')
            ->select('b.id as batch_id', 'b.note as command', 'b.created_at as timestamp')
            ->orderBy('b.created_at', 'desc');

        // Show all data to all users (guests, regular users, and admins)
        // No filtering by user_id - everyone sees everything

        $batches = $batchesQuery->get();
        if ($batches->isEmpty()) {
            return response()->json(['success' => true, 'history' => []]);
        }

        $batchIds = $batches->pluck('batch_id')->all();

        $results = DB::table('domain_check_results')
            ->whereIn('batch_id', $batchIds)
            ->orderBy('checked_at', 'desc')
            ->get()
            ->groupBy('batch_id');

        $commandGroups = [];

        foreach ($batches as $b) {
            $batchResultsRaw = $results->get($b->batch_id, collect());
            $batchResults = [];
            $accessibleCount = 0;

            foreach ($batchResultsRaw as $r) {
                $remarkData = null;
                if (!empty($r->remark)) {
                    $decoded = json_decode($r->remark, true);
                    if (is_array($decoded)) {
                        $remarkData = $decoded;
                    }
                }

                $status = (int)($r->http_status ?? 0);
                $isAccessible = $status >= 200 && $status < 400;
                if ($isAccessible || (!is_null($remarkData) && !empty($remarkData['accessible']))) {
                    $accessibleCount++;
                }

                $batchResults[] = [
                    'url' => $r->domain_name,
                    'status' => $status,
                    'time' => $remarkData['time'] ?? 0,
                    'accessible' => $remarkData['accessible'] ?? $isAccessible,
                    'timestamp' => $r->checked_at,
                    'error' => null,
                    'remark' => $r->remark,
                ];
            }

            // Extract DNS from first result remark
            $primaryDns = 'System Default';
            $secondaryDns = '0.0.0.0';
            if (!empty($batchResults)) {
                $firstRemark = $batchResults[0]['remark'] ?? null;
                if (!empty($firstRemark)) {
                    $decoded = json_decode($firstRemark, true);
                    if (is_array($decoded)) {
                        if (!empty($decoded['used_dns'])) {
                            $primaryDns = $decoded['used_dns'];
                        }
                        if (!empty($decoded['secondary_dns'])) {
                            $secondaryDns = $decoded['secondary_dns'];
                        }
                    }
                }
            }

            $urlCount = count($batchResults);
            $successRate = $urlCount > 0 ? round(100 * $accessibleCount / $urlCount) : 0;

            $batchPayload = [
                'id' => (string)$b->batch_id,
                'command' => $b->command,
                'urlCount' => $urlCount,
                'results' => $batchResults,
                'timestamp' => $b->timestamp,
                'successRate' => $successRate,
                'primaryDns' => $primaryDns,
                'secondaryDns' => $secondaryDns,
            ];

            $groupKey = $b->command ?? '';
            if (!isset($commandGroups[$groupKey])) {
                $commandGroups[$groupKey] = [
                    'command' => $groupKey,
                    'totalUrls' => 0,
                    'totalAccessible' => 0,
                    'batches' => [],
                    'latestTimestamp' => null,
                    'primaryDns' => $primaryDns,
                    'secondaryDns' => $secondaryDns,
                ];
            }

            $commandGroups[$groupKey]['batches'][] = $batchPayload;
            $commandGroups[$groupKey]['totalUrls'] += $urlCount;
            $commandGroups[$groupKey]['totalAccessible'] += $accessibleCount;
            if (!$commandGroups[$groupKey]['latestTimestamp'] || $b->timestamp > $commandGroups[$groupKey]['latestTimestamp']) {
                $commandGroups[$groupKey]['latestTimestamp'] = $b->timestamp;
            }
        }

        $history = [];
        foreach ($commandGroups as $group) {
            $avgSuccessRate = $group['totalUrls'] > 0 ? round(($group['totalAccessible'] / $group['totalUrls']) * 100) : 0;
            $history[] = [
                'command' => $group['command'],
                'totalUrls' => $group['totalUrls'],
                'avgSuccessRate' => $avgSuccessRate,
                'latestTimestamp' => $group['latestTimestamp'],
                'batches' => $group['batches'],
                'primaryDns' => $group['primaryDns'],
                'secondaryDns' => $group['secondaryDns'] ?? '0.0.0.0',
            ];
        }

        return response()->json(['success' => true, 'history' => $history]);
    }

    /**
     * Bulk delete batches by CSV ids (like legacy delete_batch action).
     */
    public function deleteHistoryBatches(Request $request)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
        }

        $request->validate([
            'ids' => 'required|string'
        ]);

        $ids = array_values(array_filter(array_map('trim', explode(',', $request->ids))));
        if (empty($ids)) {
            return response()->json(['success' => false, 'message' => 'No ids provided'], 400);
        }

        $query = DB::table('domain_check_batches')->whereIn('id', $ids);
        if (Schema::hasColumn('domain_check_batches', 'user_id')) {
            $query->where('user_id', Auth::id());
        }

        $deleted = $query->delete();
        Cache::increment('history:user:' . Auth::id() . ':v');

        return response()->json(['success' => true, 'deleted' => $deleted]);
    }
}
