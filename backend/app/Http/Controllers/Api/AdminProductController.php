<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with('category');

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('active')) {
            $active = filter_var(
                $request->input('active'),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($active !== null) {
                $query->where('active', $active);
            }
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

    public function show(int $id): JsonResponse
    {
        $product = Product::with('category')->findOrFail($id);
        $product->low_stock = $product->stock <= $product->minimum_stock;

        return response()->json([
            'data' => $product,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id'       => ['required', 'exists:categories,id'],
            'code'              => ['required', 'string', 'max:100', 'unique:products,code'],
            'name'              => ['required', 'string', 'max:255'],
            'description'       => ['nullable', 'string'],
            'package_type'      => ['required', 'in:FARDO,CAJA'],
            'units_per_package' => ['required', 'integer', 'min:1'],
            'sale_price'        => ['required', 'numeric', 'min:0'],
            'stock'             => ['required', 'integer', 'min:0'],
            'minimum_stock'     => ['required', 'integer', 'min:0'],
            'image'             => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'active'            => ['required', 'boolean'],
        ]);

        $imageUrl = null;

        if ($request->hasFile('image')) {
            $imageUrl = $this->uploadProductImage($request->file('image'));

            if ($imageUrl === null) {
                return response()->json([
                    'message' => 'No se pudo subir la imagen del producto.',
                ], 500);
            }
        }

        $validated['image_url'] = $imageUrl;
        unset($validated['image']);

        $product = Product::create($validated);
        $product->load('category');
        $product->low_stock = $product->stock <= $product->minimum_stock;

        return response()->json([
            'message' => 'Producto creado correctamente.',
            'data'    => $product,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'category_id'       => ['required', 'exists:categories,id'],
            'code'              => ['required', 'string', 'max:100', Rule::unique('products', 'code')->ignore($product->id)],
            'name'              => ['required', 'string', 'max:255'],
            'description'       => ['nullable', 'string'],
            'package_type'      => ['required', 'in:FARDO,CAJA'],
            'units_per_package' => ['required', 'integer', 'min:1'],
            'sale_price'        => ['required', 'numeric', 'min:0'],
            'minimum_stock'     => ['required', 'integer', 'min:0'],
            'image'             => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'active'            => ['required', 'boolean'],
        ]);

        if ($request->hasFile('image')) {
            $imageUrl = $this->uploadProductImage($request->file('image'));

            if ($imageUrl === null) {
                return response()->json([
                    'message' => 'No se pudo subir la imagen del producto.',
                ], 500);
            }

            $validated['image_url'] = $imageUrl;
        }

        unset($validated['image']);

        /*
         * El stock NO se actualiza aquí.
         * EN EL TT36 SE VERÁ ESO.
         */
        $product->update($validated);
        $product->load('category');
        $product->low_stock = $product->stock <= $product->minimum_stock;

        return response()->json([
            'message' => 'Producto actualizado correctamente.',
            'data'    => $product,
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'active' => ['required', 'boolean'],
        ]);

        $product = Product::findOrFail($id);
        $product->update([
            'active' => $validated['active'],
        ]);

        $product->load('category');
        $product->low_stock = $product->stock <= $product->minimum_stock;

        return response()->json([
            'message' => $validated['active']
                ? 'Producto activado correctamente.'
                : 'Producto desactivado correctamente.',
            'data'    => $product,
        ]);
    }

    private function uploadProductImage(UploadedFile $image): ?string
    {
        $supabaseUrl = config('services.supabase.url');
        $secretKey   = config('services.supabase.secret_key');
        $bucket      = config('services.supabase.storage_bucket');

        if (!$supabaseUrl || !$secretKey || !$bucket) {
            Log::error('Faltan credenciales de Supabase en la configuración.');
            return null;
        }

        $extension = strtolower($image->getClientOriginalExtension());
        $fileName  = Str::uuid() . '.' . $extension;
        $path      = 'products/' . $fileName;

        $response = Http::withHeaders([
            'apikey'        => $secretKey,
            'Content-Type'  => $image->getMimeType(),
        ])
        ->withBody(
            file_get_contents($image->getRealPath()),
            $image->getMimeType()
        )
        ->post("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");

        if ($response->failed()) {
            Log::error('Error al subir imagen a Supabase Storage', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            return null;
        }

        return "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}";
    }
}