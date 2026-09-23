<?php

namespace App\Models;

use App\Config\Database;

class CmsPage
{
    public static function getBySlug(string $slug): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM cms_pages WHERE slug = ? LIMIT 1');
        $stmt->execute([$slug]);
        $page = $stmt->fetch();
        return $page ?: null;
    }

    public static function getAll(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT * FROM cms_pages ORDER BY title ASC');
        return $stmt->fetchAll();
    }

    public static function update(string $slug, string $title, string $content): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE cms_pages SET title = ?, content = ? WHERE slug = ?');
        return $stmt->execute([$title, $content, $slug]);
    }
}
