<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Antes de hacer la modificación, la información actual.
        DB::statement("
            UPDATE products
            SET name = CONCAT(name, ' ', presentation)
            WHERE presentation IS NOT NULL
              AND presentation <> ''
        ");

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('presentation');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('presentation')->nullable();
        });
    }
};