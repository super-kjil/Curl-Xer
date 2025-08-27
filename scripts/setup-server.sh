#!/bin/bash

# 🚀 Laravel + React Server Setup Script
# This script automates the setup of an Ubuntu server for Laravel deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root"
        exit 1
    fi
}

# Function to update system
update_system() {
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    print_success "System updated successfully"
}

# Function to install Apache
install_apache() {
    if command_exists apache2; then
        print_warning "Apache is already installed"
        return
    fi
    
    print_status "Installing Apache..."
    sudo apt install apache2 -y
    sudo systemctl enable apache2
    sudo systemctl start apache2
    print_success "Apache installed and started"
}

# Function to install PHP
install_php() {
    if command_exists php; then
        print_warning "PHP is already installed"
        return
    fi
    
    print_status "Installing PHP 8.2 and extensions..."
    sudo apt install software-properties-common -y
    sudo add-apt-repository ppa:ondrej/php -y
    sudo apt update
    sudo apt install php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-gd php8.2-intl php8.2-bcmath php8.2-cli -y
    
    # Enable PHP-FPM
    sudo systemctl enable php8.2-fpm
    sudo systemctl start php8.2-fpm
    print_success "PHP 8.2 installed and started"
}

# Function to install Composer
install_composer() {
    if command_exists composer; then
        print_warning "Composer is already installed"
        return
    fi
    
    print_status "Installing Composer..."
    curl -sS https://getcomposer.org/installer | php
    sudo mv composer.phar /usr/local/bin/composer
    sudo chmod +x /usr/local/bin/composer
    print_success "Composer installed"
}

# Function to install Node.js
install_nodejs() {
    if command_exists node; then
        print_warning "Node.js is already installed"
        return
    fi
    
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed"
}

# Function to install MySQL
install_mysql() {
    if command_exists mysql; then
        print_warning "MySQL is already installed"
        return
    fi
    
    print_status "Installing MySQL..."
    sudo apt install mysql-server -y
    sudo systemctl enable mysql
    sudo systemctl start mysql
    
    # Secure MySQL installation
    print_status "Securing MySQL installation..."
    sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';"
    sudo mysql -e "DELETE FROM mysql.user WHERE User='';"
    sudo mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
    sudo mysql -e "DROP DATABASE IF EXISTS test;"
    sudo mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    sudo mysql -e "FLUSH PRIVILEGES;"
    print_success "MySQL installed and secured"
}

# Function to install Git
install_git() {
    if command_exists git; then
        print_warning "Git is already installed"
        return
    fi
    
    print_status "Installing Git..."
    sudo apt install git -y
    print_success "Git installed"
}

# Function to configure PHP
configure_php() {
    print_status "Configuring PHP..."
    
    # Backup original php.ini
    sudo cp /etc/php/8.2/fpm/php.ini /etc/php/8.2/fpm/php.ini.backup
    
    # Update PHP configuration
    sudo sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 64M/' /etc/php/8.2/fpm/php.ini
    sudo sed -i 's/post_max_size = 8M/post_max_size = 64M/' /etc/php/8.2/fpm/php.ini
    sudo sed -i 's/memory_limit = 128M/memory_limit = 256M/' /etc/php/8.2/fpm/php.ini
    sudo sed -i 's/max_execution_time = 30/max_execution_time = 300/' /etc/php/8.2/fpm/php.ini
    sudo sed -i 's/max_input_vars = 1000/max_input_vars = 3000/' /etc/php/8.2/fpm/php.ini
    
    # Restart PHP-FPM
    sudo systemctl restart php8.2-fpm
    print_success "PHP configured"
}

# Function to create application directory
create_app_directory() {
    print_status "Creating application directory..."
    sudo mkdir -p /var/www/curl-xer
    sudo chown -R $USER:$USER /var/www/curl-xer
    sudo chmod -R 755 /var/www/curl-xer
    
    # Create backup directory
    sudo mkdir -p /var/www/backups/curl-xer
    sudo chown -R $USER:$USER /var/www/backups/curl-xer
    print_success "Application directory created"
}

# Function to configure Apache
configure_apache() {
    print_status "Configuring Apache..."
    
    # Enable required Apache modules
    sudo a2enmod rewrite
    sudo a2enmod headers
    sudo a2enmod expires
    
    # Create Apache virtual host configuration
    sudo tee /etc/apache2/sites-available/curl-xer.conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerName _
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
    
    ErrorLog \${APACHE_LOG_DIR}/curl-xer_error.log
    CustomLog \${APACHE_LOG_DIR}/curl-xer_access.log combined
</VirtualHost>
EOF
    
    # Disable default site and enable our site
    sudo a2dissite 000-default
    sudo a2ensite curl-xer
    
    # Test Apache configuration
    sudo apache2ctl configtest
    
    # Restart Apache
    sudo systemctl restart apache2
    print_success "Apache configured"
}

