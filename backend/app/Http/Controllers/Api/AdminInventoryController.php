<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminInventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category');

        if ($request->filled('search')) {
            $search = $request->string('search');

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('stock', '<=', 'minimum_stock');
        }

        $products = $query
            ->orderBy('name')
            ->get()
            ->map(function ($product) {
                $product->low_stock = $product->stock <= $product->minimum_stock;

                return $product;
            });

        return response()->json([
            'data' => $products,
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = InventoryMovement::with([
            'product',
            'user',
            'order',
        ]);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        if ($request->filled('type')) {
            $query->where(
                'type',
                strtoupper($request->string('type'))
            );
        }

        $movements = $query
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $movements,
        ]);
    }

    public function entry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id'),
            ],
            'quantity' => [
                'required',
                'integer',
                'min:1',
            ],
            'reason' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $product = $this->inventoryService->registerEntry(
            $validated['product_id'],
            $validated['quantity'],
            $request->user(),
            $validated['reason'] ?? null
        );

        $product->low_stock = $product->stock <= $product->minimum_stock;

        return response()->json([
            'message' => 'Entrada de inventario registrada correctamente.',
            'data' => $product,
        ], 201);
    }

    public function adjustment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id'),
            ],
            'new_stock' => [
                'required',
                'integer',
                'min:0',
            ],
            'reason' => [
                'required',
                'string',
                'max:255',
            ],
        ]);

        $product = $this->inventoryService->registerAdjustment(
            $validated['product_id'],
            $validated['new_stock'],
            $request->user(),
            $validated['reason']
        );

        $product->low_stock = $product->stock <= $product->minimum_stock;

        return response()->json([
            'message' => 'Ajuste de inventario registrado correctamente.',
            'data' => $product,
        ]);
    }
}