<?php

namespace App\Services;

use Illuminate\Support\Str;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class UrlCheckerService
{
    public function isValidDNS($dns): bool
    {
        if (!$dns) return true; // Empty DNS is valid (use default)
        return preg_match('/^(\d{1,3}\.){3}\d{1,3}$/', $dns);
    }

    /**
     * Get server DNS with caching (shared for all team members)
     */
    public function getServerDNSWithCache(): array
    {
        $cacheKey = 'server_dns_settings';
        $cacheDuration = 15; // 15 minutes
        
        return Cache::remember($cacheKey, $cacheDuration * 60, function () {
            Log::info('Fetching fresh DNS from server for team cache');
            return $this->getDefaultDNS();
        });
    }

    /**
     * Clear server DNS cache
     */
    public function clearServerDNSCache(): void
    {
        Cache::forget('server_dns_settings');
        Log::info('Server DNS cache cleared');
    }

    /**
     * Check if server DNS cache exists and is valid
     */
    public function hasValidServerDNSCache(): bool
    {
        return Cache::has('server_dns_settings');
    }

    /**
     * Get cache info for debugging
     */
    public function getServerDNSCacheInfo(): array
    {
        $cacheKey = 'server_dns_settings';
        $hasCache = Cache::has($cacheKey);
        
        if ($hasCache) {
            $cachedData = Cache::get($cacheKey);
            return [
                'cached' => true,
                'data' => $cachedData,
                'cache_key' => $cacheKey
            ];
        }
        
        return [
            'cached' => false,
            'cache_key' => $cacheKey
        ];
    }

    /**
     * Original method for direct DNS detection (no cache)
     */
    public function getDefaultDNS(): array
    {
        $dns_servers = ['primary' => '', 'secondary' => ''];
        $os = strtoupper(substr(PHP_OS, 0, 3));

        // Clear any potential DNS cache before detection
        $this->clearSystemDNSCache();

        try {
            if ($os === 'LIN') { // Linux/Ubuntu
                // Force fresh read of resolv.conf
                clearstatcache(); // Clear file stat cache
                $resolv_file = '/etc/resolv.conf';
                if (file_exists($resolv_file)) {
                    $lines = file($resolv_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                    $dns_count = 0;
                    foreach ($lines as $line) {
                        if (preg_match('/^nameserver\s+([\d\.]+)/', $line, $matches)) {
                            if ($dns_count == 0) {
                                $dns_servers['primary'] = $matches[1];
                            } elseif ($dns_count == 1) {
                                $dns_servers['secondary'] = $matches[1];
                            }
                            $dns_count++;
                            if ($dns_count >= 2) break;
                        }
                    }
                }
            } elseif ($os === 'WIN') { // Windows
                // Multiple methods to detect DNS servers on Windows
                $output = [];
                $return_var = 0;
                
                // Method 1: Try PowerShell with more comprehensive command (use full path)
                exec('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -Command "Clear-DnsClientCache; Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses} | Select-Object -ExpandProperty ServerAddresses" 2>&1', $output, $return_var);
                
                Log::info('PowerShell DNS Detection Method 1', [
                    'output' => $output,
                    'return_var' => $return_var
                ]);

                if ($return_var === 0 && !empty($output)) {
                    // Filter out empty lines and get unique IPv4 DNS servers only
                    $dns_list = array_filter(array_map('trim', $output));
                    $dns_list = array_unique($dns_list);
                    $dns_list = array_values($dns_list); // Re-index array

                    // Filter for IPv4 addresses only (exclude IPv6)
                    $ipv4_dns = [];
                    foreach ($dns_list as $dns) {
                        if (preg_match('/^(\d{1,3}\.){3}\d{1,3}$/', $dns)) {
                            $ipv4_dns[] = $dns;
                        }
                    }

                    // Prioritize local/ISP DNS servers over public ones
                    $local_dns = [];
                    $public_dns = [];
                    
                    foreach ($ipv4_dns as $dns) {
                        // Common public DNS servers to deprioritize
                        if (in_array($dns, ['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1', '208.67.222.222', '208.67.220.220'])) {
                            $public_dns[] = $dns;
                        } else {
                            $local_dns[] = $dns;
                        }
                    }
                    
                    // Further prioritize specific local network ranges (87.247.167.x)
                    $priority_local = [];
                    $other_local = [];
                    
                    foreach ($local_dns as $dns) {
                        if (preg_match('/^87\.247\.167\./', $dns)) {
                            $priority_local[] = $dns;
                        } else {
                            $other_local[] = $dns;
                        }
                    }
                    
                    // Use priority local DNS first, then other local, then public DNS as fallback
                    $prioritized_dns = array_merge($priority_local, $other_local, $public_dns);

                    if (isset($prioritized_dns[0])) {
                        $dns_servers['primary'] = $prioritized_dns[0];
                    }
                    if (isset($prioritized_dns[1])) {
                        $dns_servers['secondary'] = $prioritized_dns[1];
                    }
                }
                
                // Method 2: If PowerShell didn't work, try alternative PowerShell command
                if (empty($dns_servers['primary'])) {
                    $output = [];
                    exec('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -Command "Get-NetIPConfiguration | Select-Object -ExpandProperty DNSServer | Where-Object {$_.AddressFamily -eq 2} | Select-Object -ExpandProperty ServerAddresses" 2>&1', $output, $return_var);
                    
                    Log::info('PowerShell DNS Detection Method 2', [
                        'output' => $output,
                        'return_var' => $return_var
                    ]);

                    if ($return_var === 0 && !empty($output)) {
                        $dns_list = array_filter(array_map('trim', $output));
                        $dns_list = array_unique($dns_list);
                        $dns_list = array_values($dns_list);

                        $ipv4_dns = [];
                        foreach ($dns_list as $dns) {
                            if (preg_match('/^(\d{1,3}\.){3}\d{1,3}$/', $dns)) {
                                $ipv4_dns[] = $dns;
                            }
                        }

                        if (isset($ipv4_dns[0])) {
                            $dns_servers['primary'] = $ipv4_dns[0];
                        }
                        if (isset($ipv4_dns[1])) {
                            $dns_servers['secondary'] = $ipv4_dns[1];
                        }
                    }
                }

                // Method 3: Fallback to ipconfig method with improved parsing
                if (empty($dns_servers['primary'])) {
                    $output = [];
                    exec('ipconfig /flushdns && ipconfig /all 2>&1', $output, $return_var);
                    
                    Log::info('ipconfig DNS Detection Method 3', [
                        'output_sample' => array_slice($output, 0, 20), // Log first 20 lines
                        'return_var' => $return_var
                    ]);

                    $dns_found = 0;
                    $dns_section = false;
                    $current_adapter = '';
                    $found_dns_servers = [];

                    foreach ($output as $line) {
                        $line = trim($line);
                        if (empty($line)) continue;

                        // Check for adapter name
                        if (preg_match('/^([^:]+):$/', $line, $matches)) {
                            $current_adapter = trim($matches[1]);
                            $dns_section = false;
                            continue;
                        }

                        // Look for DNS Servers line with various patterns
                        if (preg_match('/DNS Servers.*?:\s*([\d\.]+)/', $line, $matches)) {
                            $found_dns_servers[] = $matches[1];
                            $dns_section = true;
                        } elseif ($dns_section && preg_match('/^\s*([\d\.]+)/', $line, $matches)) {
                            $found_dns_servers[] = $matches[1];
                        } elseif ($dns_section && !preg_match('/^\s*([\d\.]+)/', $line)) {
                            $dns_section = false;
                        }
                    }

                    // Remove duplicates and assign to primary/secondary
                    $found_dns_servers = array_unique($found_dns_servers);
                    $found_dns_servers = array_values($found_dns_servers);
                    
                    if (isset($found_dns_servers[0])) {
                        $dns_servers['primary'] = $found_dns_servers[0];
                    }
                    if (isset($found_dns_servers[1])) {
                        $dns_servers['secondary'] = $found_dns_servers[1];
                    }
                }

                // Method 4: Try WMIC as last resort
                if (empty($dns_servers['primary'])) {
                    $output = [];
                    exec('wmic nicconfig where "IPEnabled=true" get DNSServerSearchOrder /format:list 2>&1', $output, $return_var);
                    
                    Log::info('WMIC DNS Detection Method 4', [
                        'output' => $output,
                        'return_var' => $return_var
                    ]);

                    foreach ($output as $line) {
                        if (preg_match('/DNSServerSearchOrder=\{([^}]+)\}/', $line, $matches)) {
                            $dns_list = explode(',', $matches[1]);
                            $dns_list = array_map('trim', $dns_list);
                            $dns_list = array_filter($dns_list);
                            
                            if (isset($dns_list[0]) && preg_match('/^(\d{1,3}\.){3}\d{1,3}$/', $dns_list[0])) {
                                $dns_servers['primary'] = $dns_list[0];
                            }
                            if (isset($dns_list[1]) && preg_match('/^(\d{1,3}\.){3}\d{1,3}$/', $dns_list[1])) {
                                $dns_servers['secondary'] = $dns_list[1];
                            }
                            break;
                        }
                    }
                }
            } else {
                // For other operating systems, try common DNS files with fresh reads
                clearstatcache(); // Clear file stat cache
                $common_files = [
                    '/etc/resolv.conf',
                    '/etc/network/interfaces',
                    '/etc/systemd/resolved.conf'
                ];

                foreach ($common_files as $file) {
                    if (file_exists($file)) {
                        $content = file_get_contents($file);
                        if (preg_match_all('/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/', $content, $matches)) {
                            if (isset($matches[1][0])) {
                                $dns_servers['primary'] = $matches[1][0];
                            }
                            if (isset($matches[1][1])) {
                                $dns_servers['secondary'] = $matches[1][1];
                            }
                            break;
                        }
                    }
                }
            }
        } catch (Exception $e) {
            // Log error but don't fail completely
            Log::error("DNS detection error: " . $e->getMessage());
        }

        // Log the fresh DNS detection for debugging
        Log::info('Fresh DNS Detection (No Cache)', [
            'detected_dns' => $dns_servers,
            'os' => PHP_OS,
            'timestamp' => now()
        ]);

        return $dns_servers;
    }

    /**
     * Clear system DNS cache to ensure fresh lookups
     */
    private function clearSystemDNSCache(): void
    {
        $os = strtoupper(substr(PHP_OS, 0, 3));
        
        try {
            if ($os === 'WIN') {
                // Clear Windows DNS cache
                exec('ipconfig /flushdns 2>&1', $output, $return_var);
                Log::info('Windows DNS cache cleared', ['return_code' => $return_var]);
            } elseif ($os === 'LIN') {
                // Clear Linux DNS cache (systemd-resolved)
                exec('sudo systemctl flush-dns 2>&1 || sudo systemd-resolve --flush-caches 2>&1', $output, $return_var);
                Log::info('Linux DNS cache cleared', ['return_code' => $return_var]);
            }
        } catch (Exception $e) {
            Log::warning('Failed to clear system DNS cache: ' . $e->getMessage());
        }
    }

    public function normalizeURL($url): string|false
    {
        $url = trim($url);
        if (!preg_match('/^https?:\/\//i', $url)) {
            $url = 'https://' . $url;
        }
        return filter_var($url, FILTER_VALIDATE_URL) ? $url : false;
    }

    /**
     * Optimized method for handling large URL sets
     */
    public function checkURLsOptimized($urls, $primary_dns, $secondary_dns, $command = null, $batch_size = 500, $max_concurrent_batches = 3, $timeout = 30): array
    {
        $total_urls = count($urls);
        $results = [];
        $processed = 0;

        // Split URLs into batches
        $url_batches = array_chunk($urls, $batch_size);
        $total_batches = count($url_batches);

        Log::info("Starting optimized URL check", [
            'total_urls' => $total_urls,
            'total_batches' => $total_batches,
            'batch_size' => $batch_size,
            'max_concurrent_batches' => $max_concurrent_batches
        ]);

        // Process batches with controlled concurrency
        for ($i = 0; $i < $total_batches; $i += $max_concurrent_batches) {
            $current_batches = array_slice($url_batches, $i, $max_concurrent_batches);
            $batch_results = $this->processBatchesConcurrently($current_batches, $primary_dns, $secondary_dns, $timeout);

            // Merge results and free memory
            foreach ($batch_results as $batch_result) {
                $results = array_merge($results, $batch_result);
                $processed += count($batch_result);
            }

            // Log progress
            $progress = round(($processed / $total_urls) * 100, 2);
            Log::info("URL check progress", [
                'processed' => $processed,
                'total' => $total_urls,
                'progress_percent' => $progress
            ]);

            // Small delay to prevent overwhelming the system
            usleep(100000); // 0.1 second
        }

        return $results;
    }

    /**
     * Process multiple batches concurrently
     */
    private function processBatchesConcurrently($batches, $primary_dns, $secondary_dns, $timeout = 30): array
    {
        $all_results = [];
        $processes = [];

        foreach ($batches as $batch_index => $batch) {
            $process_results = $this->checkURLsParallel($batch, $primary_dns, $secondary_dns, null, null, $timeout);
            $all_results[] = $process_results;
        }

        return $all_results;
    }

    /**
     * Original method for backward compatibility
     */
    public function checkURLsParallel($urls, $primary_dns, $secondary_dns, $command = null, $batch_size = 100, $timeout = 30): array
    {
        $results = [];
        $dns_servers = [$primary_dns, $secondary_dns];
        $url_batches = array_chunk($urls, $batch_size);

        foreach ($url_batches as $batch) {
            $mh = curl_multi_init();
            $handles = [];

            // Initialize cURL handles for this batch
            foreach ($batch as $i => $url) {
                $normalized_url = $this->normalizeURL($url);
                if ($normalized_url === false) {
                    $results[] = [
                        'url' => $url,
                        'status' => 0,
                        'time' => 0,
                        'accessible' => false,
                        'error' => 'Invalid URL format'
                    ];
                    continue;
                }

                $ch = curl_init();
                curl_setopt_array($ch, [
                    CURLOPT_URL => $normalized_url,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_MAXREDIRS => 5,
                    CURLOPT_TIMEOUT => $timeout,
                    CURLOPT_CONNECTTIMEOUT => min(10, $timeout / 3),
                    CURLOPT_SSL_VERIFYPEER => false,
                    CURLOPT_SSL_VERIFYHOST => false,
                    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    CURLOPT_NOBODY => true, // Only get headers
                ]);

                // Set custom DNS if provided and disable DNS caching
                if (!empty($primary_dns)) {
                    curl_setopt($ch, CURLOPT_DNS_USE_GLOBAL_CACHE, false);
                    curl_setopt($ch, CURLOPT_DNS_CACHE_TIMEOUT, 0); // Disable DNS caching completely
                    curl_setopt($ch, CURLOPT_RESOLVE, [parse_url($normalized_url, PHP_URL_HOST) . ':80:' . $primary_dns]);
                } else {
                    // Even without custom DNS, disable caching to get fresh lookups
                    curl_setopt($ch, CURLOPT_DNS_USE_GLOBAL_CACHE, false);
                    curl_setopt($ch, CURLOPT_DNS_CACHE_TIMEOUT, 0);
                }

                $handles[$i] = $ch;
                curl_multi_add_handle($mh, $ch);
            }

            // Execute the batch
            $active = null;
            do {
                $mrc = curl_multi_exec($mh, $active);
            } while ($mrc == CURLM_CALL_MULTI_PERFORM);

            while ($active && $mrc == CURLM_OK) {
                if (curl_multi_select($mh) != -1) {
                    do {
                        $mrc = curl_multi_exec($mh, $active);
                    } while ($mrc == CURLM_CALL_MULTI_PERFORM);
                }
            }

            // Process results
            foreach ($handles as $i => $ch) {
                $url = $batch[$i];
                $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $total_time = curl_getinfo($ch, CURLINFO_TOTAL_TIME);
                $error = curl_error($ch);

                $results[] = [
                    'url' => $url,
                    'status' => $http_code,
                    'time' => round($total_time * 1000, 2), // Convert to milliseconds
                    'accessible' => $http_code >= 200 && $http_code < 400 && empty($error),
                    'error' => $error ?: null
                ];

                curl_multi_remove_handle($mh, $ch);
                curl_close($ch);
            }

            curl_multi_close($mh);
        }

        return $results;
    }

    /**
     * Calculate optimal batch size based on URL count and user settings
     */
    public function calculateOptimalBatchSize($url_count, $user_batch_size = 100, $user_large_batch_size = 1000): int
    {
        if ($url_count <= 1000) {
            return $user_batch_size;
        } elseif ($url_count <= 10000) {
            return min(250, $user_batch_size);
        } elseif ($url_count <= 50000) {
            return min(500, $user_large_batch_size);
        } else {
            return $user_large_batch_size; // For 90,000+ URLs
        }
    }

    /**
     * Calculate estimated processing time
     */
    public function estimateProcessingTime($url_count, $batch_size = 500, $timeout = 30): int
    {
        $batches = ceil($url_count / $batch_size);
        $seconds_per_batch = $timeout; // Use user's timeout setting
        return $batches * $seconds_per_batch;
    }

    public function generateCheckId(): string
    {
        return Str::uuid()->toString();
    }

    public function calculateSuccessRate($results): int
    {
        if (empty($results)) return 0;

        $successful = count(array_filter($results, function ($result) {
            return $result['accessible'];
        }));

        return round(($successful / count($results)) * 100);
    }
}
