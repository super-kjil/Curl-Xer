<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        \Illuminate\Support\Facades\Gate::authorize('view_activity_logs');

        $sort = $request->get('sort', 'created_at');
        $direction = $request->get('direction', 'desc');

        // Only allow sorting by created_at for now to prevent issues
        if ($sort !== 'created_at') {
            $sort = 'created_at';
        }

        $activities = Activity::with('causer')
            ->orderBy($sort, $direction)
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/ActivityLog', [
            'activities' => $activities,
            'filters' => [
                'sort' => $sort,
                'direction' => $direction,
            ],
            'can' => [
                'delete' => $request->user()->can('delete_activity_logs'),
            ],
        ]);
    }

    public function destroy(Activity $activity)
    {
        \Illuminate\Support\Facades\Gate::authorize('delete_activity_logs');
        
        $activity->delete();

        return redirect()->back()->with('success', 'Activity log deleted successfully.');
    }

    public function clear()
    {
        \Illuminate\Support\Facades\Gate::authorize('delete_activity_logs');
        
        Activity::truncate();

        return redirect()->back()->with('success', 'All activity logs cleared successfully.');
    }
}
