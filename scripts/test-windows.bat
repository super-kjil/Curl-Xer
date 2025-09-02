@echo off
echo 🧪 Running Pest Tests on Windows...

REM Check if we're in the right directory
if not exist "artisan" (
    echo ❌ Error: Please run this script from the Laravel project root directory
    exit /b 1
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file...
    copy .env.example .env
)

REM Generate application key
echo 🔑 Generating application key...
php artisan key:generate

REM Create test database
echo 🗄️ Creating test database...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS curlxer_test;" 2>nul

REM Set permissions
echo 🔐 Setting permissions...
if not exist "storage\app\public" mkdir "storage\app\public"
if not exist "storage\framework\cache" mkdir "storage\framework\cache"
if not exist "storage\framework\sessions" mkdir "storage\framework\sessions"
if not exist "storage\framework\views" mkdir "storage\framework\views"
if not exist "storage\logs" mkdir "storage\logs"

REM Run migrations
echo 📊 Running migrations...
php artisan migrate --force --env=testing

REM Run seeders
echo 🌱 Running seeders...
php artisan db:seed --force --env=testing

REM Run tests
echo 🚀 Running tests...
php artisan test --configuration=phpunit.local.xml

echo ✅ Tests completed!
pause
