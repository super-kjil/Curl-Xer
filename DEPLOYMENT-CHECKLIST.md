# 🚀 Deployment Checklist

## ✅ Pre-Deployment Setup

### Server Setup
- [ ] Ubuntu server is running and accessible
- [ ] Server setup script has been executed (`chmod +x scripts/setup-server.sh && ./scripts/setup-server.sh`)
- [ ] All required software is installed (Apache, PHP 8.2, MySQL, Node.js 18, Composer)
- [ ] Application directory `/var/www/curl-xer` exists with proper permissions
- [ ] Database `curl_xer` is created with user `curl_xer_user`
- [ ] Apache configuration is active and working
- [ ] PHP-FPM is running and configured
- [ ] Firewall allows SSH (22), HTTP (80), and HTTPS (443)

### GitHub Repository
- [ ] Repository contains the Laravel application
- [ ] `.github/workflows/deploy.yml` file is committed
- [ ] `DEPLOYMENT.md` and setup scripts are committed
- [ ] Main branch contains the latest code

## 🔑 GitHub Secrets Configuration

### Required Secrets
- [ ] **`HOST`**: Your server IP address or domain
- [ ] **`USERNAME`**: Your server username (e.g., `ubuntu`)
- [ ] **`SSH_KEY`**: Private SSH key content (from server)
- [ ] **`PORT`**: SSH port (usually `22`)

### How to Add Secrets
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact names above

## 🚀 First Deployment

### Manual Trigger
- [ ] Go to **Actions** tab in your repository
- [ ] Click **Deploy to Ubuntu Server** workflow
- [ ] Click **Run workflow** → **Run workflow**
- [ ] Monitor the deployment process

### Automatic Deployment
- [ ] Push to `main` branch to trigger automatic deployment
- [ ] Check GitHub Actions tab for deployment status
- [ ] Verify deployment completes successfully

## 🔍 Post-Deployment Verification

### Server Health Check
- [ ] Application responds at `http://your-server-ip`
- [ ] No error messages in browser console
- [ ] Database connection is working
- [ ] Static assets (CSS/JS) are loading

### Service Status
- [ ] Apache is running: `sudo systemctl status apache2`
- [ ] PHP-FPM is running: `sudo systemctl status php8.2-fpm`
- [ ] MySQL is running: `sudo systemctl status mysql`

### Logs Check
- [ ] Laravel logs: `sudo tail -f /var/www/curl-xer/storage/logs/laravel.log`
- [ ] Apache logs: `sudo tail -f /var/log/apache2/curl-xer_error.log`
- [ ] PHP-FPM logs: `sudo tail -f /var/log/php8.2-fpm.log`

## 🛠️ Troubleshooting Common Issues

### Permission Issues
```bash
sudo chown -R www-data:www-data /var/www/curl-xer
sudo chmod -R 755 /var/www/curl-xer
sudo chmod -R 775 /var/www/curl-xer/storage /var/www/curl-xer/bootstrap/cache
```

### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u curl_xer_user -p curl_xer

# Check .env file
cat /var/www/curl-xer/.env | grep DB_
```

### Apache Issues
```bash
# Test configuration
sudo apache2ctl configtest

# Check syntax
sudo apache2ctl -S

# Restart service
sudo systemctl restart apache2
```

### PHP Issues
```bash
# Check PHP version
php -v

# Check PHP-FPM status
sudo systemctl status php8.2-fpm

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
```

## 📱 Monitoring

### GitHub Actions
- [ ] Monitor workflow runs in Actions tab
- [ ] Check for failed deployments
- [ ] Review deployment logs for errors

### Server Monitoring
- [ ] Set up log rotation for Laravel logs
- [ ] Monitor disk space usage
- [ ] Check server resource usage (CPU, RAM)

## 🔄 Continuous Deployment

### Automatic Triggers
- [ ] Push to `main` branch triggers deployment
- [ ] Push to `develop` branch triggers deployment
- [ ] Manual workflow dispatch is working

### Rollback Process
- [ ] Backup directory `/var/www/backups/curl-xer` exists
- [ ] Know how to restore from backup if needed
- [ ] Test rollback process

## 📚 Documentation

### Keep Updated
- [ ] Update `DEPLOYMENT.md` with any custom configurations
- [ ] Document any server-specific settings
- [ ] Keep deployment scripts up to date

### Team Knowledge
- [ ] Team members know how to trigger deployments
- [ ] Team members know how to check deployment status
- [ ] Team members know how to rollback if needed

---

## 🎯 Quick Commands

### Check Deployment Status
```bash
# Check if application is responding
curl -I http://your-server-ip

# Check service status
sudo systemctl status apache2 php8.2-fpm mysql

# Check recent deployments
ls -la /var/www/backups/curl-xer/
```

### Manual Deployment Test
```bash
# Test the deployment process manually
cd /var/www/curl-xer
git pull origin main
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo systemctl restart apache2 php8.2-fpm
```

---

**✅ Complete all items above for a successful deployment! 🚀**
