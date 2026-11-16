<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Valida productos, cantidades, stock y calcula totales.
     */
    public function prepareItems(array $items): array
    {
        $preparedItems = [];
        $total = 0;

        foreach ($items as $item) {
            $product = Product::where('id', $item['product_id'])
                ->where('active', true)
                ->first();

            if (!$product) {
                throw ValidationException::withMessages([
                    'products' => [
                        "El producto con ID {$item['product_id']} no existe o está inactivo."
                    ]
                ]);
            }

            $quantity = (int) $item['quantity'];

            if ($quantity <= 0) {
                throw ValidationException::withMessages([
                    'products' => [
                        'La cantidad debe ser mayor a cero.'
                    ]
                ]);
            }

            $productStock = (int) $product->stock;

            if ($productStock < $quantity) {
                throw ValidationException::withMessages([
                    'products' => [
                        "Stock insuficiente para {$product->name}."
                    ]
                ]);
            }

            $unitPrice = (float) $product->sale_price;
            $subtotal = $unitPrice * $quantity;

            $preparedItems[] = [
                'product' => $product,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
            ];

            $total += $subtotal;
        }

        return [
            'items' => $preparedItems,
            'total' => $total,
        ];
    }

    /**
     * Obtiene la información de entrega del cliente para el pedido.
     */
    public function prepareDeliverySnapshot(Client $client): array
    {
        return [
            'delivery_address' => $client->address,
            'delivery_reference' => $client->address_reference,
            'delivery_latitude' => $client->latitude,
            'delivery_longitude' => $client->longitude,
        ];
    }

    /**
     * Obtiene el perfil de cliente del usuario autenticado o lanza una excepción si no existe.
     */
    public function getClientOrFail(User $user): Client
    {
        $client = $user->client;

        if (!$client) {
            throw ValidationException::withMessages([
                'client' => [
                    'El usuario autenticado no tiene un perfil de cliente.'
                ]
            ]);
        }

        return $client;
    }

    /**
     * Prepara los datos del pedido, incluyendo cliente, estado, total, comentario, entrega y productos.
     */
    public function prepareOrder(User $user, array $items, ?string $comment = null): array
    {
        $client = $this->getClientOrFail($user);
        $preparedItems = $this->prepareItems($items);
        $delivery = $this->prepareDeliverySnapshot($client);

        return [
            'client' => $client,
            'status' => 'PENDING',
            'total' => $preparedItems['total'],
            'customer_comment' => $comment,
            'delivery' => $delivery,
            'items' => $preparedItems['items'],
        ];
    }

    /**
     * Regla de negocio: Solo los pedidos pendientes pueden modificarse.
     */
    public function ensureCanModify(Order $order): void
    {
        if ($order->status !== 'PENDING') {
            throw ValidationException::withMessages([
                'order' => [
                    'Solo los pedidos pendientes pueden modificarse.'
                ]
            ]);
        }
    }

    /**
     * Regla de negocio: Solo los pedidos pendientes pueden cancelarse.
     */
    public function ensureCanCancel(Order $order): void
    {
        if ($order->status !== 'PENDING') {
            throw ValidationException::withMessages([
                'order' => [
                    'Solo los pedidos pendientes pueden cancelarse.'
                ]
            ]);
        }
    }
}