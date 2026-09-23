<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class Inventory
{
    public static function getStockOverview(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query(
            'SELECT id, name, sku, stock, low_stock_threshold, quantity, quantity_unit, category
             FROM products WHERE active_status = 1 ORDER BY name ASC'
        );
        $products = $stmt->fetchAll();
        foreach ($products as &$p) {
            $sold = self::getSoldQuantity((int) $p['id']);
            $p['sold_quantity'] = $sold;
            $p['remaining_quantity'] = max(0, (int) $p['stock'] - $sold);
            $p['low_stock'] = (int) $p['stock'] <= (int) $p['low_stock_threshold'];
        }
        return $products;
    }

    public static function getSoldQuantity(int $productId): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = ? AND o.order_status != \'cancelled\''
        );
        $stmt->execute([$productId]);
        return (int) $stmt->fetchColumn();
    }

    public static function addMovement(int $productId, string $type, int $quantity, ?string $notes = null): bool
    {
        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $stmt = $db->prepare('INSERT INTO stock_movements (product_id, change_type, quantity, notes) VALUES (?, ?, ?, ?)');
            $stmt->execute([$productId, $type, $quantity, $notes]);

            if ($type === 'added') {
                $db->prepare('UPDATE products SET stock = stock + ? WHERE id = ?')->execute([$quantity, $productId]);
            } elseif ($type === 'reduced') {
                $db->prepare('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?')->execute([$quantity, $productId]);
            } else {
                $db->prepare('UPDATE products SET stock = ? WHERE id = ?')->execute([$quantity, $productId]);
            }
            $db->commit();
            return true;
        } catch (\Exception $e) {
            $db->rollBack();
            return false;
        }
    }

    public static function getMovements(int $limit = 50): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT sm.*, p.name as product_name FROM stock_movements sm
             JOIN products p ON p.id = sm.product_id
             ORDER BY sm.created_at DESC LIMIT ?'
        );
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function getLowStockCount(): int
    {
        $db = Database::getConnection();
        return (int) $db->query(
            'SELECT COUNT(*) FROM products WHERE active_status = 1 AND stock <= low_stock_threshold'
        )->fetchColumn();
    }

    public static function getDailyRequirement(string $date = null): array
    {
        $date = $date ?: date('Y-m-d', strtotime('+1 day'));
        $db = Database::getConnection();

        $requirements = [];

        $stmt = $db->query(
            "SELECT COALESCE(p.name, 'Milk Subscription') as product_name,
                    COALESCE(SUM(s.quantity), 0) as total_liters
             FROM subscriptions s
             LEFT JOIN products p ON p.id = s.product_id
             WHERE s.status = 'active' AND s.remaining_days > 0
             GROUP BY COALESCE(p.name, 'Milk Subscription')"
        );
        foreach ($stmt->fetchAll() as $row) {
            $requirements[] = [
                'product' => $row['product_name'],
                'quantity' => (float) $row['total_liters'],
                'unit' => 'Litres',
                'source' => 'subscriptions',
            ];
        }

        $orderStmt = $db->prepare(
            "SELECT p.name as product_name, SUM(oi.quantity * p.quantity) as total_qty, p.quantity_unit
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             JOIN products p ON p.id = oi.product_id
             WHERE DATE(o.created_at) = ? AND o.order_status NOT IN ('cancelled', 'delivered')
             GROUP BY p.id, p.name, p.quantity_unit"
        );
        $orderStmt->execute([$date]);
        foreach ($orderStmt->fetchAll() as $row) {
            $requirements[] = [
                'product' => $row['product_name'],
                'quantity' => (float) $row['total_qty'],
                'unit' => $row['quantity_unit'] ?: 'Units',
                'source' => 'orders',
            ];
        }

        return $requirements;
    }

    public static function countDeliveriesForDate(string $date): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT COUNT(*) FROM subscriptions s
             WHERE s.status = 'active' AND s.remaining_days > 0
             AND NOT EXISTS (
               SELECT 1 FROM delivery_pauses dp WHERE dp.subscription_id = s.id AND dp.pause_date = ?
             )"
        );
        $stmt->execute([$date]);
        return (int) $stmt->fetchColumn();
    }
}
