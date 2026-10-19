<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * Muestra una lista de productos activos.
     */
    public function index(): JsonResponse
    {
        $products = Product::with('category')
            ->where('active', true)
            ->get();

        return response()->json([
            'data' => $products->map(fn ($product) => $this->formatProduct($product)),
        ]);
    }

    /**
     * Muestra un producto específico por su ID.
     */
    public function show(int $id): JsonResponse
    {
        $product = Product::with('category')
            ->where('active', true)
            ->where('id', $id)
            ->first();

        if (!$product) {
            return response()->json([
                'message' => 'Producto no encontrado.'
            ], 404);
        }

        // Se incluye la descripción que es propia del detalle
        $data = $this->formatProduct($product);
        $data['description'] = $product->description;

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Formatea la estructura común de los datos de un producto.
     */
    private function formatProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'code' => $product->code,
            'name' => $product->name,
            'category' => [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ],
            'presentation' => $product->presentation,
            'package_type' => $product->package_type,
            'units_per_package' => $product->units_per_package,
            'sale_price' => $product->sale_price,
            'stock' => $product->stock,
            'image_url' => $product->image_url,
            'available' => $product->stock > 0,
        ];
    }
}