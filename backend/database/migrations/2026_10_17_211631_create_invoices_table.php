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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->unique()
                ->constrained('orders')
                ->restrictOnDelete();

            $table->string('invoice_number')->unique();
            $table->timestamp('issue_date')->useCurrent();
            $table->decimal('total', 10, 2);

            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement("
            ALTER TABLE invoices
            ADD CONSTRAINT chk_invoices_total
            CHECK (total >= 0)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};