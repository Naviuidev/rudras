<?php

namespace App\Models;

use App\Config\Database;

class ServiceLocation
{
    public static function getAll(bool $activeOnly = false): array
    {
        $db = Database::getConnection();
        $sql = 'SELECT * FROM service_locations';
        if ($activeOnly) {
            $sql .= ' WHERE is_active = 1';
        }
        $sql .= ' ORDER BY display_order ASC, created_at DESC';
        return $db->query($sql)->fetchAll();
    }

    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM service_locations WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function create(
        string $name,
        string $mapUrl,
        int $displayOrder = 0,
        ?float $lat = null,
        ?float $lng = null
    ): int {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO service_locations (name, map_url, lat, lng, display_order) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([trim($name), trim($mapUrl), $lat, $lng, $displayOrder]);
        return (int) $db->lastInsertId();
    }

    public static function updateCoords(int $id, float $lat, float $lng): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE service_locations SET lat = ?, lng = ? WHERE id = ?');
        return $stmt->execute([$lat, $lng, $id]);
    }

    public static function delete(int $id): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('DELETE FROM service_locations WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public static function count(): int
    {
        $db = Database::getConnection();
        return (int) $db->query('SELECT COUNT(*) FROM service_locations')->fetchColumn();
    }
}
