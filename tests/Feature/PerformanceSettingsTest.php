<?php

namespace Tests\Feature;

use App\Models\DomainCheckerSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PerformanceSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_performance_settings_are_saved_and_retrieved()
    {
        $user = User::factory()->create();
        
        $this->actingAs($user);

        // Test saving performance settings
        $response = $this->postJson('/domain-checker/settings', [
            'primary_dns' => '8.8.8.8',
            'secondary_dns' => '1.1.1.1',
            'batch_size' => 200,
            'large_batch_size' => 1500,
            'timeout' => 45,
            'auto_detect_dns' => true
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        // Verify settings are saved in database
        $this->assertDatabaseHas('domain_checker_settings', [
            'user_id' => $user->id,
            'primary_dns' => '8.8.8.8',
            'secondary_dns' => '1.1.1.1',
            'batch_size' => 200,
            'large_batch_size' => 1500,
            'timeout' => 45
        ]);

        // Test retrieving settings
        $response = $this->getJson('/domain-checker/settings/get');
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $settings = $response->json('settings');
        $this->assertEquals(200, $settings['batch_size']);
        $this->assertEquals(1500, $settings['large_batch_size']);
        $this->assertEquals(45, $settings['timeout']);
    }

    public function test_performance_settings_have_default_values()
    {
        $user = User::factory()->create();
        
        $this->actingAs($user);

        // Get settings without creating any
        $response = $this->getJson('/domain-checker/settings/get');
        $response->assertStatus(200);

        $settings = $response->json('settings');
        $this->assertEquals(100, $settings['batch_size']);
        $this->assertEquals(1000, $settings['large_batch_size']);
        $this->assertEquals(30, $settings['timeout']);
    }

    public function test_performance_settings_validation()
    {
        $user = User::factory()->create();
        
        $this->actingAs($user);

        // Test invalid batch size
        $response = $this->postJson('/domain-checker/settings', [
            'primary_dns' => '8.8.8.8',
            'batch_size' => 0, // Invalid: must be >= 1
            'large_batch_size' => 1500,
            'timeout' => 45
        ]);

        $response->assertStatus(422); // Laravel returns 422 for validation errors

        // Test invalid large batch size
        $response = $this->postJson('/domain-checker/settings', [
            'primary_dns' => '8.8.8.8',
            'batch_size' => 200,
            'large_batch_size' => 100, // Invalid: must be >= 500
            'timeout' => 45
        ]);

        $response->assertStatus(422); // Laravel returns 422 for validation errors

        // Test invalid timeout
        $response = $this->postJson('/domain-checker/settings', [
            'primary_dns' => '8.8.8.8',
            'batch_size' => 200,
            'large_batch_size' => 1500,
            'timeout' => 2 // Invalid: must be >= 5
        ]);

        $response->assertStatus(422); // Laravel returns 422 for validation errors
    }
}