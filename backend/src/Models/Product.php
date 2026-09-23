<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class Product
{
    private static function parseNumeric(mixed $value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }
        $cleaned = preg_replace('/[^\d.]/', '', (string) $value);
        return $cleaned !== '' ? (float) $cleaned : 0.0;
    }

    public static function calculatePriceAfterOffer(float $price, float $offerPercentage, bool $couponActive, float $couponPercentage): ?float
    {
        $discounts = [];
        if ($offerPercentage > 0) {
            $discounts[] = $offerPercentage;
        }
        if ($couponActive && $couponPercentage > 0) {
            $discounts[] = $couponPercentage;
        }

        if (empty($discounts)) {
            return null;
        }

        $bestDiscount = max($discounts);
        return round($price * (1 - $bestDiscount / 100), 2);
    }

    public static function normalizeProductData(array $data): array
    {
        $price = self::parseNumeric($data['price'] ?? 0);
        $offerPercentage = self::parseNumeric($data['offer_percentage'] ?? 0);
        $couponActive = !empty($data['coupon_active']);
        $couponPercentage = self::parseNumeric($data['coupon_percentage'] ?? 0);
        $couponCode = isset($data['coupon_code']) ? strtoupper(trim($data['coupon_code'])) : null;

        if ($couponActive && $couponCode && strlen($couponCode) !== 5) {
            throw new \InvalidArgumentException('Coupon code must be exactly 5 letters');
        }

        if (!$couponActive) {
            $couponCode = null;
            $couponPercentage = 0;
        }

        $categorySlug = trim($data['category'] ?? 'other');
        if ($categorySlug === '') {
            $categorySlug = 'other';
        }
        $category = Category::findBySlug($categorySlug);
        if (!$category) {
            throw new \InvalidArgumentException('Invalid category. Please select a category created in admin.');
        }

        return [
            'name' => trim($data['name'] ?? ''),
            'description' => $data['description'] ?? '',
            'image' => $data['image'] ?? null,
            'category' => $category['slug'],
            'price' => $price,
            'offer_percentage' => $offerPercentage,
            'coupon_active' => $couponActive ? 1 : 0,
            'coupon_code' => $couponCode,
            'coupon_percentage' => $couponPercentage,
            'price_after_offer' => self::calculatePriceAfterOffer($price, $offerPercentage, $couponActive, $couponPercentage),
            'quantity' => round(self::parseNumeric($data['quantity'] ?? 1), 2),
            'quantity_unit' => in_array($data['quantity_unit'] ?? 'L', ['L', 'ml'], true) ? $data['quantity_unit'] : 'L',
            'monthly_subscription' => !empty($data['monthly_subscription']) ? 1 : 0,
            'stock' => (int) ($data['stock'] ?? 100),
            'active_status' => (int) ($data['active_status'] ?? 1),
        ];
    }

    public static function getAll(?string $category = null, ?string $search = null, bool $activeOnly = true): array
    {
        $db = Database::getConnection();
        $sql = 'SELECT p.*, c.name AS category_name, c.image AS category_image
                FROM products p
                LEFT JOIN categories c ON c.slug = p.category
                WHERE 1=1';
        $params = [];

        if ($activeOnly) {
            $sql .= ' AND p.active_status = 1';
        }

        if ($category) {
            $sql .= ' AND p.category = ?';
            $params[] = $category;
        }

        if ($search) {
            $sql .= ' AND p.name LIKE ?';
            $params[] = "%{$search}%";
        }

        $sql .= ' ORDER BY p.created_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT p.*, c.name AS category_name, c.image AS category_image
             FROM products p
             LEFT JOIN categories c ON c.slug = p.category
             WHERE p.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        return $product ?: null;
    }

    public static function create(array $data): int
    {
        $data = self::normalizeProductData($data);
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO products (name, description, image, category, price, offer_percentage, coupon_active, coupon_code, coupon_percentage, price_after_offer, quantity, quantity_unit, monthly_subscription, stock, active_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['name'],
            $data['description'],
            $data['image'],
            $data['category'],
            $data['price'],
            $data['offer_percentage'],
            $data['coupon_active'],
            $data['coupon_code'],
            $data['coupon_percentage'],
            $data['price_after_offer'],
            $data['quantity'],
            $data['quantity_unit'],
            $data['monthly_subscription'],
            $data['stock'],
            $data['active_status'],
        ]);
        return (int) $db->lastInsertId();
    }

    public static function update(int $id, array $data): bool
    {
        $data = self::normalizeProductData(array_merge(self::findById($id) ?? [], $data));
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'UPDATE products SET name = ?, description = ?, image = ?, category = ?, price = ?,
             offer_percentage = ?, coupon_active = ?, coupon_code = ?, coupon_percentage = ?,
             price_after_offer = ?, quantity = ?, quantity_unit = ?, monthly_subscription = ?, stock = ?, active_status = ? WHERE id = ?'
        );
        return $stmt->execute([
            $data['name'],
            $data['description'],
            $data['image'],
            $data['category'],
            $data['price'],
            $data['offer_percentage'],
            $data['coupon_active'],
            $data['coupon_code'],
            $data['coupon_percentage'],
            $data['price_after_offer'],
            $data['quantity'],
            $data['quantity_unit'],
            $data['monthly_subscription'],
            $data['stock'],
            $data['active_status'],
            $id,
        ]);
    }

    public static function delete(int $id): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('DELETE FROM products WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public static function decrementStock(int $id, int $quantity): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
        return $stmt->execute([$quantity, $id, $quantity]);
    }

    public static function count(): int
    {
        $db = Database::getConnection();
        return (int) $db->query('SELECT COUNT(*) FROM products WHERE active_status = 1')->fetchColumn();
    }

    public static function getSalesStats(int $days = 30): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT p.name, SUM(oi.quantity) as units_sold, SUM(oi.quantity * oi.price) as revenue
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             JOIN orders o ON o.id = oi.order_id
             WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND o.order_status != 'cancelled'
             GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10"
        );
        $stmt->execute([$days]);
        return $stmt->fetchAll();
    }
}
