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
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('category_id')
                ->constrained('categories')
                ->restrictOnDelete();

            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('presentation');

            $table->enum('package_type', ['FARDO', 'CAJA']);

            $table->integer('units_per_package');
            $table->decimal('sale_price', 10, 2);
            $table->integer('stock')->default(0);
            $table->integer('minimum_stock')->default(20);

            $table->string('image_url')->nullable();
            $table->boolean('active')->default(true);

            $table->timestamps();

            $table->index('category_id', 'idx_products_category');
        });

        DB::statement("
            ALTER TABLE products
            ADD CONSTRAINT chk_products_units_per_package
            CHECK (units_per_package > 0)
        ");

        DB::statement("
            ALTER TABLE products
            ADD CONSTRAINT chk_products_sale_price
            CHECK (sale_price >= 0)
        ");

        DB::statement("
            ALTER TABLE products
            ADD CONSTRAINT chk_products_stock
            CHECK (stock >= 0)
        ");

        DB::statement("
            ALTER TABLE products
            ADD CONSTRAINT chk_products_minimum_stock
            CHECK (minimum_stock >= 0)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};