# Function to setup MySQL database
setup_mysql() {
    print_status "Setting up MySQL database..."
    
    # Create database and user
    sudo mysql -e "CREATE DATABASE IF NOT EXISTS curl_xer;"
    sudo mysql -e "CREATE USER IF NOT EXISTS 'curl_xer_user'@'localhost' IDENTIFIED BY 'curl_xer_password_123';"
    sudo mysql -e "GRANT ALL PRIVILEGES ON curl_xer.* TO 'curl_xer_user'@'localhost';"
    sudo mysql -e "FLUSH PRIVILEGES;"
    
    print_success "MySQL database setup completed"
    print_warning "Database credentials: curl_xer_user / curl_xer_password_123"
    print_warning "Please change these credentials in production!"
}

# Function to generate SSH key
generate_ssh_key() {
    print_status "Generating SSH key for GitHub Actions..."
    
    if [ ! -f ~/.ssh/id_rsa ]; then
        ssh-keygen -t rsa -b 4096 -C "github-actions@$(hostname)" -f ~/.ssh/id_rsa -N ""
        print_success "SSH key generated"
    else
        print_warning "SSH key already exists"
    fi
    
    # Add to authorized_keys
    cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    
    print_success "SSH key configured"
    print_status "Public key (add to GitHub Actions secrets):"
    echo "----------------------------------------"
    cat ~/.ssh/id_rsa
    echo "----------------------------------------"
}

# Function to setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    # Install UFW if not present
    if ! command_exists ufw; then
        sudo apt install ufw -y
    fi
    
    # Configure firewall
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

# Function to install additional tools
install_additional_tools() {
    print_status "Installing additional tools..."
    
    # Install useful tools
    sudo apt install htop curl wget unzip -y
    
    # Install Redis (optional)
    sudo apt install redis-server -y
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
    
    print_success "Additional tools installed"
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment file..."
    
    if [ -f /var/www/curl-xer/.env.example ]; then
        sudo cp /var/www/curl-xer/.env.example /var/www/curl-xer/.env
        sudo chown $USER:$USER /var/www/curl-xer/.env
        
        # Update database credentials
        sudo sed -i 's/DB_DATABASE=laravel/DB_DATABASE=curl_xer/' /var/www/curl-xer/.env
        sudo sed -i 's/DB_USERNAME=root/DB_USERNAME=curl_xer_user/' /var/www/curl-xer/.env
        sudo sed -i 's/DB_PASSWORD=/DB_PASSWORD=curl_xer_password_123/' /var/www/curl-xer/.env
        sudo sed -i 's/APP_ENV=local/APP_ENV=production/' /var/www/curl-xer/.env
        sudo sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' /var/www/curl-xer/.env
        
        print_success "Environment file created"
    else
        print_warning "No .env.example found. Please create .env manually."
    fi
}

# Function to show final instructions
show_final_instructions() {
    echo ""
    echo "🎉 Server setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy your Laravel application to /var/www/curl-xer"
    echo "2. Run: cd /var/www/curl-xer && composer install"
    echo "3. Run: php artisan key:generate"
    echo "4. Run: php artisan migrate"
    echo "5. Run: npm install && npm run build"
    echo "6. Set proper permissions: sudo chown -R www-data:www-data /var/www/curl-xer"
    echo ""
    echo "🔑 GitHub Actions Secrets to configure:"
    echo "- HOST: $(curl -s ifconfig.me)"
    echo "- USERNAME: $USER"
    echo "- SSH_KEY: (copy the private key shown above)"
    echo "- PORT: 22"
    echo ""
    echo "🌐 Your application will be available at: http://$(curl -s ifconfig.me)"
    echo ""
}

# Main execution
main() {
    echo "🚀 Laravel + React Server Setup Script"
    echo "======================================"
    echo ""
    
    # Check if running as root
    check_root
    
    # Update system
    update_system
    
    # Install software
    install_apache
    install_php
    install_composer
    install_nodejs
    install_mysql
    install_git
    
    # Configure software
    configure_php
    configure_apache
    setup_mysql
    
    # Setup application
    create_app_directory
    create_env_file
    
    # Setup deployment
    generate_ssh_key
    setup_firewall
    install_additional_tools
    
    # Show final instructions
    show_final_instructions
}

# Run main function
main "$@"
