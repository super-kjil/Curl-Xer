# Domain Checker Migration to Laravel

This document describes the migration of the legacy PHP domain checker to Laravel framework.

## Overview

The legacy domain checker was a standalone PHP application that allowed users to check multiple URLs for accessibility and response times. It has been successfully migrated to Laravel with the following improvements:

- **Modern Framework**: Laravel 11 with Inertia.js and React
- **User Authentication**: Integrated with Laravel's authentication system
- **Database Integration**: Proper Eloquent models and migrations
- **Modern UI**: React components with Tailwind CSS
- **Better Architecture**: MVC pattern with service classes

## Features Migrated

### Core Functionality
- ✅ URL checking with parallel processing
- ✅ DNS server configuration
- ✅ Response time measurement
- ✅ Success rate calculation
- ✅ Command/identifier support

### User Interface
- ✅ Modern React-based UI
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Real-time results display
- ✅ History management
- ✅ Settings configuration

### Database
- ✅ URL checks history
- ✅ User-specific settings
- ✅ Proper relationships and constraints

## File Structure

```
app/
├── Http/Controllers/
│   ├── DomainCheckerController.php          # Main URL checking logic
│   ├── DomainCheckerHistoryController.php   # History management
│   └── DomainCheckerSettingsController.php  # Settings management
├── Models/
│   ├── UrlCheck.php                         # URL check results model
│   └── DomainCheckerSetting.php             # User settings model
└── Services/
    └── UrlCheckerService.php                # Core URL checking service

resources/js/pages/DomainChecker/
├── Index.tsx                                # Main interface
├── History.tsx                              # History view
└── Settings.tsx                             # Settings interface

database/migrations/
├── create_url_checks_table.php              # URL checks table
└── create_domain_checker_settings_table.php # Settings table
```

## Routes

### Domain Checker Routes
- `GET /domain-checker` - Main interface
- `POST /domain-checker/check-urls` - Check URLs
- `GET /domain-checker/default-dns` - Get system DNS
- `GET /domain-checker/history` - History page
- `GET /domain-checker/history/data` - Get history data
- `DELETE /domain-checker/history` - Delete history item
- `DELETE /domain-checker/history/clear` - Clear all history
- `GET /domain-checker/settings` - Settings page
- `POST /domain-checker/settings` - Update settings
- `GET /domain-checker/settings/detect-dns` - Detect system DNS

## Database Schema

### url_checks Table
- `id` - Primary key
- `check_id` - Unique check identifier (UUID)
- `command` - Optional command identifier
- `url_count` - Number of URLs checked
- `results` - JSON array of check results
- `timestamp` - When the check was performed
- `success_rate` - Percentage of successful checks
- `primary_dns` - Primary DNS server used
- `secondary_dns` - Secondary DNS server used
- `user_id` - Foreign key to users table
- `created_at`, `updated_at` - Timestamps

### domain_checker_settings Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `primary_dns` - Primary DNS server
- `secondary_dns` - Secondary DNS server
- `batch_size` - Number of URLs to check simultaneously
- `timeout` - Request timeout in seconds
- `auto_detect_dns` - Whether to auto-detect DNS
- `custom_dns_servers` - JSON array of custom DNS servers
- `created_at`, `updated_at` - Timestamps

## Key Improvements

### 1. Security
- User authentication required
- CSRF protection
- Input validation
- SQL injection prevention

### 2. Performance
- Optimized database queries
- Proper indexing
- Efficient JSON storage
- Background processing ready

### 3. User Experience
- Modern, responsive UI
- Real-time feedback
- Dark mode support
- Intuitive navigation

### 4. Maintainability
- Clean code architecture
- Service layer separation
- Proper error handling
- Comprehensive logging

## Usage

1. **Installation**: Follow Laravel installation instructions
2. **Database**: Run `php artisan migrate` to create tables
3. **Authentication**: Set up user authentication
4. **Access**: Navigate to `/domain-checker` after login

## Configuration

The domain checker can be configured through the settings page:
- DNS server configuration
- Batch size for parallel processing
- Request timeout settings
- Auto DNS detection

## Legacy Data Migration

To migrate data from the legacy system:

1. Export data from the old `url_checks` table
2. Transform the data to match the new schema
3. Import using Laravel's database seeder or direct SQL

## Future Enhancements

- Background job processing for large URL lists
- Email notifications for failed checks
- API endpoints for external integration
- Advanced filtering and search in history
- Export functionality (CSV, JSON)
- Scheduled URL monitoring

## Troubleshooting

### Common Issues

1. **DNS Detection Fails**: Ensure proper permissions for system commands
2. **URL Check Timeout**: Adjust timeout settings in the configuration
3. **Memory Issues**: Reduce batch size for large URL lists
4. **Database Errors**: Check migration status and database connection

### Logs

Check Laravel logs in `storage/logs/laravel.log` for detailed error information.

## Support

For issues or questions about the migration, refer to:
- Laravel documentation: https://laravel.com/docs
- Inertia.js documentation: https://inertiajs.com
- React documentation: https://reactjs.org/docs 