<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class Notification
{
    public static function create(?int $userId, string $title, string $body, string $type = 'general', ?int $referenceId = null): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO notifications (user_id, title, body, type, reference_id, sent_at) VALUES (?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$userId, $title, $body, $type, $referenceId]);
        return (int) $db->lastInsertId();
    }

    public static function getByUser(int $userId, int $limit = 50): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?');
        $stmt->bindValue(1, $userId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function markRead(int $id, int $userId): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
        return $stmt->execute([$id, $userId]);
    }
}
