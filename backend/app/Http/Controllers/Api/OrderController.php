<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService
    ) {
    }

    /**
     * Crea un nuevo pedido para el cliente autenticado.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'customer_comment' => 'nullable|string|max:500',
        ]);

        $prepared = $this->orderService->prepareOrder(
            $request->user(),
            $validated['items'],
            $validated['customer_comment'] ?? null
        );

        $order = DB::transaction(function () use ($prepared) {
            $order = Order::create([
                'client_id' => $prepared['client']->id,
                'status' => $prepared['status'],
                'total' => $prepared['total'],
                'customer_comment' => $prepared['customer_comment'],
                'delivery_address' => $prepared['delivery']['delivery_address'],
                'delivery_reference' => $prepared['delivery']['delivery_reference'],
                'delivery_latitude' => $prepared['delivery']['delivery_latitude'],
                'delivery_longitude' => $prepared['delivery']['delivery_longitude'],
            ]);

            foreach ($prepared['items'] as $item) {
                $order->details()->create([
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['subtotal'],
                ]);
            }

            return $order;
        });

        $order->load('details.product');

        return response()->json([
            'message' => 'Pedido creado correctamente.',
            'data' => $order,
        ], 201);
    }

    /**
     * Muestra la lista de pedidos del cliente autenticado.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $client = $user->client;

        if (! $client) {
            return response()->json([
                'message' => 'Perfil de cliente no encontrado.',
            ], 404);
        }

        $orders = Order::where('client_id', $client->id)
            ->orderByDesc('created_at')
            ->get([
                'id',
                'status',
                'total',
                'customer_comment',
                'created_at',
            ]);

        return response()->json([
            'data' => $orders,
        ]);
    }

    /**
     * Muestra el detalle de un pedido específico del cliente autenticado.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $client = $user->client;

        if (! $client) {
            return response()->json([
                'message' => 'Perfil de cliente no encontrado.',
            ], 404);
        }

        $order = Order::with(['details.product'])
            ->where('client_id', $client->id)
            ->where('id', $id)
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Pedido no encontrado.',
            ], 404);
        }

        return response()->json([
            'data' => $order,
        ]);
    }
}