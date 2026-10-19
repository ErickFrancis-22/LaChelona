<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'code',
        'name',
        'description',
        'presentation',
        'package_type',
        'units_per_package',
        'sale_price',
        'stock',
        'minimum_stock',
        'image_url',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'units_per_package' => 'integer',
            'sale_price' => 'decimal:2',
            'stock' => 'integer',
            'minimum_stock' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class);
    }

    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }
}