<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminCategoryController extends Controller
{
    /**
     * Lista todas las categorías, activas e inactivas.
     */
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Muestra una categoría específica.
     */
    public function show(int $id): JsonResponse
    {
        $category = Category::withCount('products')
            ->findOrFail($id);

        return response()->json([
            'data' => $category,
        ]);
    }

    /**
     * Crea una nueva categoría.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:categories,name',
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'sort_order' => [
                'required',
                'integer',
                'min:0',
            ],
            'active' => [
                'required',
                'boolean',
            ],
        ]);

        $imageUrl = null;

        if ($request->hasFile('image')) {
            $imageUrl = $this->uploadCategoryImage(
                $request->file('image')
            );

            if ($imageUrl === null) {
                return response()->json([
                    'message' => 'No se pudo subir la imagen de la categoría.',
                ], 500);
            }
        }

        $validated['image_url'] = $imageUrl;

        unset($validated['image']);

        $category = Category::create($validated);

        $category->loadCount('products');

        return response()->json([
            'message' => 'Categoría creada correctamente.',
            'data' => $category,
        ], 201);
    }

    /**
     * Actualiza una categoría existente.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'sort_order' => [
                'required',
                'integer',
                'min:0',
            ],
            'active' => [
                'required',
                'boolean',
            ],
        ]);

        if ($request->hasFile('image')) {
            $imageUrl = $this->uploadCategoryImage(
                $request->file('image')
            );

            if ($imageUrl === null) {
                return response()->json([
                    'message' => 'No se pudo subir la imagen de la categoría.',
                ], 500);
            }

            $validated['image_url'] = $imageUrl;
        }

        unset($validated['image']);

        $category->update($validated);

        $category->loadCount('products');

        return response()->json([
            'message' => 'Categoría actualizada correctamente.',
            'data' => $category,
        ]);
    }

    /**
     * Activa o desactiva una categoría.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'active' => [
                'required',
                'boolean',
            ],
        ]);

        $category = Category::findOrFail($id);

        $category->update([
            'active' => $validated['active'],
        ]);

        $category->loadCount('products');

        return response()->json([
            'message' => $validated['active']
                ? 'Categoría activada correctamente.'
                : 'Categoría desactivada correctamente.',
            'data' => $category,
        ]);
    }

    /**
     * Sube la imagen de una categoría a Supabase Storage.
     */
    private function uploadCategoryImage(UploadedFile $image): ?string
    {
        $supabaseUrl = config('services.supabase.url');
        $secretKey = config('services.supabase.secret_key');
        $bucket = config('services.supabase.storage_bucket');

        if (!$supabaseUrl || !$secretKey || !$bucket) {
            Log::error(
                'Faltan credenciales de Supabase en la configuración.'
            );

            return null;
        }

        $extension = strtolower(
            $image->getClientOriginalExtension()
        );

        $fileName = Str::uuid() . '.' . $extension;

        $path = 'categories/' . $fileName;

        $response = Http::withHeaders([
            'apikey' => $secretKey,
            'Content-Type' => $image->getMimeType(),
        ])
            ->withBody(
                file_get_contents($image->getRealPath()),
                $image->getMimeType()
            )
            ->post(
                "{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}"
            );

        if ($response->failed()) {
            Log::error(
                'Error al subir imagen de categoría a Supabase Storage',
                [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]
            );

            return null;
        }

        return "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}";
    }
}