<?php

namespace App\Models;

use App\Config\Database;

class Category
{
    public static function getAll(bool $activeOnly = false): array
    {
        $db = Database::getConnection();
        $sql = 'SELECT * FROM categories';
        if ($activeOnly) {
            $sql .= ' WHERE is_active = 1';
        }
        $sql .= ' ORDER BY display_order ASC, name ASC';
        return $db->query($sql)->fetchAll();
    }

    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM categories WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function findBySlug(string $slug): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM categories WHERE slug = ? LIMIT 1');
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function slugify(string $name): string
    {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        return trim($slug, '-');
    }

    public static function create(string $name, ?string $image = null, int $displayOrder = 0): int
    {
        $db = Database::getConnection();
        $slug = self::slugify($name);
        $stmt = $db->prepare('INSERT INTO categories (name, slug, image, display_order) VALUES (?, ?, ?, ?)');
        $stmt->execute([trim($name), $slug, $image, $displayOrder]);
        return (int) $db->lastInsertId();
    }

    public static function update(int $id, array $data): bool
    {
        $db = Database::getConnection();
        $fields = [];
        $params = [];

        if (isset($data['name'])) {
            $fields[] = 'name = ?';
            $params[] = trim($data['name']);
        }
        if (array_key_exists('image', $data)) {
            $fields[] = 'image = ?';
            $params[] = $data['image'];
        }
        if (isset($data['display_order'])) {
            $fields[] = 'display_order = ?';
            $params[] = (int) $data['display_order'];
        }
        if (isset($data['is_active'])) {
            $fields[] = 'is_active = ?';
            $params[] = !empty($data['is_active']) ? 1 : 0;
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $stmt = $db->prepare('UPDATE categories SET ' . implode(', ', $fields) . ' WHERE id = ?');
        return $stmt->execute($params);
    }

    public static function delete(int $id): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('DELETE FROM categories WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public static function countProducts(string $slug): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT COUNT(*) FROM products WHERE category = ?');
        $stmt->execute([$slug]);
        return (int) $stmt->fetchColumn();
    }

    public static function count(): int
    {
        $db = Database::getConnection();
        return (int) $db->query('SELECT COUNT(*) FROM categories')->fetchColumn();
    }
}
