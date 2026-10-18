<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $sodas = Category::updateOrCreate(
            ['name' => 'Sodas'],
            [
                'description' => 'Bebidas gaseosas',
                'sort_order' => 1,
                'active' => true,
            ]
        );

        Product::updateOrCreate(
            ['code' => 'CC600-12'],
            [
                'category_id' => $sodas->id,
                'name' => 'Coca-Cola',
                'description' => 'Bebida gaseosa Coca-Cola',
                'presentation' => '600 ml',
                'package_type' => 'FARDO',
                'units_per_package' => 12,
                'sale_price' => 8.50,
                'stock' => 120,
                'minimum_stock' => 20,
                'image_url' => '/images/coca-cola-600.jpg',
                'active' => true,
            ]
        );

        Product::updateOrCreate(
            ['code' => 'SPR600-12'],
            [
                'category_id' => $sodas->id,
                'name' => 'Sprite',
                'description' => 'Bebida gaseosa Sprite',
                'presentation' => '600 ml',
                'package_type' => 'FARDO',
                'units_per_package' => 12,
                'sale_price' => 8.25,
                'stock' => 80,
                'minimum_stock' => 20,
                'image_url' => '/images/sprite-600.jpg',
                'active' => true,
            ]
        );

        Product::updateOrCreate(
            ['code' => 'TEST-INACTIVE'],
            [
                'category_id' => $sodas->id,
                'name' => 'Producto Inactivo',
                'description' => 'Producto utilizado para pruebas',
                'presentation' => '500 ml',
                'package_type' => 'FARDO',
                'units_per_package' => 12,
                'sale_price' => 5.00,
                'stock' => 50,
                'minimum_stock' => 20,
                'image_url' => null,
                'active' => false,
            ]
        );
    }
}