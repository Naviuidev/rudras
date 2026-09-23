<?php

namespace App\Models;

use App\Config\Database;

class Banner
{
    public static function getActive(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT id, title, image FROM banners WHERE is_active = 1 ORDER BY sort_order ASC');
        return $stmt->fetchAll();
    }

    public static function getAll(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT * FROM banners ORDER BY sort_order ASC');
        return $stmt->fetchAll();
    }

    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM banners WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $banner = $stmt->fetch();
        return $banner ?: null;
    }

    public static function create(array $data): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO banners (title, image, sort_order, is_active) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $data['title'],
            $data['image'],
            $data['sort_order'] ?? 0,
            $data['is_active'] ?? 1,
        ]);
        return (int) $db->lastInsertId();
    }

    public static function update(int $id, array $data): bool
    {
        $db = Database::getConnection();
        $fields = [];
        $values = [];

        foreach (['title', 'image', 'sort_order', 'is_active'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $values[] = $id;
        $sql = 'UPDATE banners SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $db->prepare($sql);
        return $stmt->execute($values);
    }

    public static function delete(int $id): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('DELETE FROM banners WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
