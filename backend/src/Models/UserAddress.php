<?php

namespace App\Models;

use App\Config\Database;

class UserAddress
{
    public static function getByUser(int $userId): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM user_addresses WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function create(int $userId, array $data): int
    {
        $db = Database::getConnection();
        if (!empty($data['is_default'])) {
            $db->prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?')->execute([$userId]);
        }
        $stmt = $db->prepare(
            'INSERT INTO user_addresses (user_id, name, mobile, address_line, area, city, state, pincode, lat, lng, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $data['name'],
            $data['mobile'],
            $data['address_line'],
            $data['area'] ?? null,
            $data['city'],
            $data['state'],
            $data['pincode'],
            isset($data['lat']) ? (float) $data['lat'] : null,
            isset($data['lng']) ? (float) $data['lng'] : null,
            !empty($data['is_default']) ? 1 : 0,
        ]);
        return (int) $db->lastInsertId();
    }

    public static function update(int $id, int $userId, array $data): bool
    {
        $db = Database::getConnection();
        $existing = self::findById($id);
        if (!$existing || (int) $existing['user_id'] !== $userId) {
            return false;
        }

        if (!empty($data['is_default'])) {
            $db->prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?')->execute([$userId]);
        }

        $lat = array_key_exists('lat', $data)
            ? ($data['lat'] !== null && $data['lat'] !== '' ? (float) $data['lat'] : null)
            : ($existing['lat'] ?? null);
        $lng = array_key_exists('lng', $data)
            ? ($data['lng'] !== null && $data['lng'] !== '' ? (float) $data['lng'] : null)
            : ($existing['lng'] ?? null);

        $stmt = $db->prepare(
            'UPDATE user_addresses SET name = ?, mobile = ?, address_line = ?, area = ?, city = ?, state = ?, pincode = ?, lat = ?, lng = ?, is_default = ?
             WHERE id = ? AND user_id = ?'
        );
        return $stmt->execute([
            $data['name'],
            $data['mobile'],
            $data['address_line'],
            $data['area'] ?? null,
            $data['city'],
            $data['state'],
            $data['pincode'],
            $lat,
            $lng,
            !empty($data['is_default']) ? 1 : 0,
            $id,
            $userId,
        ]);
    }

    public static function delete(int $id, int $userId): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('DELETE FROM user_addresses WHERE id = ? AND user_id = ?');
        return $stmt->execute([$id, $userId]);
    }

    public static function getDefault(int $userId): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}
