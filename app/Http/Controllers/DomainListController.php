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

}

