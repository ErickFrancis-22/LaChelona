<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('order_details', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->restrictOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();

            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);

            $table->string('item_comment', 500)->nullable();

            $table->unique(
                ['order_id', 'product_id'],
                'uq_order_product'
            );

            $table->index('order_id', 'idx_order_details_order');
            $table->index('product_id', 'idx_order_details_product');
        });

        DB::statement("
            ALTER TABLE order_details
            ADD CONSTRAINT chk_order_details_quantity
            CHECK (quantity > 0)
        ");

        DB::statement("
            ALTER TABLE order_details
            ADD CONSTRAINT chk_order_details_unit_price
            CHECK (unit_price >= 0)
        ");

        DB::statement("
            ALTER TABLE order_details
            ADD CONSTRAINT chk_order_details_subtotal
            CHECK (subtotal >= 0)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_details');
    }
};