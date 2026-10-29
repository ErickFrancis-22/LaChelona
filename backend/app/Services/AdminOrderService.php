<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminOrderService
{
    public function __construct(
        private InventoryService $inventoryService
    ) {
    }

    /**
     * Confirma un pedido pendiente.
     *
     * PENDING -> CONFIRMED
     *
     * El descuento de inventario NO se implementa aquí.
     * Se delega a InventoryService.
     */
    public function confirm(Order $order, User $user): Order
    {
        return DB::transaction(function () use ($order, $user) {

            $order = Order::whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureStatus(
                $order,
                'PENDING',
                'Solo los pedidos pendientes pueden confirmarse.'
            );

            $order->load('details');

            if ($order->details->isEmpty()) {
                throw ValidationException::withMessages([
                    'order' => [
                        'El pedido no contiene productos.'
                    ]
                ]);
            }

            foreach ($order->details as $detail) {
                $this->inventoryService->registerSale(
                    $detail->product_id,
                    $detail->quantity,
                    $user,
                    $order->id,
                    "Venta por confirmación del pedido #{$order->id}"
                );
            }

            $order->status = 'CONFIRMED';
            $order->confirmed_at = now();
            $order->save();

            return $this->loadOrder($order);
        });
    }

    /**
     * Cambia un pedido confirmado a enviado.
     *
     * CONFIRMED -> IN_TRANSIT
     */
    public function markInTransit(Order $order): Order
    {
        return DB::transaction(function () use ($order) {

            $order = Order::whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureStatus(
                $order,
                'CONFIRMED',
                'Solo los pedidos confirmados pueden pasar a en camino.'
            );

            $order->status = 'IN_TRANSIT';
            $order->in_transit_at = now();
            $order->save();

            return $this->loadOrder($order);
        });
    }

    /**
     * Marca un pedido en camino como entregado.
     *
     * IN_TRANSIT -> DELIVERED
     */
    public function deliver(Order $order): Order
    {
        return DB::transaction(function () use ($order) {

            $order = Order::whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureStatus(
                $order,
                'IN_TRANSIT',
                'Solo los pedidos en camino pueden marcarse como entregados.'
            );

            $order->status = 'DELIVERED';
            $order->delivered_at = now();
            $order->save();

            return $this->loadOrder($order);
        });
    }

    /**
     * Valida que el pedido se encuentre exactamente
     * en el estado esperado.
     */
    private function ensureStatus(
        Order $order,
        string $expectedStatus,
        string $message
    ): void {
        if ($order->status !== $expectedStatus) {
            throw ValidationException::withMessages([
                'status' => [$message]
            ]);
        }
    }

    /**
     * Devuelve el pedido con la información necesaria
     * para administración.
     */
    private function loadOrder(Order $order): Order
    {
        return $order->fresh([
            'client',
            'details.product',
            'inventoryMovements',
        ]);
    }
}