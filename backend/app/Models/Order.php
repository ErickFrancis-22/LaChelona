<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'status',
        'total',
        'customer_comment',
        'confirmed_at',
        'in_transit_at',
        'cancelled_at',
        'cancelled_by',
        'delivered_at',
        'delivery_address',
        'delivery_reference',
        'delivery_latitude',
        'delivery_longitude',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'confirmed_at' => 'datetime',
            'in_transit_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'delivered_at' => 'datetime',
            'delivery_latitude' => 'decimal:7',
            'delivery_longitude' => 'decimal:7',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function details()
    {
        return $this->hasMany(OrderDetail::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }
}