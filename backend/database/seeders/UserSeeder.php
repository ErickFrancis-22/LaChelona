<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrador',
                'email' => 'admin@lachelona.test',
                'password' => 'Admin123*',
                'role' => 'ADMIN',
                'active' => true,
            ]
        );

        User::updateOrCreate(
            ['username' => 'cliente01'],
            [
                'name' => 'Cliente Prueba',
                'email' => 'cliente01@lachelona.test',
                'password' => 'Cliente123*',
                'role' => 'CLIENT',
                'active' => true,
            ]
        );
    }
}