<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DomainLink;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class DomainListController extends Controller
{
    public function index()
    {
        $domainLinks = DomainLink::where('is_active', true)->get();
        return Inertia::render('DomainList/index', [
            'domainLinks' => $domainLinks
        ]);
    }

}

