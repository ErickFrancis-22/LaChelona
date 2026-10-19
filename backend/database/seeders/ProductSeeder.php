<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Crear o actualizar las Categorías
        $sodas = Category::updateOrCreate(
            ['name' => 'Sodas'],
            [
                'description' => 'Bebidas gaseosas',
                'sort_order' => 1,
                'active' => true,
            ]
        );

        $aguas = Category::updateOrCreate(
            ['name' => 'Aguas'],
            [
                'description' => 'Agua embotellada',
                'sort_order' => 2,
                'active' => true,
            ]
        );

        $jugos = Category::updateOrCreate(
            ['name' => 'Jugos'],
            [
                'description' => 'Jugos y néctares',
                'sort_order' => 3,
                'active' => true,
            ]
        );

        $energeticas = Category::updateOrCreate(
            ['name' => 'Energéticas'],
            [
                'description' => 'Bebidas energéticas',
                'sort_order' => 4,
                'active' => true,
            ]
        );

        // Crear o actualizar los Productos
        Product::updateOrCreate(
            ['code' => 'CC600-12'],
            [
                'category_id' => $sodas->id,
                'name' => 'Coca-Cola 600 ml',
                'description' => 'Bebida gaseosa Coca-Cola',
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
                'name' => 'Sprite 600 ml',
                'description' => 'Bebida gaseosa Sprite',
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
            ['code' => 'AGUA600-12'],
            [
                'category_id' => $aguas->id,
                'name' => 'Agua Cristal 600 ml',
                'description' => 'Agua embotellada',
                'package_type' => 'FARDO',
                'units_per_package' => 12,
                'sale_price' => 6.50,
                'stock' => 100,
                'minimum_stock' => 20,
                'image_url' => '/images/agua-cristal-600.jpg',
                'active' => true,
            ]
        );

        Product::updateOrCreate(
            ['code' => 'JUGO330-12'],
            [
                'category_id' => $jugos->id,
                'name' => 'Jugo de Naranja 330 ml',
                'description' => 'Jugo sabor naranja',
                'package_type' => 'CAJA',
                'units_per_package' => 12,
                'sale_price' => 9.75,
                'stock' => 60,
                'minimum_stock' => 20,
                'image_url' => '/images/jugo-naranja-330.jpg',
                'active' => true,
            ]
        );

        Product::updateOrCreate(
            ['code' => 'ENER250-12'],
            [
                'category_id' => $energeticas->id,
                'name' => 'Energética 250 ml',
                'description' => 'Bebida energética',
                'package_type' => 'CAJA',
                'units_per_package' => 12,
                'sale_price' => 12.50,
                'stock' => 40,
                'minimum_stock' => 20,
                'image_url' => '/images/energetica-250.jpg',
                'active' => true,
            ]
        );

        Product::updateOrCreate(
            ['code' => 'TEST-INACTIVE'],
            [
                'category_id' => $sodas->id,
                'name' => 'Producto Inactivo 500 ml',
                'description' => 'Producto utilizado para pruebas',
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