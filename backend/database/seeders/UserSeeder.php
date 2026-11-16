<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // =========================
        // ADMINISTRADOR
        // =========================

        User::updateOrCreate(
            ['username' => 'fernando.garcia'],
            [
                'name' => 'Fernando Abel García Carbajal',
                'email' => 'fernando@lachelona.test',
                'password' => Hash::make('Chelona26!Fernando'),
                'role' => 'ADMIN',
                'active' => true,
            ]
        );

        // =========================
        // ERICK
        // =========================

        $erickUser = User::updateOrCreate(
            ['username' => 'erick.hernandez'],
            [
                'name' => 'Erick Francis Hernández Angel',
                'email' => 'erick@lachelona.test',
                'password' => Hash::make('Chelona26!Erick'),
                'role' => 'CLIENT',
                'active' => true,
            ]
        );

        Client::updateOrCreate(
            ['user_id' => $erickUser->id],
            [
                'business_name' => 'Tienda Francis',
                'contact_name' => 'Erick Francis Hernández Angel',
                'phone' => '7123-4501',
                'email' => 'erick@lachelona.test',
                'address' => 'Santa Tecla, La Libertad',
                'address_reference' => 'Frente a una casa de portón negro, a media cuadra del parque',
                'latitude' => null,
                'longitude' => null,
            ]
        );

        // =========================
        // RODRIGO
        // =========================

        $rodrigoUser = User::updateOrCreate(
            ['username' => 'rodrigo.castillo'],
            [
                'name' => 'Rodrigo Armando Castillo Estrada',
                'email' => 'rodrigo@lachelona.test',
                'password' => Hash::make('Chelona26!Rodrigo'),
                'role' => 'CLIENT',
                'active' => true,
            ]
        );

        Client::updateOrCreate(
            ['user_id' => $rodrigoUser->id],
            [
                'business_name' => 'Tienda Don Rodrigo',
                'contact_name' => 'Rodrigo Armando Castillo Estrada',
                'phone' => '7123-4502',
                'email' => 'rodrigo@lachelona.test',
                'address' => 'San Salvador, San Salvador',
                'address_reference' => 'Casa esquina, frente a una tienda de conveniencia',
                'latitude' => null,
                'longitude' => null,
            ]
        );

        // =========================
        // JONATHAN
        // =========================

        $jonathanUser = User::updateOrCreate(
            ['username' => 'jonathan.marquez'],
            [
                'name' => 'Jonathan Ariel Márquez Merche',
                'email' => 'jonathan@lachelona.test',
                'password' => Hash::make('Chelona26!Jonathan'),
                'role' => 'CLIENT',
                'active' => true,
            ]
        );

        Client::updateOrCreate(
            ['user_id' => $jonathanUser->id],
            [
                'business_name' => 'Mini Súper Jonathan',
                'contact_name' => 'Jonathan Ariel Márquez Merche',
                'phone' => '7123-4503',
                'email' => 'jonathan@lachelona.test',
                'address' => 'Antiguo Cuscatlán, La Libertad',
                'address_reference' => 'Pasaje al costado del parque, casa con portón gris',
                'latitude' => null,
                'longitude' => null,
            ]
        );

        // =========================
        // NÉSTOR
        // =========================

        $nestorUser = User::updateOrCreate(
            ['username' => 'nestor.valencia'],
            [
                'name' => 'Néstor Adriel Valencia Pérez',
                'email' => 'nestor@lachelona.test',
                'password' => Hash::make('Chelona26!Nestor'),
                'role' => 'CLIENT',
                'active' => true,
            ]
        );

        Client::updateOrCreate(
            ['user_id' => $nestorUser->id],
            [
                'business_name' => 'Tienda Valencia',
                'contact_name' => 'Néstor Adriel Valencia Pérez',
                'phone' => '7123-4504',
                'email' => 'nestor@lachelona.test',
                'address' => 'San Juan Opico, La Libertad',
                'address_reference' => 'Dos cuadras después de la unidad de salud, casa de portón negro',
                'latitude' => null,
                'longitude' => null,
            ]
        );

        // =========================
        // ABEL
        // =========================

        $abelUser = User::updateOrCreate(
            ['username' => 'abel.barahona'],
            [
                'name' => 'Abel Enrique Barahona Sanchez',
                'email' => 'abel@lachelona.test',
                'password' => Hash::make('Chelona26!Abel'),
                'role' => 'CLIENT',
                'active' => true,
            ]
        );

        Client::updateOrCreate(
            ['user_id' => $abelUser->id],
            [
                'business_name' => 'Abarrotería Barahona',
                'contact_name' => 'Abel Enrique Barahona Sanchez',
                'phone' => '7123-4505',
                'email' => 'abel@lachelona.test',
                'address' => 'Colón, La Libertad',
                'address_reference' => 'Cerca de la calle principal, frente a una cancha',
                'latitude' => null,
                'longitude' => null,
            ]
        );
    }
}