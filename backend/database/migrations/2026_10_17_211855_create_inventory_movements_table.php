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
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
        
            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();
        
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();
        
            $table->foreignId('order_id')
                ->nullable()
                ->constrained('orders')
                ->restrictOnDelete();
        
            $table->enum('type', [
                'ENTRY',
                'SALE',
                'ADJUSTMENT'
            ]);
        
            $table->integer('quantity');
            $table->text('reason')->nullable();
        
            $table->timestamp('created_at')->useCurrent();
        
            $table->index(
                ['product_id', 'created_at'],
                'idx_inv_mov_product_date'
            );
        
            $table->index('order_id', 'idx_inv_mov_order');
        });

        DB::statement("
            ALTER TABLE inventory_movements
            ADD CONSTRAINT chk_inventory_movements_quantity
            CHECK (
                (type = 'ENTRY' AND quantity > 0)
                OR
                (type = 'SALE' AND quantity < 0 AND order_id IS NOT NULL)
                OR
                (type = 'ADJUSTMENT' AND quantity <> 0)
            )
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};