<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class Faq
{
    public static function getAll(bool $activeOnly = false): array
    {
        $db = Database::getConnection();
        $sql = 'SELECT * FROM faqs';
        if ($activeOnly) {
            $sql .= ' WHERE is_active = 1';
        }
        $sql .= ' ORDER BY display_order ASC, id ASC';
        return $db->query($sql)->fetchAll();
    }

    /** Public list with duplicate questions removed (keeps first row per question). */
    public static function getPublic(): array
    {
        $seen = [];
        $unique = [];
        foreach (self::getAll(true) as $row) {
            $key = strtolower(trim((string) $row['question']));
            if ($key === '' || isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $unique[] = $row;
        }
        return $unique;
    }

    public static function create(array $data): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO faqs (question, answer, display_order, is_active) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $data['question'],
            $data['answer'],
            $data['display_order'] ?? 0,
            $data['is_active'] ?? 1,
        ]);
        return (int) $db->lastInsertId();
    }

    public static function update(int $id, array $data): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE faqs SET question = ?, answer = ?, display_order = ?, is_active = ? WHERE id = ?');
        return $stmt->execute([
            $data['question'],
            $data['answer'],
            $data['display_order'] ?? 0,
            $data['is_active'] ?? 1,
            $id,
        ]);
    }

    public static function delete(int $id): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('DELETE FROM faqs WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
