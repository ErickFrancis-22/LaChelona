<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderDetail extends Model
{
    public $timestamps = false;
    
    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'unit_price',
        'subtotal',
        'item_comment',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}