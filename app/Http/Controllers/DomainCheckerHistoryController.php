<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DomainCheckerHistoryController extends Controller
{
    /**
     * Update a history item's command
     */
    /**
     * Delete a specific domain result from a batch
     */
    public function deleteResult(Request $request)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
        }

        // Check if user has admin role
        $user = Auth::user();
        $hasAdminRole = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('model_has_roles.model_id', $user->id)
            ->where('model_has_roles.model_type', 'App\\Models\\User')
            ->where('roles.name', 'admin')
            ->exists();
            
        if (!$hasAdminRole) {
            return response()->json(['success' => false, 'message' => 'Admin privileges required'], 403);
        }

        $request->validate([
            'batchId' => 'required|string',
            'domainName' => 'required|string',
        ]);

        try {
            // Delete the specific result
            $deleted = DB::table('domain_check_results')
                ->where('batch_id', $request->batchId)
                ->where('domain_name', $request->domainName)
                ->delete();

            if ($deleted === 0) {
                return response()->json(['success' => false, 'message' => 'Domain result not found'], 404);
            }

            // Check if batch is now empty and delete it if it is
            $remainingResults = DB::table('domain_check_results')
                ->where('batch_id', $request->batchId)
                ->count();

            if ($remainingResults === 0) {
                DB::table('domain_check_batches')
                    ->where('id', $request->batchId)
                    ->delete();
            }

            // Increment cache version to invalidate caches
            Cache::increment('history:user:' . Auth::id() . ':v');

            return response()->json([
                'success' => true,
                'message' => 'Domain result deleted successfully',
                'batchEmpty' => $remainingResults === 0
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete domain result: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'batch_id' => $request->batchId,
                'domain_name' => $request->domainName,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'message' => 'Database error occurred while deleting'], 500);
        }
    }

    public function updateHistoryItem(Request $request)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
        }

        // Check if user has admin role
        $user = Auth::user();
        $hasAdminRole = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('model_has_roles.model_id', $user->id)
            ->where('model_has_roles.model_type', 'App\\Models\\User')
            ->where('roles.name', 'admin')
            ->exists();
            
        if (!$hasAdminRole) {
            return response()->json(['success' => false, 'message' => 'Admin privileges required'], 403);
        }

        $request->validate([
            'oldCommand' => 'required|string',
            'newCommand' => 'required|string|max:255'
        ]);

        try {
            // Update all batches with the old command
            $updated = DB::table('domain_check_batches')
                ->where('note', $request->oldCommand)
                ->update(['note' => $request->newCommand]);

            if ($updated === 0) {
                return response()->json(['success' => false, 'message' => 'No matching history items found'], 404);
            }

            // Increment cache version to invalidate caches
            Cache::increment('history:user:' . Auth::id() . ':v');

            return response()->json([
                'success' => true,
                'message' => 'History item updated successfully',
                'updated' => $updated
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update history item: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'old_command' => $request->oldCommand,
                'new_command' => $request->newCommand,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'message' => 'Database error occurred while updating'], 500);
        }
    }
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
                DB::raw("ROUND(100 * SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(r.remark, '$.accessible')) = 'true' THEN 1 ELSE 0 END) / NULLIF(COUNT(r.id),0)) as success_rate")
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
                'command' => (string)$row->id, // Use ID as command identifier
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

        // Check if user has admin role
        $user = Auth::user();
        // Check if user has admin role using direct database query
        $hasAdminRole = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('model_has_roles.model_id', $user->id)
            ->where('model_has_roles.model_type', 'App\\Models\\User')
            ->where('roles.name', 'admin')
            ->exists();
        if (!$hasAdminRole) {
            return response()->json(['success' => false, 'message' => 'Admin privileges required'], 403);
        }

        $request->validate([
            'id' => 'required|string'
        ]);

        $batchId = $request->id; // This is the batch ID
        
        // Delete the specific batch by ID
        $hasUserId = Schema::hasColumn('domain_check_batches', 'user_id');
        $query = DB::table('domain_check_batches')->where('id', $batchId);
        
        // Check if the batch exists first
        $batch = $query->first();
        if (!$batch) {
            return response()->json(['success' => false, 'message' => 'History item not found'], 404);
        }
        
        // For admin users, they can delete any history item
        // For regular users, they can only delete their own history items
        if ($hasUserId && !$hasAdminRole) {
            $query->where('user_id', Auth::id());
        }
        
        try {
            // Since we have cascade delete, we only need to delete the batch
            // The related results will be automatically deleted by the database
            $deleted = $query->delete();
            
            if ($deleted == 0) {
                return response()->json(['success' => false, 'message' => 'Failed to delete batch'], 500);
            }
            
            Cache::increment('history:user:' . Auth::id() . ':v');
            return response()->json([
                'success' => true, 
                'message' => 'History item deleted',
                'batch_deleted' => $deleted
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to delete history item: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'batch_id' => $batchId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'message' => 'Database error occurred while deleting'], 500);
        }
    }

    public function clearHistory()
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
        }

        // Check if user has admin role
        $user = Auth::user();
        // Check if user has admin role using direct database query
        $hasAdminRole = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('model_has_roles.model_id', $user->id)
            ->where('model_has_roles.model_type', 'App\\Models\\User')
            ->where('roles.name', 'admin')
            ->exists();
        if (!$hasAdminRole) {
            return response()->json(['success' => false, 'message' => 'Admin privileges required'], 403);
        }

        // Since we have cascade delete, we only need to delete the batches
        // The related results will be automatically deleted by the database
        $hasUserId = Schema::hasColumn('domain_check_batches', 'user_id');
        $batchQuery = DB::table('domain_check_batches');
        
        // For admin users, they can clear all history
        // For regular users, they can only clear their own history
        if ($hasUserId && !$hasAdminRole) {
            $batchQuery->where('user_id', Auth::id());
        }
        
        try {
            $batchesDeleted = $batchQuery->delete();
            
            // bump cache version to invalidate history cache
            Cache::increment('history:user:' . Auth::id() . ':v');

            return response()->json([
                'success' => true,
                'message' => 'History cleared',
                'batches_deleted' => $batchesDeleted
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to clear history: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'message' => 'Database error occurred while clearing history'], 500);
        }
    }

    public function getHistoryDetails(Request $request)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['success' => false, 'message' => 'Authentication required'], 401);
        }

        // Check if user has admin role
        $user = Auth::user();
        // Check if user has admin role using direct database query
        $hasAdminRole = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('model_has_roles.model_id', $user->id)
            ->where('model_has_roles.model_type', 'App\\Models\\User')
            ->where('roles.name', 'admin')
            ->exists();

        $request->validate([
            'id' => 'required|string'
        ]);

        $batchId = $request->id;
        $hasUserId = Schema::hasColumn('domain_check_batches', 'user_id');
        $batchQuery = DB::table('domain_check_batches')->where('id', $batchId);
        
        // For admin users, they can view any history details
        // For regular users, they can only view their own history details
        if ($hasUserId && !$hasAdminRole) {
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
        $batchesQuery = DB::table('domain_check_batches as b');
        $resultsQuery = DB::table('domain_check_results as r')
            ->join('domain_check_batches as b', 'r.batch_id', '=', 'b.id');

        switch ($request->filter) {
            case '7days':
                $from = now()->subDays(7);
                $batchesQuery->where('b.created_at', '>=', $from);
                $resultsQuery->where('b.created_at', '>=', $from);
                break;
            case '1month':
                $from = now()->subMonth();
                $batchesQuery->where('b.created_at', '>=', $from);
                $resultsQuery->where('b.created_at', '>=', $from);
                break;
            case '3months':
                $from = now()->subMonths(3);
                $batchesQuery->where('b.created_at', '>=', $from);
                $resultsQuery->where('b.created_at', '>=', $from);
                break;
            case 'custom':
                if ($request->start_date && $request->end_date) {
                    $range = [$request->start_date, $request->end_date];
                    $batchesQuery->whereBetween('b.created_at', $range);
                    $resultsQuery->whereBetween('b.created_at', $range);
                }
                break;
        }

        // Aggregate by day directly in SQL to avoid loading large collections into PHP memory.
        $dailyRows = (clone $resultsQuery)
            ->selectRaw('DATE(b.created_at) as day')
            ->selectRaw('COUNT(*) as url_count')
            ->selectRaw("SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(r.remark, '$.accessible')) = 'true' THEN 1 ELSE 0 END) as success_urls")
            ->selectRaw("SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(r.remark, '$.result_kind')) = 'not_existed' OR r.http_status = 404 THEN 1 ELSE 0 END) as not_existed_urls")
            ->groupBy('day')
            ->orderBy('day', 'asc')
            ->get();

        $dailyChecks = (clone $batchesQuery)
            ->selectRaw('DATE(b.created_at) as day')
            ->selectRaw('COUNT(*) as checks')
            ->groupBy('day')
            ->pluck('checks', 'day');

        $chartData = $dailyRows->map(function ($row) use ($dailyChecks) {
            $urlCount = (int)$row->url_count;
            $successUrls = (int)$row->success_urls;
            $notExistedUrls = (int)$row->not_existed_urls;
            $failedUrls = max(0, $urlCount - $successUrls - $notExistedUrls);
            $successRate = $urlCount > 0 ? round(($successUrls / $urlCount) * 100, 2) : 0;

            return [
                'name' => $row->day,
                'success_rate' => $successRate,
                'url_count' => $urlCount,
                'success_urls' => $successUrls,
                'failed_urls' => $failedUrls,
                'not_existed_urls' => $notExistedUrls,
                'checks' => (int)($dailyChecks[$row->day] ?? 0),
            ];
        })->values();

        $totalBatches = (clone $batchesQuery)->count();
        $totals = (clone $resultsQuery)
            ->selectRaw('COUNT(*) as total_urls')
            ->selectRaw("SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(r.remark, '$.accessible')) = 'true' THEN 1 ELSE 0 END) as total_successful")
            ->selectRaw("SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(r.remark, '$.result_kind')) = 'not_existed' OR r.http_status = 404 THEN 1 ELSE 0 END) as total_not_existed")
            ->first();

        $totalUrls = (int)($totals->total_urls ?? 0);
        $totalSuccessful = (int)($totals->total_successful ?? 0);
        $totalNotExisted = (int)($totals->total_not_existed ?? 0);
        $avgSuccessRate = $totalUrls > 0 ? round(($totalSuccessful / $totalUrls) * 100, 2) : 0;

        return response()->json([
            'success' => true,
            'data' => $chartData,
            'total_checks' => $totalBatches,
            'avg_success_rate' => $avgSuccessRate,
            'total_urls' => $totalUrls,
            'total_not_existed' => $totalNotExisted,
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

        $request->validate([
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $limit = (int)($request->input('limit', 20));

        $batchesQuery = DB::table('domain_check_batches as b')
            ->select('b.id as batch_id', 'b.note as command', 'b.created_at as timestamp')
            ->orderBy('b.created_at', 'desc')
            ->limit($limit);

        // Show all data to all users (guests, regular users, and admins)
        // No filtering by user_id - everyone sees everything

        $batches = $batchesQuery->get();
        if ($batches->isEmpty()) {
            return response()->json(['success' => true, 'history' => []]);
        }

        $batchIds = $batches->pluck('batch_id')->all();

        // Aggregate totals in SQL to avoid loading all rows into PHP memory.
        $batchStats = DB::table('domain_check_results')
            ->whereIn('batch_id', $batchIds)
            ->selectRaw('batch_id, COUNT(*) as total_urls')
            ->selectRaw("SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(remark, '$.accessible')) = 'true' THEN 1 ELSE 0 END) as accessible_count")
            ->groupBy('batch_id')
            ->get()
            ->keyBy('batch_id');

        // Fetch all results per batch for history page rendering as requested.
        $resultsByBatch = [];
        foreach ($batchIds as $batchId) {
            $resultsByBatch[$batchId] = DB::table('domain_check_results')
                ->where('batch_id', $batchId)
                ->orderBy('checked_at', 'desc')
                ->get();
        }

        $commandGroups = [];

        foreach ($batches as $b) {
            $batchResultsRaw = $resultsByBatch[$b->batch_id] ?? collect();
            $batchResults = [];

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
                $resultKind = is_array($remarkData) ? ($remarkData['result_kind'] ?? null) : null;

                $batchResults[] = [
                    'url' => $r->domain_name,
                    'status' => $status,
                    'time' => $remarkData['time'] ?? 0,
                    'accessible' => $remarkData['accessible'] ?? $isAccessible,
                    'result_kind' => $resultKind,
                    'timestamp' => $r->checked_at,
                    'error' => null,
                    'remark' => $r->remark,
                ];
            }

            // DNS is no longer persisted in remark payload.
            $primaryDns = 'System Default';
            $secondaryDns = '0.0.0.0';

            $stats = $batchStats->get($b->batch_id);
            $urlCount = (int)($stats->total_urls ?? 0);
            $accessibleCount = (int)($stats->accessible_count ?? 0);
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

        // Check if user has admin role
        $user = Auth::user();
        // Check if user has admin role using direct database query
        $hasAdminRole = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('model_has_roles.model_id', $user->id)
            ->where('model_has_roles.model_type', 'App\\Models\\User')
            ->where('roles.name', 'admin')
            ->exists();
        if (!$hasAdminRole) {
            return response()->json(['success' => false, 'message' => 'Admin privileges required'], 403);
        }

        $request->validate([
            'ids' => 'required|string'
        ]);

        $ids = array_values(array_filter(array_map('trim', explode(',', $request->ids))));
        if (empty($ids)) {
            return response()->json(['success' => false, 'message' => 'No ids provided'], 400);
        }

        // Since we have cascade delete, we only need to delete the batches
        // The related results will be automatically deleted by the database
        $query = DB::table('domain_check_batches')->whereIn('id', $ids);
        
        // For admin users, they can delete any batches
        // For regular users, they can only delete their own batches
        if (Schema::hasColumn('domain_check_batches', 'user_id') && !$hasAdminRole) {
            $query->where('user_id', Auth::id());
        }

        try {
            $deleted = $query->delete();
            
            // If no batches were deleted, check if it's due to user permission
            if ($deleted == 0) {
                $totalBatches = DB::table('domain_check_batches')->whereIn('id', $ids)->count();
                
                if ($totalBatches > 0) {
                    if ($hasAdminRole) {
                        return response()->json([
                            'success' => false, 
                            'message' => 'Failed to delete batches. Some items may not exist.',
                            'deleted' => 0
                        ], 500);
                    } else {
                        $userBatches = DB::table('domain_check_batches')->whereIn('id', $ids)->where('user_id', Auth::id())->count();
                        if ($userBatches == 0) {
                            return response()->json([
                                'success' => false, 
                                'message' => 'You can only delete your own history items',
                                'deleted' => 0
                            ], 500);
                        }
                    }
                }
            }
            
            Cache::increment('history:user:' . Auth::id() . ':v');

            return response()->json(['success' => true, 'deleted' => $deleted]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to delete history batches: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'batch_ids' => $ids,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'message' => 'Database error occurred while deleting batches'], 500);
        }
    }
}
