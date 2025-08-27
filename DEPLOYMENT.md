# 🚀 Deployment Guide - Laravel + React Application

This guide explains how to set up continuous deployment from GitHub to your Ubuntu server using GitHub Actions.

## 📋 Prerequisites

- Ubuntu Server (20.04 LTS or higher recommended)
- GitHub repository with your Laravel application
- SSH access to your server
- Domain name pointing to your server

## 🔧 Server Setup

### 1. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Apache
sudo apt install apache2 -y

# Install PHP 8.2 and extensions
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-gd php8.2-intl php8.2-bcmath -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install Git
sudo apt install git -y
```

### 2. Configure Apache

Create a new Apache virtual host configuration:

```bash
sudo nano /etc/apache2/sites-available/curl-xer.conf
```

Add this configuration:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/curl-xer/public
    
    <Directory /var/www/curl-xer/public>
        AllowOverride All
        Require all granted
        
        # Security headers
        Header always set X-Frame-Options "SAMEORIGIN"
        Header always set X-XSS-Protection "1; mode=block"
        Header always set X-Content-Type-Options "nosniff"
        Header always set Referrer-Policy "no-referrer-when-downgrade"
        Header always set Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'"
        
        # Cache static assets
        <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
            ExpiresActive On
            ExpiresDefault "access plus 1 year"
            Header set Cache-Control "public, immutable"
        </FilesMatch>
    </Directory>
    
    # Deny access to sensitive files
    <FilesMatch "^\.">
        Require all denied
    </FilesMatch>
    
    # Enable Gzip compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/plain
        AddOutputFilterByType DEFLATE text/html
        AddOutputFilterByType DEFLATE text/xml
        AddOutputFilterByType DEFLATE text/css
        AddOutputFilterByType DEFLATE application/xml
        AddOutputFilterByType DEFLATE application/xhtml+xml
        AddOutputFilterByType DEFLATE application/rss+xml
        AddOutputFilterByType DEFLATE application/javascript
        AddOutputFilterByType DEFLATE application/x-javascript
    </IfModule>
    
    ErrorLog ${APACHE_LOG_DIR}/curl-xer_error.log
    CustomLog ${APACHE_LOG_DIR}/curl-xer_access.log combined
</VirtualHost>
```

Enable required modules and the site:

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
sudo a2dissite 000-default
sudo a2ensite curl-xer
sudo apache2ctl configtest
sudo systemctl restart apache2
```

### 3. Configure PHP-FPM

Edit PHP-FPM configuration:

```bash
sudo nano /etc/php/8.2/fpm/php.ini
```

Update these values:

```ini
upload_max_filesize = 64M
post_max_size = 64M
memory_limit = 256M
max_execution_time = 300
max_input_vars = 3000
```

Restart PHP-FPM:

```bash
sudo systemctl restart php8.2-fpm
```

### 4. Create Application Directory

```bash
sudo mkdir -p /var/www/curl-xer
sudo chown -R $USER:$USER /var/www/curl-xer
sudo chmod -R 755 /var/www/curl-xer
```

### 5. Configure MySQL

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE curl_xer;
CREATE USER 'curl_xer_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON curl_xer.* TO 'curl_xer_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 🔑 GitHub Secrets Configuration

### 1. Generate SSH Key

On your server, generate an SSH key:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@your-domain.com"
```

### 2. Add Public Key to Server

```bash
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

- **`HOST`**: Your server IP address or domain
- **`USERNAME`**: Your server username (usually `ubuntu` or `root`)
- **`SSH_KEY`**: The private SSH key content (from `~/.ssh/id_rsa`)
- **`PORT`**: SSH port (usually `22`)

## 📁 Environment File Setup

### 1. Create .env File

On your server, create the `.env` file:

```bash
cd /var/www/curl-xer
sudo cp .env.example .env
sudo nano .env
```

### 2. Configure Environment Variables

```env
APP_NAME="Curl-Xer"
APP_ENV=production
APP_KEY=base64:your_generated_key_here
APP_DEBUG=false
APP_URL=https://your-domain.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=curl_xer
DB_USERNAME=curl_xer_user
DB_PASSWORD=your_secure_password

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

### 3. Generate Application Key

```bash
cd /var/www/curl-xer
php artisan key:generate
```

## 🚀 Deployment Process

### 1. Automatic Deployment

The workflow will automatically deploy when you:
- Push to the `main` branch
- Push to the `develop` branch
- Manually trigger the workflow

### 2. Deployment Steps

1. **Test Phase**: Runs all tests and builds assets
2. **Deploy Phase**: Creates deployment package and deploys to server
3. **Health Check**: Verifies the application is running correctly
4. **Notification**: Reports success or failure

### 3. What Happens During Deployment

- ✅ Creates backup of current deployment
- ✅ Downloads and extracts new code
- ✅ Sets proper permissions
- ✅ Installs Composer dependencies
- ✅ Optimizes Laravel (config, route, view caching)
- ✅ Runs database migrations
- ✅ Restarts web services
- ✅ Performs health checks

## 🔍 Monitoring and Maintenance

### 1. Check Deployment Status

```bash
# Check application logs
sudo tail -f /var/www/curl-xer/storage/logs/laravel.log

# Check Apache logs
sudo tail -f /var/log/apache2/curl-xer_access.log
sudo tail -f /var/log/apache2/curl-xer_error.log

# Check PHP-FPM logs
sudo tail -f /var/log/php8.2-fpm.log
```

### 2. Manual Backup

```bash
cd /var/www/backups/curl-xer
sudo tar -czf manual_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /var/www curl-xer
```

### 3. Rollback Deployment

```bash
cd /var/www/backups/curl-xer
sudo tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz -C /var/www
cd /var/www/curl-xer
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod -R 775 storage bootstrap/cache
sudo systemctl restart apache2 php8.2-fpm
```

## 🛠️ Troubleshooting

### Common Issues

1. **Permission Denied**: Check file ownership and permissions
2. **Database Connection**: Verify MySQL credentials and database exists
3. **Service Not Starting**: Check service status and logs
4. **Assets Not Loading**: Ensure `npm run build` completed successfully

### Debug Mode

For debugging, temporarily enable debug mode:

```bash
sudo nano /var/www/curl-xer/.env
# Change APP_DEBUG=true
sudo systemctl restart php8.2-fpm
```

## 📚 Additional Resources

- [Laravel Deployment Documentation](https://laravel.com/docs/deployment)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

## 🆘 Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Review server logs
3. Verify all prerequisites are met
4. Ensure proper file permissions
5. Check service status

---

**Happy Deploying! 🚀**
