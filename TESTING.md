# Testing Guide

This project uses [Pest](https://pestphp.com/) for testing, which provides a clean and expressive syntax for writing tests.

## 🚀 Quick Start

### Run All Tests
```bash
# Using Laravel's test command (recommended)
php artisan test

# Using Pest directly
./vendor/bin/pest

# Using the test script
./scripts/test.sh
```

### Run Specific Test Suites
```bash
# Run only Feature tests
php artisan test --testsuite=Feature

# Run only Unit tests
php artisan test --testsuite=Unit

# Run specific test file
php artisan test tests/Feature/DomainHistoryTest.php
```

### Run Tests with Coverage
```bash
php artisan test --coverage
```

## 🏗️ Test Structure

```
tests/
├── Feature/           # Integration tests
│   ├── Auth/         # Authentication tests
│   ├── Settings/     # Settings tests
│   └── *.php         # Other feature tests
├── Unit/             # Unit tests
└── Pest.php          # Pest configuration and helpers
```

## 🛠️ Helper Functions

The project includes several helper functions in `tests/Pest.php`:

### User Creation
```php
// Create a regular user
$user = createUser();

// Create an admin user
$admin = createAdminUser();

// Create a regular user with specific attributes
$user = createUser(['email' => 'test@example.com']);
```

### Authentication Helpers
```php
// Act as a regular user
actingAsUser()->get('/dashboard');

// Act as an admin user
actingAsAdmin()->get('/admin');

// Act as a specific user
actingAsUser($customUser)->get('/profile');
```

## 📝 Writing Tests

### Basic Test Structure
```php
<?php

test('user can access dashboard', function () {
    $user = createUser();
    
    $response = actingAsUser($user)
        ->get('/dashboard');
    
    $response->assertStatus(200);
});
```

### Testing with Database
```php
test('admin can delete history items', function () {
    $admin = createAdminUser();
    
    // Create test data
    $batch = \DB::table('domain_check_batches')->insertGetId([
        'note' => 'Test batch',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    $response = actingAsAdmin($admin)
        ->delete('/domain-history/history', ['id' => $batch]);
    
    $response->assertStatus(200)
        ->assertJson(['success' => true]);
});
```

### Testing Permissions
```php
test('regular user cannot access admin panel', function () {
    $user = createRegularUser();
    
    $response = actingAsUser($user)
        ->get('/admin');
    
    $response->assertStatus(403);
});
```

## 🔧 Configuration

### PHPUnit Configuration
The `phpunit.xml` file contains the test configuration:
- Uses SQLite in-memory database for testing
- Sets up proper environment variables
- Configures test suites

### Pest Configuration
The `tests/Pest.php` file contains:
- Test case bindings
- Custom expectations
- Helper functions
- Global test setup

## 🚀 GitHub Actions

The project includes several GitHub Actions workflows:

### 1. Simple Tests (`simple-tests.yml`)
- Basic test execution
- Single PHP version (8.3)
- Quick feedback

### 2. Test Matrix (`test-matrix.yml`)
- Multiple PHP versions (8.2, 8.3)
- Coverage reporting
- Codecov integration

### 3. Comprehensive Tests (`tests.yml`)
- Multiple PHP versions
- Dependency version testing
- Code style checking
- Security auditing

## 📊 Coverage

### Local Coverage
```bash
php artisan test --coverage
```

### Coverage Reports
- HTML: `coverage/index.html`
- XML: `coverage.xml`
- Text: Console output

### Coverage Requirements
- Minimum 80% coverage required
- Configured in GitHub Actions

## 🐛 Debugging Tests

### Verbose Output
```bash
php artisan test --verbose
```

### Stop on First Failure
```bash
php artisan test --stop-on-failure
```

### Filter Tests
```bash
php artisan test --filter="dashboard"
```

## 🔍 Best Practices

### 1. Test Naming
```php
// Good
test('admin can delete history items')

// Bad
test('test admin delete')
```

### 2. Test Structure
```php
test('user can access dashboard', function () {
    // Arrange
    $user = createUser();
    
    // Act
    $response = actingAsUser($user)->get('/dashboard');
    
    // Assert
    $response->assertStatus(200);
});
```

### 3. Database Testing
```php
// Use RefreshDatabase trait
pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature');
```

### 4. Authentication Testing
```php
// Use helper functions
actingAsUser()->get('/dashboard');
actingAsAdmin()->get('/admin');
```

## 🚨 Common Issues

### 1. Database Issues
```bash
# Clear test database
rm database/database.sqlite
touch database/database.sqlite
```

### 2. Permission Issues
```bash
# Fix storage permissions
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

### 3. Environment Issues
```bash
# Copy environment file
cp .env.example .env
php artisan key:generate
```

## 📚 Resources

- [Pest Documentation](https://pestphp.com/)
- [Laravel Testing](https://laravel.com/docs/testing)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [GitHub Actions](https://docs.github.com/en/actions)
