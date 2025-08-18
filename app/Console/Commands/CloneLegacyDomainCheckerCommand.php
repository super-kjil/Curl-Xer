<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class CloneLegacyDomainCheckerCommand extends Command
{
    protected $signature = 'domain-checker:clone-legacy {--host=localhost} {--db=dns_checker} {--user=root} {--pass=}';

    protected $description = 'Clone legacy PHP app database (domain_check_batches/results) into current Laravel DB';

    public function handle(): int
    {
        $host = (string)$this->option('host');
        $db = (string)$this->option('db');
        $user = (string)$this->option('user');
        $pass = (string)$this->option('pass');

        $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";

        try {
            $pdo = new \PDO($dsn, $user, $pass, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            ]);
        } catch (Throwable $e) {
            $this->error('Failed connecting to legacy DB: ' . $e->getMessage());
            return self::FAILURE;
        }

        // Ensure target tables exist
        if (!Schema::hasTable('domain_check_batches') || !Schema::hasTable('domain_check_results')) {
            $this->call('migrate', ['--force' => true]);
        }

        $this->info('Cloning batches...');
        $batchStmt = $pdo->query('SELECT id, user_id, note, created_at, updated_at FROM domain_check_batches');
        $batches = $batchStmt->fetchAll();

        DB::transaction(function () use ($batches) {
            foreach ($batches as $b) {
                // Upsert by id to preserve legacy ids
                DB::table('domain_check_batches')->updateOrInsert(
                    ['id' => $b['id']],
                    [
                        'user_id' => $b['user_id'] ?? null,
                        'note' => $b['note'] ?? null,
                        'created_at' => $b['created_at'] ?? now(),
                        'updated_at' => $b['updated_at'] ?? now(),
                    ]
                );
            }
        });

        $this->info('Cloning results...');
        $chunkSize = 5000;
        $offset = 0;
        while (true) {
            $stmt = $pdo->prepare('SELECT id, batch_id, domain_name, http_status, remark, checked_at FROM domain_check_results ORDER BY id ASC LIMIT :limit OFFSET :offset');
            $stmt->bindValue(':limit', $chunkSize, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll();
            if (empty($rows)) break;

            DB::transaction(function () use ($rows) {
                foreach ($rows as $r) {
                    DB::table('domain_check_results')->updateOrInsert(
                        ['id' => $r['id']],
                        [
                            'batch_id' => $r['batch_id'],
                            'domain_name' => $r['domain_name'],
                            'http_status' => $r['http_status'],
                            'remark' => $r['remark'] ?? null,
                            'checked_at' => $r['checked_at'] ?? now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                }
            });

            $offset += $chunkSize;
            $this->info("Cloned {$offset} results so far...");
        }

        $this->info('Clone complete.');
        return self::SUCCESS;
    }
}


