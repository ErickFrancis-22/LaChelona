<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Muestra el perfil del cliente autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $client = $user->client;

        if (!$client) {
            return response()->json([
                'message' => 'Perfil de cliente no encontrado.'
            ], 404);
        }

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                ],
                'client' => [
                    'business_name' => $client->business_name,
                    'contact_name' => $client->contact_name,
                    'phone' => $client->phone,
                    'email' => $client->email,
                    'address' => $client->address,
                    'address_reference' => $client->address_reference,
                    'latitude' => $client->latitude,
                    'longitude' => $client->longitude,
                ],
            ]
        ]);
    }

    /**
     * Actualiza el perfil del cliente autenticado.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $client = $user->client;

        if (!$client) {
            return response()->json([
                'message' => 'Perfil de cliente no encontrado.'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,

            'business_name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',

            'address' => 'required|string',
            'address_reference' => 'nullable|string',

            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $client->update([
            'business_name' => $validated['business_name'],
            'contact_name' => $validated['contact_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'address' => $validated['address'],
            'address_reference' => $validated['address_reference'] ?? null,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
        ]);

        return response()->json([
            'message' => 'Perfil actualizado correctamente.'
        ]);
    }

    /**
     * Cambia la contraseña del usuario autenticado.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => [
                    'La contraseña actual es incorrecta.'
                ],
            ]);
        }

        $user->update([
            'password' => $validated['new_password'],
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada correctamente.'
        ]);
    }
}