<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

//Con este endpoint se puede:
//GET /api/admin/clients → Lista todos  
//GET /api/admin/clients?search=tienda → busca por negocio, contacto, correo o username
//GET /api/admin/clients?active=true → lista los clientes activos
//GET /api/admin/clients?active=false → lista los clientes inactivos
//GET /api/admin/clients?search=erick&active=true → se puede combinar búsqueda y filtro de activos/inactivos 
class AdminClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Client::query()
            ->with('user');

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('business_name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('username', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('active')) {
            $active = filter_var(
                $request->input('active'),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($active !== null) {
                $query->whereHas('user', function ($userQuery) use ($active) {
                    $userQuery->where('active', $active);
                });
            }
        }

        $clients = $query
            ->orderBy('business_name')
            ->get();

        return response()->json([
            'data' => $clients,
        ]);
    }

    public function show(int $id): JsonResponse
    {
    $client = Client::with([
        'user',
        'orders' => function ($query) {
            $query->latest();
        },
    ])->findOrFail($id);

    return response()->json([
        'data' => $client,
    ]);
    }

    public function store(Request $request): JsonResponse
    {
    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'username' => ['required', 'string', 'max:255', 'unique:users,username'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        'password' => ['required', 'string', 'min:8', 'confirmed'],

        'business_name' => ['required', 'string', 'max:255'],
        'contact_name' => ['required', 'string', 'max:255'],
        'phone' => ['required', 'string', 'max:20'],
        'address' => ['required', 'string', 'max:255'],
        'address_reference' => ['nullable', 'string', 'max:255'],
        'latitude' => ['nullable', 'numeric', 'between:-90,90'],
        'longitude' => ['nullable', 'numeric', 'between:-180,180'],
    ]);

    $client = DB::transaction(function () use ($validated) {
        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'CLIENT',
            'active' => true,
        ]);

        return Client::create([
            'user_id' => $user->id,
            'business_name' => $validated['business_name'],
            'contact_name' => $validated['contact_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'address' => $validated['address'],
            'address_reference' => $validated['address_reference'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
        ]);
    });

    $client->load('user');

    return response()->json([
        'message' => 'Cliente creado correctamente.',
        'data' => $client,
    ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
    $client = Client::with('user')->findOrFail($id);
    $user = $client->user;

    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'username' => [
            'required',
            'string',
            'max:255',
            Rule::unique('users', 'username')->ignore($user->id),
        ],
        'email' => [
            'required',
            'email',
            'max:255',
            Rule::unique('users', 'email')->ignore($user->id),
        ],

        'business_name' => ['required', 'string', 'max:255'],
        'contact_name' => ['required', 'string', 'max:255'],
        'phone' => ['required', 'string', 'max:20'],
        'address' => ['required', 'string', 'max:255'],
        'address_reference' => ['nullable', 'string', 'max:255'],
        'latitude' => ['nullable', 'numeric', 'between:-90,90'],
        'longitude' => ['nullable', 'numeric', 'between:-180,180'],
    ]);

    DB::transaction(function () use ($validated, $client, $user) {
        $user->update([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
        ]);

        $client->update([
            'business_name' => $validated['business_name'],
            'contact_name' => $validated['contact_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'address' => $validated['address'],
            'address_reference' => $validated['address_reference'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
        ]);
    });

    $client->load('user');

    return response()->json([
        'message' => 'Cliente actualizado correctamente.',
        'data' => $client,
    ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
    $validated = $request->validate([
        'active' => ['required', 'boolean'],
    ]);

    $client = Client::with('user')->findOrFail($id);

    $client->user->update([
        'active' => $validated['active'],
    ]);

    $client->load('user');

    return response()->json([
        'message' => $validated['active']
            ? 'Cliente activado correctamente.'
            : 'Cliente desactivado correctamente.',
        'data' => $client,
    ]);
    }
}