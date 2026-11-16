<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'invoice_number',
        'issue_date',
        'total',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'datetime',
            'total' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}