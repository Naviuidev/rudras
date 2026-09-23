<?php

namespace App\Models;

use App\Config\Database;

class CarryForwardLog
{
    public static function create(array $data): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO carry_forward_logs (user_id, subscription_id, skipped_days, added_days, balance_days, note)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['user_id'],
            $data['subscription_id'],
            $data['skipped_days'] ?? 0,
            $data['added_days'] ?? 0,
            $data['balance_days'] ?? 0,
            $data['note'] ?? null,
        ]);
        return (int) $db->lastInsertId();
    }

    public static function getAll(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query(
            'SELECT c.*, u.name as user_name, u.email as user_email
             FROM carry_forward_logs c
             JOIN users u ON u.id = c.user_id
             ORDER BY c.created_at DESC'
        );
        return $stmt->fetchAll();
    }

    public static function getByUser(int $userId): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM carry_forward_logs WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
}
