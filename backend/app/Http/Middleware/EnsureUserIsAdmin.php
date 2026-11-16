<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param Closure(Request): (Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        //Request user obtiene el usuario autenticado, si no hay usuario autenticado, devuelve null.
        if (!$request->user() || $request->user()->role !== 'ADMIN') { //Comprueba que tenga el rol de administrador, si no lo tiene, devuelve un error 403.
            return response()->json([
                'message' => 'No autorizado. Se requieren permisos de administrador.'
            ], 403);
        }

        return $next($request);
    }
}