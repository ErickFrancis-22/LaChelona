<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\InvoiceService;

class AdminInvoiceController extends Controller
{
    public function __construct(
        private InvoiceService $invoiceService
    ) {
    }

    /**
     * Genera el comprobante interno de un pedido procesado.
     */
    public function store(int $id)
    {
        $order = Order::findOrFail($id);

        $invoice = $this->invoiceService->createForOrder($order);

        return response()->json([
            'message' => 'Comprobante generado correctamente.',
            'data' => $invoice,
        ], 201);
    }

    /**
     * Consulta el comprobante asociado a un pedido.
     */
    public function show(int $id)
    {
        $order = Order::findOrFail($id);

        $invoice = $this->invoiceService->getForOrder($order);

        return response()->json([
            'data' => $invoice,
        ]);
    }
}