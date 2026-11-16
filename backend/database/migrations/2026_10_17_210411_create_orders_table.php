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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table->foreignId('client_id')
                ->constrained('clients')
                ->restrictOnDelete();

            $table->enum('status', [
                'PENDING',
                'CONFIRMED',
                'IN_TRANSIT',
                'DELIVERED',
                'CANCELLED'
            ])->default('PENDING');

            $table->decimal('total', 10, 2);
            $table->string('customer_comment', 500)->nullable();

            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('in_transit_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->foreignId('cancelled_by')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamp('delivered_at')->nullable();

            $table->text('delivery_address');
            $table->text('delivery_reference')->nullable();

            $table->decimal('delivery_latitude', 10, 7)->nullable();
            $table->decimal('delivery_longitude', 10, 7)->nullable();

            $table->timestamps();

            $table->index(
                ['client_id', 'created_at'],
                'idx_orders_client_date'
            );

            $table->index('status', 'idx_orders_status');
            $table->index('delivered_at', 'idx_orders_delivered_at');
        });

        DB::statement("
            ALTER TABLE orders
            ADD CONSTRAINT chk_orders_total
            CHECK (total >= 0)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};