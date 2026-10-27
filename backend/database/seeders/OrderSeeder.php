<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {

            // Buscar a Jonathan sin depender de IDs fijos
            $jonathanUser = User::where('username', 'jonathan.marquez')->firstOrFail();

            $client = Client::where('user_id', $jonathanUser->id)->firstOrFail();

            // Productos reales del catálogo
            $coca = Product::where('code', 'COCA1250-6')->firstOrFail();
            $jugo = Product::where('code', 'GRANJA500-12')->firstOrFail();
            $gatorade = Product::where('code', 'GATAPON750-12')->firstOrFail();
            $pepsi = Product::where('code', 'PEPSI1500-6')->firstOrFail();
            $lipton = Product::where('code', 'LIPDUR500-12')->firstOrFail();

            /*
            |--------------------------------------------------------------------------
            | PEDIDO 1 - PENDING
            |--------------------------------------------------------------------------
            */

            $pendingDetails = [
                [
                    'product' => $coca,
                    'quantity' => 2,
                    'item_comment' => 'Preferiblemente producto frío',
                ],
                [
                    'product' => $jugo,
                    'quantity' => 1,
                    'item_comment' => null,
                ],
            ];

            $pendingTotal = collect($pendingDetails)->sum(
                fn ($item) => $item['product']->sale_price * $item['quantity']
            );

            $pendingOrderId = DB::table('orders')->insertGetId([
                'client_id' => $client->id,
                'status' => 'PENDING',
                'total' => $pendingTotal,
                'customer_comment' => 'Pedido de ejemplo pendiente desde Ionic',
                'confirmed_at' => null,
                'in_transit_at' => null,
                'cancelled_at' => null,
                'cancelled_by' => null,
                'delivered_at' => null,
                'delivery_address' => $client->address,
                'delivery_reference' => $client->address_reference,
                'delivery_latitude' => $client->latitude,
                'delivery_longitude' => $client->longitude,
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ]);

            foreach ($pendingDetails as $item) {
                DB::table('order_details')->insert([
                    'order_id' => $pendingOrderId,
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['product']->sale_price,
                    'subtotal' => $item['product']->sale_price * $item['quantity'],
                    'item_comment' => $item['item_comment'],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | PEDIDO 2 - CONFIRMED
            |--------------------------------------------------------------------------
            */

            $confirmedDetails = [
                [
                    'product' => $gatorade,
                    'quantity' => 1,
                    'item_comment' => null,
                ],
                [
                    'product' => $pepsi,
                    'quantity' => 2,
                    'item_comment' => 'Entregar las presentaciones indicadas',
                ],
            ];

            $confirmedTotal = collect($confirmedDetails)->sum(
                fn ($item) => $item['product']->sale_price * $item['quantity']
            );

            $confirmedOrderId = DB::table('orders')->insertGetId([
                'client_id' => $client->id,
                'status' => 'CONFIRMED',
                'total' => $confirmedTotal,
                'customer_comment' => 'Pedido confirmado de ejemplo',
                'confirmed_at' => now()->subDay(),
                'in_transit_at' => null,
                'cancelled_at' => null,
                'cancelled_by' => null,
                'delivered_at' => null,
                'delivery_address' => $client->address,
                'delivery_reference' => $client->address_reference,
                'delivery_latitude' => $client->latitude,
                'delivery_longitude' => $client->longitude,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDay(),
            ]);

            foreach ($confirmedDetails as $item) {
                DB::table('order_details')->insert([
                    'order_id' => $confirmedOrderId,
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['product']->sale_price,
                    'subtotal' => $item['product']->sale_price * $item['quantity'],
                    'item_comment' => $item['item_comment'],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | PEDIDO 3 - CANCELLED
            |--------------------------------------------------------------------------
            */

            $cancelledDetails = [
                [
                    'product' => $lipton,
                    'quantity' => 2,
                    'item_comment' => null,
                ],
            ];

            $cancelledTotal = collect($cancelledDetails)->sum(
                fn ($item) => $item['product']->sale_price * $item['quantity']
            );

            $cancelledOrderId = DB::table('orders')->insertGetId([
                'client_id' => $client->id,
                'status' => 'CANCELLED',
                'total' => $cancelledTotal,
                'customer_comment' => 'Pedido cancelado de ejemplo',
                'confirmed_at' => null,
                'in_transit_at' => null,
                'cancelled_at' => now()->subDays(3),
                'cancelled_by' => $jonathanUser->id,
                'delivered_at' => null,
                'delivery_address' => $client->address,
                'delivery_reference' => $client->address_reference,
                'delivery_latitude' => $client->latitude,
                'delivery_longitude' => $client->longitude,
                'created_at' => now()->subDays(3)->subHours(2),
                'updated_at' => now()->subDays(3),
            ]);

            foreach ($cancelledDetails as $item) {
                DB::table('order_details')->insert([
                    'order_id' => $cancelledOrderId,
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['product']->sale_price,
                    'subtotal' => $item['product']->sale_price * $item['quantity'],
                    'item_comment' => $item['item_comment'],
                ]);
            }
        });
    }
}