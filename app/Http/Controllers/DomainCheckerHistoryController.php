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
}
