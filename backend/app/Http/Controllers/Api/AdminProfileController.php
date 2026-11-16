<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminProfileController extends Controller
{
    /**
     * Devuelve la información del administrador autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'active' => $user->active,
            ],
        ]);
    }

    /**
     * Actualiza los campos permitidos del perfil administrativo.
     *
     * El username no es editable desde este endpoint.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
        ]);

        $user->update([
            'name' => $validated['name'],
        ]);

        return response()->json([
            'message' => 'Perfil administrativo actualizado correctamente.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'active' => $user->active,
            ],
        ]);
    }

    /**
     * Cambia la contraseña del administrador autenticado.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => [
                'required',
                'string',
            ],
            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        if (!Hash::check(
            $validated['current_password'],
            $user->password
        )) {
            throw ValidationException::withMessages([
                'current_password' => [
                    'La contraseña actual es incorrecta.',
                ],
            ]);
        }

        $user->update([
            'password' => Hash::make(
                $validated['new_password']
            ),
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada correctamente.',
        ]);
    }
}