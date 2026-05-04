<?php

namespace App\Http\Controllers;

use App\Models\DomainLink;
use Illuminate\Http\Request;

class DomainLinkController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'badge' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'url' => 'required|url|max:255',
            'is_active' => 'boolean',
        ]);

        DomainLink::create($validated);

        return redirect()->back()->with('success', 'Domain Link created successfully.');
    }

    public function update(Request $request, DomainLink $domainLink)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'badge' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'url' => 'required|url|max:255',
            'is_active' => 'boolean',
        ]);

        $domainLink->update($validated);

        return redirect()->back()->with('success', 'Domain Link updated successfully.');
    }

    public function destroy(DomainLink $domainLink)
    {
        $domainLink->delete();

        return redirect()->back()->with('success', 'Domain Link deleted successfully.');
    }
}
