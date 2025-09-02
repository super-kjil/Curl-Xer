#!/bin/bash

# Test script for running Pest tests locally

echo "🧪 Running Pest Tests..."

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: Please run this script from the Laravel project root directory"
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
fi

# Generate application key
echo "🔑 Generating application key..."
php artisan key:generate

# Create SQLite database
echo "🗄️ Creating SQLite database..."
mkdir -p database
touch database/database.sqlite

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# Run migrations
echo "📊 Running migrations..."
php artisan migrate --force

# Run seeders
echo "🌱 Running seeders..."
php artisan db:seed --force

# Run tests
echo "🚀 Running tests..."
php artisan test

echo "✅ Tests completed!"
