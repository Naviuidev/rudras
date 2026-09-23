<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class Order
{
    public static function generateOrderNumber(): string
    {
        return 'RFF' . date('Ymd') . strtoupper(substr(uniqid(), -6));
    }

    public static function create(
        int $userId,
        float $totalAmount,
        array $items,
        ?string $address = null,
        ?float $deliveryLat = null,
        ?float $deliveryLng = null
    ): int {
        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            $orderNumber = self::generateOrderNumber();
            $stmt = $db->prepare(
                'INSERT INTO orders (order_number, user_id, total_amount, delivery_address, delivery_lat, delivery_lng)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$orderNumber, $userId, $totalAmount, $address, $deliveryLat, $deliveryLng]);
            $orderId = (int) $db->lastInsertId();

            $itemStmt = $db->prepare(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
            );

            foreach ($items as $item) {
                $itemStmt->execute([$orderId, $item['product_id'], $item['quantity'], $item['price']]);
                Product::decrementStock($item['product_id'], $item['quantity']);
            }

            $db->commit();
            return $orderId;
        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM orders WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if ($order) {
            $order['items'] = self::getItems($id);
        }

        return $order ?: null;
    }

    public static function getItems(int $orderId): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT oi.*, p.name as product_name, p.image as product_image
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?'
        );
        $stmt->execute([$orderId]);
        return $stmt->fetchAll();
    }

    public static function getByUser(int $userId): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$userId]);
        $orders = $stmt->fetchAll();

        foreach ($orders as &$order) {
            $order['items'] = self::getItems($order['id']);
        }

        return $orders;
    }

    public static function getAll(?string $status = null, int $limit = 100, int $offset = 0): array
    {
        $db = Database::getConnection();
        $sql = 'SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON u.id = o.user_id';
        $params = [];

        if ($status) {
            $sql .= ' WHERE o.order_status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $db->prepare($sql);
        foreach ($params as $i => $param) {
            $stmt->bindValue($i + 1, $param, is_int($param) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        $orders = $stmt->fetchAll();

        foreach ($orders as &$order) {
            $order['items'] = self::getItems($order['id']);
        }

        return $orders;
    }

    public static function findDetailedById(int $id): ?array
    {
        $order = self::findById($id);
        if (!$order) {
            return null;
        }

        $db = Database::getConnection();

        $userStmt = $db->prepare(
            'SELECT id, name, email, mobile, area, address, wallet_balance, created_at
             FROM users WHERE id = ? LIMIT 1'
        );
        $userStmt->execute([(int) $order['user_id']]);
        $order['user'] = $userStmt->fetch() ?: null;

        $payStmt = $db->prepare(
            'SELECT * FROM payments
             WHERE reference_type = ? AND reference_id = ?
             ORDER BY id DESC LIMIT 1'
        );
        $payStmt->execute(['order', $id]);
        $order['payment'] = $payStmt->fetch() ?: null;

        return $order;
    }

    public static function updateStatus(int $id, string $status): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE orders SET order_status = ? WHERE id = ?');
        return $stmt->execute([$status, $id]);
    }

    public static function count(?string $status = null): int
    {
        $db = Database::getConnection();
        if ($status) {
            $stmt = $db->prepare('SELECT COUNT(*) FROM orders WHERE order_status = ?');
            $stmt->execute([$status]);
            return (int) $stmt->fetchColumn();
        }
        return (int) $db->query('SELECT COUNT(*) FROM orders')->fetchColumn();
    }

    public static function getDailyStats(int $days = 30): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total_amount) as revenue
             FROM orders
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC"
        );
        $stmt->execute([$days]);
        return $stmt->fetchAll();
    }

    public static function getMonthlyRevenue(): float
    {
        $db = Database::getConnection();
        $stmt = $db->query(
            "SELECT COALESCE(SUM(total_amount), 0) FROM orders
             WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
             AND order_status != 'cancelled'"
        );
        return (float) $stmt->fetchColumn();
    }
}
