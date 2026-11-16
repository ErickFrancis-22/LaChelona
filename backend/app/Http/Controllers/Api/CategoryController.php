<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Muestra el listado de categorías activas
     */
    public function index(): JsonResponse
    {
        $categories = Category::where('active', true)
            ->select([
                'id',
                'name',
                'description',
                'image_url',
                'sort_order',
            ])
            ->withCount([
                'products' => fn ($query) => $query->where('active', true),
            ])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }
}