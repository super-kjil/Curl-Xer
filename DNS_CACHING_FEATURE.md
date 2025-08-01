# DNS Settings Caching Feature

## Overview

This feature implements localStorage caching for DNS settings to improve performance and reduce server requests. The DNS settings are cached locally for 5 minutes and automatically refreshed when needed.

## Features

### 1. Automatic Caching
- DNS settings are automatically cached in localStorage
- Cache expires after 5 minutes
- First load shows loading skeleton while fetching from server
- Subsequent loads within 5 minutes use cached data (instant loading)

### 2. Loading States
- Beautiful loading skeleton while fetching DNS settings
- Smooth transitions between loading and loaded states
- Loading indicator in the main interface

### 3. Cache Management
- Automatic cache invalidation after 5 minutes
- Manual refresh button to clear cache and reload from server
- Graceful fallback to server data if cache is corrupted

## Implementation Details

### Files Modified/Created

1. **`resources/js/hooks/use-dns-settings.tsx`**
   - Custom hook for managing DNS settings
   - Handles localStorage caching logic
   - Provides loading states and error handling

2. **`resources/js/components/dns-loading-skeleton.tsx`**
   - Loading skeleton component
   - Matches the design of the settings page
   - Shows while DNS settings are being loaded

3. **`resources/js/lib/dns-cache.ts`**
   - Utility functions for cache management
   - Cache validation and clearing functions

4. **`resources/js/pages/DomainChecker/Settings.tsx`**
   - Updated to use the new hook
   - Added refresh button
   - Improved loading experience

5. **`resources/js/pages/DomainChecker/Index.tsx`**
   - Updated to use cached DNS settings
   - Shows loading state for DNS display
   - Uses cached settings for URL checking

## Usage

### For Users
1. **First Visit**: Settings page shows loading skeleton while fetching DNS settings
2. **Subsequent Visits**: Settings load instantly from cache (within 5 minutes)
3. **Manual Refresh**: Click the refresh button (sync icon) to clear cache and reload from server
4. **Automatic Refresh**: Cache expires after 5 minutes, next visit will fetch fresh data

### For Developers
```typescript
// Using the DNS settings hook
const { settings, loading, updateSettings, saveSettings } = useDNSSettings();

// Manual cache management
import { DNSCache } from '@/lib/dns-cache';
DNSCache.clear(); // Clear cache
DNSCache.isValid(); // Check if cache is valid
```

## Benefits

1. **Performance**: Instant loading of DNS settings after first visit
2. **User Experience**: Smooth loading states and transitions
3. **Reduced Server Load**: Fewer API calls for DNS settings
4. **Offline Capability**: Settings available even if server is temporarily unavailable
5. **Consistency**: Same settings across all components

## Cache Strategy

- **Cache Duration**: 5 minutes
- **Storage Key**: `dns_settings_cache`
- **Cache Structure**: 
  ```json
  {
    "data": { /* DNS settings */ },
    "timestamp": 1234567890
  }
  ```
- **Validation**: Checks timestamp before using cached data
- **Fallback**: Falls back to server data if cache is invalid or corrupted

## Error Handling

- Graceful fallback to server data if cache is corrupted
- Console logging for debugging cache issues
- User-friendly error messages via toast notifications
- Automatic retry mechanism in the hook 