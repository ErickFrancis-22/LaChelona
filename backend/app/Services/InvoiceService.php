<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    public function createForOrder(Order $order): Invoice
    {
        return DB::transaction(function () use ($order) {

            $order = Order::whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($order->status === 'PENDING') {
                throw ValidationException::withMessages([
                    'order' => [
                        'No se puede generar un comprobante para un pedido pendiente.'
                    ]
                ]);
            }

            if ($order->status === 'CANCELLED') {
                throw ValidationException::withMessages([
                    'order' => [
                        'No se puede generar un comprobante para un pedido cancelado.'
                    ]
                ]);
            }

            if ($order->invoice()->exists()) {
                throw ValidationException::withMessages([
                    'invoice' => [
                        'El pedido ya posee un comprobante.'
                    ]
                ]);
            }

            $invoiceNumber = $this->generateInvoiceNumber($order);

            $invoice = Invoice::create([
                'order_id' => $order->id,
                'invoice_number' => $invoiceNumber,
                'issue_date' => now(),
                'total' => $order->total,
                'created_at' => now(),
            ]);

            return $this->loadInvoice($invoice);
        });
    }

    public function getForOrder(Order $order): Invoice
    {
        $invoice = $order->invoice()
            ->with([
                'order.client',
                'order.details.product',
            ])
            ->first();

        if (!$invoice) {
            throw ValidationException::withMessages([
                'invoice' => [
                    'El pedido no posee un comprobante.'
                ]
            ]);
        }

        return $invoice;
    }

    private function generateInvoiceNumber(Order $order): string
    {
        return 'INV-' .
            now()->format('Ymd') .
            '-' .
            str_pad((string) $order->id, 6, '0', STR_PAD_LEFT);
    }

    private function loadInvoice(Invoice $invoice): Invoice
    {
        return $invoice->fresh([
            'order.client',
            'order.details.product',
        ]);
    }
}