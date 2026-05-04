<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->createAdminUsers();
        
        $this->command->info('Users created and roles assigned successfully.');
    }

    /**
     * Create admin users
     */
    private function createAdminUsers(): void
    {
        $adminUsers = [
            [
                'name' => 'Admin',
                'email' => 'admin@curlxer',
                'password' => 'password',
                'role' => 'admin'
            ],
            [
                'name' => 'NOC',
                'email' => 'noc@curlxer',
                'password' => 'password',
                'role' => 'noc'
            ]
        ];

        foreach ($adminUsers as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => bcrypt($userData['password']),
                ]
            );

            $user->assignRole($userData['role']);
        }
    }

}
