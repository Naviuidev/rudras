<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class AuditLog
{
    public static function log(?int $adminId, string $action, string $entityType, ?int $entityId = null, ?string $details = null): void
    {
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare(
                'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
            );
            $stmt->execute([$adminId, $action, $entityType, $entityId, $details]);
        } catch (\Exception $e) {
            // Table may not exist yet
        }
    }

    public static function getRecent(int $limit = 10): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?');
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
