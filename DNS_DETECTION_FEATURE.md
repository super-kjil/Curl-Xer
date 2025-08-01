# DNS Detection and Database Saving Feature

## Overview

This feature enhances the "Detect DNS" button to automatically detect DNS settings from the current machine and save them directly to the database. The detected DNS settings are then cached in localStorage for improved performance.

## Features

### 1. Automatic DNS Detection
- Detects DNS settings from the current machine's network configuration
- Supports Windows, Linux, and other operating systems
- Uses multiple detection methods for reliability

### 2. Database Integration
- Automatically saves detected DNS settings to the database
- Updates the user's DNS settings record
- Maintains data consistency across sessions

### 3. Enhanced User Experience
- Loading state during DNS detection
- Success/error feedback via toast notifications
- Automatic cache update after detection

## Implementation Details

### Backend Changes

#### 1. **`app/Http/Controllers/DomainCheckerSettingsController.php`**
- Enhanced `detectDNS()` method to save detected DNS to database
- Added comprehensive error handling and logging
- Returns updated settings object for frontend cache update

#### 2. **`app/Services/UrlCheckerService.php`**
- Improved `getDefaultDNS()` method with better error handling
- Enhanced Windows PowerShell detection with return code checking
- Added support for additional operating systems
- Added try-catch blocks for robust error handling

### Frontend Changes

#### 1. **`resources/js/hooks/use-dns-settings.tsx`**
- Added `detecting` state for loading feedback
- Updated `detectDNS()` to handle server response with saved settings
- Enhanced error handling and user feedback

#### 2. **`resources/js/pages/DomainChecker/Settings.tsx`**
- Added loading state for "Detect DNS" button
- Disabled button during detection process
- Shows spinner and "Detecting..." text during operation

## How It Works

### 1. DNS Detection Process
```
User clicks "Detect DNS" → 
Frontend shows loading state → 
Backend detects DNS from machine → 
Backend saves to database → 
Frontend updates cache → 
User sees success message
```

### 2. Detection Methods by OS

#### Windows
1. **Primary Method**: PowerShell `Get-DnsClientServerAddress`
2. **Fallback Method**: `ipconfig /all` parsing
3. **Error Handling**: Captures stderr and return codes

#### Linux/Unix
1. **Primary Method**: `/etc/resolv.conf` parsing
2. **Fallback Methods**: 
   - `/etc/network/interfaces`
   - `/etc/systemd/resolved.conf`

#### Other OS
- Tries common DNS configuration files
- Uses regex pattern matching for IP addresses

### 3. Database Integration
- Uses `updateOrCreate()` to handle new/existing records
- Sets `auto_detect_dns` flag to `true`
- Preserves other settings while updating DNS

## Error Handling

### Backend
- Comprehensive try-catch blocks
- Detailed logging for debugging
- Graceful fallbacks for different OS methods
- Returns meaningful error messages

### Frontend
- Loading states prevent multiple clicks
- Toast notifications for success/error feedback
- Graceful handling of network errors

## Benefits

1. **User Convenience**: One-click DNS detection and saving
2. **Data Persistence**: Detected settings saved to database
3. **Performance**: Cached settings load instantly after detection
4. **Reliability**: Multiple detection methods with fallbacks
5. **Debugging**: Comprehensive logging for troubleshooting

## Usage

### For Users
1. Navigate to Settings page
2. Click "Detect DNS" button
3. Wait for detection to complete (shows loading state)
4. DNS settings are automatically saved and displayed
5. Settings are cached for future use

### For Developers
```php
// Backend: Detect and save DNS
$dns = $urlCheckerService->getDefaultDNS();
$settings = DomainCheckerSetting::updateOrCreate(
    ['user_id' => Auth::id()],
    [
        'primary_dns' => $dns['primary'] ?? '',
        'secondary_dns' => $dns['secondary'] ?? '',
        'auto_detect_dns' => true,
    ]
);
```

```typescript
// Frontend: Use detecting state
const { detectDNS, detecting } = useDNSSettings();

// Button with loading state
<button disabled={detecting} onClick={detectDNS}>
    {detecting ? 'Detecting...' : 'Detect DNS'}
</button>
```

## Logging

The system logs DNS detection results and errors for debugging:

```php
Log::info('DNS Detection Result', [
    'user_id' => Auth::id(),
    'detected_dns' => $dns,
    'os' => PHP_OS
]);
```

## Troubleshooting

### Common Issues
1. **No DNS detected**: Check if user has proper network configuration
2. **Permission errors**: Ensure web server has access to system commands
3. **Cache issues**: Use refresh button to clear cache and retry

### Debug Steps
1. Check Laravel logs for DNS detection errors
2. Verify network configuration on the server
3. Test DNS detection manually via command line
4. Clear browser cache if frontend issues persist 