<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class User
{
    public static function findByEmail(string $email): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT id, name, email, mobile, area, address, wallet_balance, role, is_active, password_hash, created_at
             FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function create(string $email, string $name = ''): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO users (email, name) VALUES (?, ?)');
        $stmt->execute([$email, $name ?: explode('@', $email)[0]]);
        return (int) $db->lastInsertId();
    }

    public static function hasPassword(?array $user): bool
    {
        return $user !== null && !empty($user['password_hash']);
    }

    public static function setPassword(int $id, string $password): bool
    {
        $db = Database::getConnection();
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        return $stmt->execute([$hash, $id]);
    }

    public static function verifyPassword(string $email, string $password): ?array
    {
        $user = self::findByEmail($email);
        if (!$user || empty($user['password_hash'])) {
            return null;
        }
        if (!password_verify($password, $user['password_hash'])) {
            return null;
        }
        return $user;
    }

    public static function update(int $id, array $data): bool
    {
        $db = Database::getConnection();
        $fields = [];
        $values = [];

        foreach (['name', 'mobile', 'push_token', 'area', 'address', 'wallet_balance', 'is_active'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $values[] = $id;
        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $db->prepare($sql);
        return $stmt->execute($values);
    }

    public static function getAll(int $limit = 100, int $offset = 0, ?string $search = null, ?string $status = null, ?string $subscriptionStatus = null): array
    {
        $db = Database::getConnection();
        $sql = "SELECT u.id, u.name, u.email, u.mobile, u.area, u.address, u.wallet_balance, u.is_active, u.created_at,
                (SELECT s.status FROM subscriptions s WHERE s.user_id = u.id ORDER BY s.created_at DESC LIMIT 1) as subscription_status,
                (SELECT s.status FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'active' LIMIT 1) as active_subscription
                FROM users u WHERE u.deleted_at IS NULL AND u.role = 'user'";
        $params = [];

        if ($search) {
            $sql .= ' AND (u.name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ? OR u.area LIKE ?)';
            $term = "%{$search}%";
            $params = array_merge($params, [$term, $term, $term, $term]);
        }
        if ($status === 'active') {
            $sql .= ' AND u.is_active = 1';
        } elseif ($status === 'inactive') {
            $sql .= ' AND u.is_active = 0';
        }
        if ($subscriptionStatus) {
            $sql .= " AND EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = ?)";
            $params[] = $subscriptionStatus;
        }

        $sql .= ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $db->prepare($sql);
        foreach ($params as $i => $param) {
            $stmt->bindValue($i + 1, $param, is_int($param) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function softDelete(int $id): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public static function getRecent(int $limit = 5): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT id, name, email, mobile, created_at FROM users
             WHERE deleted_at IS NULL AND role = 'user' ORDER BY created_at DESC LIMIT ?"
        );
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function countCustomers(): int
    {
        $db = Database::getConnection();
        return (int) $db->query("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'user'")->fetchColumn();
    }

    public static function count(): int
    {
        return self::countCustomers();
    }

    public static function getPushTokens(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT push_token FROM users WHERE push_token IS NOT NULL AND push_token != ''");
        return array_column($stmt->fetchAll(), 'push_token');
    }
}
