<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'image_url',
        'sort_order',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}