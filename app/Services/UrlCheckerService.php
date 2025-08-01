<?php

namespace App\Services;

use Illuminate\Support\Str;
use Exception;

class UrlCheckerService
{
    public function isValidDNS($dns): bool
    {
        if (!$dns) return true; // Empty DNS is valid (use default)
        return preg_match('/^(\d{1,3}\.){3}\d{1,3}$/', $dns);
    }

    public function getDefaultDNS(): array
    {
        $dns_servers = ['primary' => '', 'secondary' => ''];
        $os = strtoupper(substr(PHP_OS, 0, 3));

        try {
            if ($os === 'LIN') { // Linux/Ubuntu
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
                // Try PowerShell first (more reliable) - use full path
                $output = [];
                $return_var = 0;
                exec('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -Command "Get-DnsClientServerAddress | Select-Object -ExpandProperty ServerAddresses" 2>&1', $output, $return_var);
                
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
                    
                    if (isset($ipv4_dns[0])) {
                        $dns_servers['primary'] = $ipv4_dns[0];
                    }
                    if (isset($ipv4_dns[1])) {
                        $dns_servers['secondary'] = $ipv4_dns[1];
                    }
                } else {
                    // Fallback to ipconfig method
                    exec('ipconfig /all 2>&1', $output, $return_var);
                    $dns_found = 0;
                    $dns_section = false;
                    $current_adapter = '';
                    
                    foreach ($output as $line) {
                        $line = trim($line);
                        if (empty($line)) continue;

                        // Check for adapter name
                        if (preg_match('/^([^:]+):$/', $line, $matches)) {
                            $current_adapter = trim($matches[1]);
                            $dns_section = false;
                            continue;
                        }

                        // Look for DNS Servers line
                        if (preg_match('/DNS Servers.*?: ([\d\.]+)/', $line, $matches)) {
                            $dns_section = true;
                            if ($dns_found == 0) {
                                $dns_servers['primary'] = $matches[1];
                                $dns_found++;
                            }
                        } elseif ($dns_section && preg_match('/^\s*([\d\.]+)/', $line, $matches)) {
                            if ($dns_found == 1) {
                                $dns_servers['secondary'] = $matches[1];
                                $dns_found++;
                            }
                        } elseif ($dns_section && !preg_match('/^\s*([\d\.]+)/', $line)) {
                            $dns_section = false;
                        }

                        if ($dns_found >= 2) break;
                    }
                }
            } else {
                // For other operating systems, try common DNS files
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
            error_log("DNS detection error: " . $e->getMessage());
        }

        return $dns_servers;
    }

    public function normalizeURL($url): string|false
    {
        $url = trim($url);
        if (!preg_match('/^https?:\/\//i', $url)) {
            $url = 'https://' . $url;
        }
        return filter_var($url, FILTER_VALIDATE_URL) ? $url : false;
    }

    public function checkURLsParallel($urls, $primary_dns, $secondary_dns, $command = null, $batch_size = 100): array
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
                    CURLOPT_TIMEOUT => 30,
                    CURLOPT_CONNECTTIMEOUT => 10,
                    CURLOPT_SSL_VERIFYPEER => false,
                    CURLOPT_SSL_VERIFYHOST => false,
                    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    CURLOPT_NOBODY => true, // Only get headers
                ]);

                // Set custom DNS if provided
                if (!empty($primary_dns)) {
                    curl_setopt($ch, CURLOPT_DNS_USE_GLOBAL_CACHE, false);
                    curl_setopt($ch, CURLOPT_DNS_CACHE_TIMEOUT, 2);
                    curl_setopt($ch, CURLOPT_RESOLVE, [parse_url($normalized_url, PHP_URL_HOST) . ':80:' . $primary_dns]);
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

    public function generateCheckId(): string
    {
        return Str::uuid()->toString();
    }

    public function calculateSuccessRate($results): int
    {
        if (empty($results)) return 0;
        
        $successful = count(array_filter($results, function($result) {
            return $result['accessible'];
        }));
        
        return round(($successful / count($results)) * 100);
    }
} 