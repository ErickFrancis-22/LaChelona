<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AdminClientController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'LaChelona API'
    ]);
});

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

//Grupo de rutas que requieren autenticación con Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);   
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::patch('/orders/{id}/cancel', [OrderController::class, 'cancel']);
});

// Rutas exclusivas para ADMIN
Route::prefix('admin')
    ->middleware(['auth:sanctum', 'admin'])
    ->group(function () {
        Route::get('/clients', [AdminClientController::class, 'index']);
        Route::post('/clients', [AdminClientController::class, 'store']);
        Route::get('/clients/{id}', [AdminClientController::class, 'show']);
        Route::put('/clients/{id}', [AdminClientController::class, 'update']);
        Route::patch('/clients/{id}/status', [AdminClientController::class, 'updateStatus']);
        // TT34, TT35, TT36...
    });