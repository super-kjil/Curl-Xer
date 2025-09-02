# GitHub CI Setup for Pest Tests

This document explains how to run Pest tests in GitHub CI for your Laravel application.

## 🚀 Quick Start

### 1. Basic CI Setup
The simplest way to get started is to use the `simple-tests.yml` workflow:

```yaml
# .github/workflows/simple-tests.yml
name: Simple Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.3'
        extensions: dom, curl, libxml, mbstring, zip, pcntl, pdo, sqlite, pdo_sqlite, bcmath, soap, intl, gd, exif, iconv, imagick
    - name: Install Dependencies
      run: composer install -q --no-ansi --no-interaction --no-scripts --no-progress --prefer-dist
    - name: Execute tests
      run: php artisan test
```

### 2. Advanced CI Setup
For more comprehensive testing, use the `ci.yml` workflow which includes:
- Multiple PHP versions (8.2, 8.3)
- Multiple databases (SQLite, MySQL)
- Code coverage reporting
- Code style checking
- Security auditing

## 📁 File Structure

```
.github/
├── workflows/
│   ├── simple-tests.yml      # Basic test execution
│   ├── ci.yml               # Comprehensive CI pipeline
│   ├── test-matrix.yml      # Matrix testing
│   └── windows-tests.yml    # Windows-specific tests
├── tests/
│   ├── Unit/
│   │   └── BasicTest.php    # Basic unit tests
│   ├── Feature/
│   │   └── DomainHistoryTest.php  # Feature tests
│   └── Pest.php             # Pest configuration
├── scripts/
│   ├── test.sh              # Linux/Mac test script
│   └── test-windows.bat     # Windows test script
├── phpunit.xml              # PHPUnit configuration
├── phpunit.local.xml        # Local development config
└── TESTING.md               # Testing documentation
```

## 🔧 Configuration Files

### PHPUnit Configuration
- `phpunit.xml` - CI/Production configuration (SQLite)
- `phpunit.local.xml` - Local development (MySQL)

### Pest Configuration
- `tests/Pest.php` - Global test setup and helpers
- Helper functions for user creation and authentication

## 🧪 Test Types

### 1. Unit Tests
```php
// tests/Unit/BasicTest.php
test('basic math works', function () {
    expect(2 + 2)->toBe(4);
});
```

### 2. Feature Tests
```php
// tests/Feature/DomainHistoryTest.php
test('admin can access domain history page', function () {
    $admin = createAdminUser();
    
    $response = actingAsAdmin($admin)
        ->get('/domain-history/history');
    
    $response->assertStatus(200);
});
```

## 🚀 Running Tests

### Local Development
```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --testsuite=Unit
php artisan test --testsuite=Feature

# Run with coverage
php artisan test --coverage

# Run specific test file
php artisan test tests/Unit/BasicTest.php
```

### Using Test Scripts
```bash
# Linux/Mac
./scripts/test.sh

# Windows
scripts/test-windows.bat
```

## 🔍 GitHub Actions Workflows

### 1. Simple Tests (`simple-tests.yml`)
- **Purpose**: Quick feedback for basic functionality
- **PHP Version**: 8.3
- **Database**: SQLite
- **Features**: Basic test execution

### 2. Comprehensive CI (`ci.yml`)
- **Purpose**: Full CI pipeline with multiple configurations
- **PHP Versions**: 8.2, 8.3
- **Databases**: SQLite, MySQL
- **Features**: 
  - Test execution
  - Code coverage
  - Code style checking
  - Security auditing

### 3. Test Matrix (`test-matrix.yml`)
- **Purpose**: Matrix testing across PHP versions
- **PHP Versions**: 8.2, 8.3
- **Features**: Coverage reporting

### 4. Windows Tests (`windows-tests.yml`)
- **Purpose**: Windows-specific testing
- **OS**: Windows
- **Features**: Windows-compatible test execution

## 🛠️ Helper Functions

The project includes several helper functions in `tests/Pest.php`:

```php
// User creation
$user = createUser();
$admin = createAdminUser();
$regularUser = createRegularUser();

// Authentication
actingAsUser()->get('/dashboard');
actingAsAdmin()->get('/admin');
```

## 📊 Coverage Reporting

### Local Coverage
```bash
php artisan test --coverage
```

### CI Coverage
- Automatically generated in GitHub Actions
- Uploaded to Codecov
- Minimum 80% coverage required

## 🐛 Troubleshooting

### Common Issues

#### 1. SQLite Driver Not Found
**Error**: `could not find driver (Connection: sqlite)`
**Solution**: Use MySQL for local development or ensure SQLite extension is installed

#### 2. Database Connection Issues
**Error**: Database connection failures
**Solution**: Check database configuration and ensure database exists

#### 3. Permission Issues
**Error**: Storage permission errors
**Solution**: Set proper permissions on storage directories

### Debug Commands
```bash
# Check PHP extensions
php -m | grep sqlite
php -m | grep mysql

# Check database connection
php artisan tinker
>>> DB::connection()->getPdo();

# Run tests with verbose output
php artisan test --verbose
```

## 🔧 Customization

### Adding New Test Suites
1. Create test files in `tests/Unit/` or `tests/Feature/`
2. Use Pest syntax for test definitions
3. Leverage helper functions for common operations

### Modifying CI Workflows
1. Edit workflow files in `.github/workflows/`
2. Add new steps or modify existing ones
3. Test changes in pull requests

### Database Configuration
- Modify `phpunit.xml` for CI configuration
- Modify `phpunit.local.xml` for local development
- Ensure proper database setup in CI workflows

## 📚 Resources

- [Pest Documentation](https://pestphp.com/)
- [Laravel Testing](https://laravel.com/docs/testing)
- [GitHub Actions](https://docs.github.com/en/actions)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)

## 🎯 Best Practices

1. **Write descriptive test names**
2. **Use helper functions for common operations**
3. **Keep tests independent and isolated**
4. **Use proper assertions**
5. **Test both success and failure scenarios**
6. **Maintain good test coverage**
7. **Use database transactions for feature tests**
8. **Mock external dependencies when appropriate**

## 🚀 Next Steps

1. **Set up the CI workflows** in your GitHub repository
2. **Write comprehensive tests** for your application
3. **Monitor test results** in GitHub Actions
4. **Maintain good test coverage**
5. **Continuously improve test quality**

Your Pest test setup is now ready for GitHub CI! 🎉
