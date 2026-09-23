<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class SkipRequest
{
    public static function getAll(?string $status = null): array
    {
        $db = Database::getConnection();
        $sql = 'SELECT sr.*, u.name as user_name, u.email as user_email, p.name as product_name
                FROM skip_requests sr
                JOIN users u ON u.id = sr.user_id
                LEFT JOIN products p ON p.id = sr.product_id';
        if ($status) {
            $stmt = $db->prepare($sql . ' WHERE sr.status = ? ORDER BY sr.created_at DESC');
            $stmt->execute([$status]);
        } else {
            $stmt = $db->query($sql . ' ORDER BY sr.created_at DESC');
        }
        return $stmt->fetchAll();
    }

    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM skip_requests WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function approve(int $id): bool
    {
        $req = self::findById($id);
        if (!$req || $req['status'] !== 'pending') {
            return false;
        }
        $db = Database::getConnection();
        Subscription::pauseDates((int) $req['subscription_id'], [$req['skip_date']]);
        $db->prepare("UPDATE skip_requests SET status = 'approved', reviewed_at = NOW() WHERE id = ?")->execute([$id]);
        CarryForwardLog::create([
            'user_id' => $req['user_id'],
            'subscription_id' => $req['subscription_id'],
            'skipped_days' => 1,
            'added_days' => 1,
            'balance_days' => 1,
            'note' => 'Skip approved for ' . $req['skip_date'],
        ]);
        return true;
    }

    public static function reject(int $id): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE skip_requests SET status = 'rejected', reviewed_at = NOW() WHERE id = ? AND status = 'pending'");
        return $stmt->execute([$id]);
    }

    public static function countPending(): int
    {
        $db = Database::getConnection();
        return (int) $db->query("SELECT COUNT(*) FROM skip_requests WHERE status = 'pending'")->fetchColumn();
    }

    public static function create(array $data): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO skip_requests (user_id, subscription_id, product_id, skip_date, reason, status)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['user_id'],
            $data['subscription_id'],
            $data['product_id'] ?? null,
            $data['skip_date'],
            $data['reason'] ?? null,
            'pending',
        ]);
        return (int) $db->lastInsertId();
    }

    public static function getByUser(int $userId): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT sr.*, p.name as product_name FROM skip_requests sr
             LEFT JOIN products p ON p.id = sr.product_id
             WHERE sr.user_id = ? ORDER BY sr.created_at DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
}
