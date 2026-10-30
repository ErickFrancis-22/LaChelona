<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AdminClientController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\Api\AdminInventoryController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminInvoiceController;
use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\AdminCategoryController;
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

    //Clientes
        Route::get('/clients', [AdminClientController::class, 'index']);
        Route::post('/clients', [AdminClientController::class, 'store']);
        Route::get('/clients/{id}', [AdminClientController::class, 'show']);
        Route::put('/clients/{id}', [AdminClientController::class, 'update']);
        Route::patch('/clients/{id}/status', [AdminClientController::class, 'updateStatus']);
    
    //Productos
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::post('/products', [AdminProductController::class, 'store']);
        Route::get('/products/{id}', [AdminProductController::class, 'show']);
        Route::put('/products/{id}', [AdminProductController::class, 'update']);
        Route::patch('/products/{id}/status', [AdminProductController::class, 'updateStatus']);
        
    //Inventario
        Route::get('/inventory', [AdminInventoryController::class, 'index']);
        Route::get('/inventory/movements', [AdminInventoryController::class, 'movements']);
        Route::post('/inventory/entries', [AdminInventoryController::class, 'entry']);
        Route::post('/inventory/adjustments', [AdminInventoryController::class, 'adjustment']);
       
    //Pedidos administrativos
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
        Route::patch('/orders/{id}/confirm', [AdminOrderController::class, 'confirm']);
        Route::patch('/orders/{id}/in-transit', [AdminOrderController::class, 'markInTransit']);
        Route::patch('/orders/{id}/deliver', [AdminOrderController::class, 'deliver']);

    //Comprobantes
        Route::post('/orders/{id}/invoice', [AdminInvoiceController::class, 'store']);
        Route::get('/orders/{id}/invoice', [AdminInvoiceController::class, 'show']);

    //Reportes mensuales
        Route::get('/reports/monthly', [AdminReportController::class, 'monthly']);

    // Categorías
        Route::get('/categories', [AdminCategoryController::class, 'index']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::get('/categories/{id}', [AdminCategoryController::class, 'show']);
        Route::put('/categories/{id}', [AdminCategoryController::class, 'update']);
        Route::patch('/categories/{id}/status', [AdminCategoryController::class, 'updateStatus']);
    });
    