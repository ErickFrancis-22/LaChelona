<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class MonthlyReportService
{
    public function generate(int $year, int $month): array
    {
        $ordersBase = DB::table('orders')
            ->where('status', 'DELIVERED')
            ->whereYear('delivered_at', $year)
            ->whereMonth('delivered_at', $month);

        $summary = (clone $ordersBase)
            ->selectRaw('COUNT(*) as delivered_orders, COALESCE(SUM(total), 0) as total_sales')
            ->first();

        $topProducts = DB::table('order_details')
            ->join('orders', 'orders.id', '=', 'order_details.order_id')
            ->join('products', 'products.id', '=', 'order_details.product_id')
            ->where('orders.status', 'DELIVERED')
            ->whereYear('orders.delivered_at', $year)
            ->whereMonth('orders.delivered_at', $month)
            ->groupBy(
                'products.id',
                'products.code',
                'products.name'
            )
            ->select([
                'products.id as product_id',
                'products.code',
                'products.name',
                DB::raw('SUM(order_details.quantity) as quantity_sold'),
                DB::raw('SUM(order_details.subtotal) as revenue'),
            ])
            ->orderByDesc('quantity_sold')
            ->get();

        $topClients = DB::table('orders')
            ->join('clients', 'clients.id', '=', 'orders.client_id')
            ->where('orders.status', 'DELIVERED')
            ->whereYear('orders.delivered_at', $year)
            ->whereMonth('orders.delivered_at', $month)
            ->groupBy(
                'clients.id',
                'clients.business_name',
                'clients.contact_name'
            )
            ->select([
                'clients.id as client_id',
                'clients.business_name',
                'clients.contact_name',
                DB::raw('COUNT(orders.id) as orders_count'),
                DB::raw('SUM(orders.total) as total_purchased'),
            ])
            ->orderByDesc('orders_count')
            ->orderByDesc('total_purchased')
            ->get();

        return [
            'period' => [
                'year' => $year,
                'month' => $month,
            ],

            'summary' => [
                'total_sales' => number_format(
                    (float) ($summary->total_sales ?? 0),
                    2,
                    '.',
                    ''
                ),
                'delivered_orders' => (int) ($summary->delivered_orders ?? 0),
            ],

            'top_products' => $topProducts->map(function ($product) {
                return [
                    'product_id' => $product->product_id,
                    'code' => $product->code,
                    'name' => $product->name,
                    'quantity_sold' => (int) $product->quantity_sold,
                    'revenue' => number_format(
                        (float) $product->revenue,
                        2,
                        '.',
                        ''
                    ),
                ];
            }),

            'top_clients' => $topClients->map(function ($client) {
                return [
                    'client_id' => $client->client_id,
                    'business_name' => $client->business_name,
                    'contact_name' => $client->contact_name,
                    'orders_count' => (int) $client->orders_count,
                    'total_purchased' => number_format(
                        (float) $client->total_purchased,
                        2,
                        '.',
                        ''
                    ),
                ];
            }),
        ];
    }
}