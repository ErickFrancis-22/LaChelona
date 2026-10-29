<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\AdminOrderService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminOrderController extends Controller
{
    public function __construct(
        private AdminOrderService $adminOrderService
    ) {
    }

    /**
     * Lista pedidos para administración.
     *
     * Filtros:
     * - status
     * - date
     * - search
     *
     * También devuelve totales por estado.
     */
    public function index(Request $request)
    {
        $request->validate([
            'status' => [
                'nullable',
                Rule::in([
                    'PENDING',
                    'CONFIRMED',
                    'IN_TRANSIT',
                    'DELIVERED',
                    'CANCELLED',
                ]),
            ],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $query = Order::query()
            ->with([
                'client:id,business_name,contact_name',
            ])
            ->withCount('details')
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->orWhere('id', (int) $search);
                }

                $q->orWhereHas('client', function ($clientQuery) use ($search) {
                    $clientQuery
                        ->where('business_name', 'ILIKE', "%{$search}%")
                        ->orWhere('contact_name', 'ILIKE', "%{$search}%");
                });
            });
        }

        $orders = $query->get();

        $summary = Order::query()
            ->when(
                $request->filled('date'),
                fn ($q) => $q->whereDate('created_at', $request->date)
            )
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'data' => $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'status' => $order->status,
                    'total' => $order->total,
                    'products_count' => $order->details_count,
                    'created_at' => $order->created_at,
                    'confirmed_at' => $order->confirmed_at,
                    'in_transit_at' => $order->in_transit_at,
                    'delivered_at' => $order->delivered_at,
                    'cancelled_at' => $order->cancelled_at,
                    'client' => $order->client ? [
                        'id' => $order->client->id,
                        'business_name' => $order->client->business_name,
                        'contact_name' => $order->client->contact_name,
                    ] : null,
                ];
            }),

            'summary' => [
                'PENDING' => (int) ($summary['PENDING'] ?? 0),
                'CONFIRMED' => (int) ($summary['CONFIRMED'] ?? 0),
                'IN_TRANSIT' => (int) ($summary['IN_TRANSIT'] ?? 0),
                'DELIVERED' => (int) ($summary['DELIVERED'] ?? 0),
                'CANCELLED' => (int) ($summary['CANCELLED'] ?? 0),
            ],
        ]);
    }

    /**
     * Devuelve el detalle completo de un pedido.
     */
    public function show(int $id)
    {
        $order = Order::with([
            'client',
            'details.product',
            'cancelledBy:id,name,email',
            'inventoryMovements.product',
            'inventoryMovements.user:id,name,email',
        ])->findOrFail($id);

        return response()->json([
            'data' => $order,
        ]);
    }

    /**
     * PENDING -> CONFIRMED
     */
    public function confirm(Request $request, int $id)
    {
        $order = Order::findOrFail($id);

        $order = $this->adminOrderService->confirm(
            $order,
            $request->user()
        );

        return response()->json([
            'message' => 'Pedido confirmado correctamente.',
            'data' => $order,
        ]);
    }

    /**
     * CONFIRMED -> IN_TRANSIT
     */
    public function markInTransit(int $id)
    {
        $order = Order::findOrFail($id);

        $order = $this->adminOrderService->markInTransit($order);

        return response()->json([
            'message' => 'Pedido marcado como en camino correctamente.',
            'data' => $order,
        ]);
    }

    /**
     * IN_TRANSIT -> DELIVERED
     */
    public function deliver(int $id)
    {
        $order = Order::findOrFail($id);

        $order = $this->adminOrderService->deliver($order);

        return response()->json([
            'message' => 'Pedido marcado como entregado correctamente.',
            'data' => $order,
        ]);
    }
}