<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function registerEntry(
        int $productId,
        int $quantity,
        User $user,
        ?string $reason = null
    ): Product {
        if ($quantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => [
                    'La cantidad debe ser mayor que cero.'
                ],
            ]);
        }

        return DB::transaction(function () use (
            $productId,
            $quantity,
            $user,
            $reason
        ) {
            $product = Product::whereKey($productId)
                ->lockForUpdate()
                ->firstOrFail();

            $product->stock += $quantity;
            $product->save();

            InventoryMovement::create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'order_id' => null,
                'type' => 'ENTRY',
                'quantity' => $quantity,
                'reason' => $reason,
                'created_at' => now(),
            ]);

            return $product->fresh('category');
        });
    }

    public function registerAdjustment(
        int $productId,
        int $newStock,
        User $user,
        ?string $reason = null
    ): Product {
        if ($newStock < 0) {
            throw ValidationException::withMessages([
                'new_stock' => [
                    'El stock no puede ser negativo.'
                ],
            ]);
        }

        return DB::transaction(function () use (
            $productId,
            $newStock,
            $user,
            $reason
        ) {
            $product = Product::whereKey($productId)
                ->lockForUpdate()
                ->firstOrFail();

            $difference = $newStock - $product->stock;

            if ($difference === 0) {
                throw ValidationException::withMessages([
                    'new_stock' => [
                        'El nuevo stock debe ser diferente al stock actual.'
                    ],
                ]);
            }

            $product->stock = $newStock;
            $product->save();

            InventoryMovement::create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'order_id' => null,
                'type' => 'ADJUSTMENT',
                'quantity' => $difference,
                'reason' => $reason,
                'created_at' => now(),
            ]);

            return $product->fresh('category');
        });
    }

    public function registerSale(
        int $productId,
        int $quantity,
        User $user,
        int $orderId,
        ?string $reason = null
    ): Product {
        if ($quantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => [
                    'La cantidad debe ser mayor que cero.'
                ],
            ]);
        }

        return DB::transaction(function () use (
            $productId,
            $quantity,
            $user,
            $orderId,
            $reason
        ) {
            $product = Product::whereKey($productId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($product->stock < $quantity) {
                throw ValidationException::withMessages([
                    'stock' => [
                        "Stock insuficiente para el producto {$product->name}."
                    ],
                ]);
            }

            $product->stock -= $quantity;
            $product->save();

            InventoryMovement::create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'order_id' => $orderId,
                'type' => 'SALE',
                'quantity' => -$quantity,
                'reason' => $reason,
                'created_at' => now(),
            ]);

            return $product->fresh('category');
        });
    }
}