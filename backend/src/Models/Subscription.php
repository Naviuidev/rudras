<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class Subscription
{
    public static function create(int $userId, array $data): int
    {
        $db = Database::getConnection();

        $carriedDays = self::getCarryForwardDays($userId);
        $deliveryDates = $data['delivery_dates'] ?? [];
        if (!is_array($deliveryDates)) {
            $deliveryDates = [];
        }
        $deliveryDates = array_values(array_unique(array_filter($deliveryDates)));
        sort($deliveryDates);

        $paidDeliveries = count($deliveryDates) > 0
            ? count($deliveryDates)
            : (int) ($data['total_days'] ?? 30);

        $pricePerDay = (float) ($data['price_per_day'] ?? 60);
        $quantity = (float) ($data['quantity'] ?? 1);
        $frequency = $data['frequency'] ?? 'daily';
        $productId = !empty($data['product_id']) ? (int) $data['product_id'] : null;

        $startDate = !empty($deliveryDates)
            ? $deliveryDates[0]
            : ($data['start_date'] ?? date('Y-m-d'));

        $endDate = !empty($deliveryDates)
            ? $deliveryDates[count($deliveryDates) - 1]
            : (!empty($data['end_date'])
                ? $data['end_date']
                : date('Y-m-d', strtotime($startDate . " +{$paidDeliveries} days")));

        $totalDays = $paidDeliveries + $carriedDays;
        $totalAmount = isset($data['total_amount'])
            ? (float) $data['total_amount']
            : ($paidDeliveries * $pricePerDay * $quantity);

        $stmt = $db->prepare(
            'INSERT INTO subscriptions (user_id, product_id, start_date, end_date, quantity, frequency, total_days, remaining_days, price_per_day, total_amount, carried_forward_days, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $productId,
            $startDate,
            $endDate,
            $quantity,
            $frequency,
            $totalDays,
            $totalDays,
            $pricePerDay,
            $totalAmount,
            $carriedDays,
            'active',
        ]);

        $subscriptionId = (int) $db->lastInsertId();

        foreach ($deliveryDates as $date) {
            self::logDelivery($userId, $subscriptionId, $date, $quantity, 'scheduled');
        }

        return $subscriptionId;
    }

    public static function getCarryForwardDays(int $userId): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT remaining_days FROM subscriptions
             WHERE user_id = ? AND status IN ('expired', 'active')
             ORDER BY created_at DESC LIMIT 1"
        );
        $stmt->execute([$userId]);
        $sub = $stmt->fetch();

        if ($sub && $sub['remaining_days'] > 0) {
            $db->prepare("UPDATE subscriptions SET status = 'expired', remaining_days = 0 WHERE user_id = ? AND status = 'active'")
                ->execute([$userId]);
            return (int) $sub['remaining_days'];
        }

        return 0;
    }

    public static function getActive(int $userId): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
        );
        $stmt->execute([$userId]);
        $sub = $stmt->fetch();
        return $sub ?: null;
    }

    public static function getByUser(int $userId): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public static function getAll(?string $status = null): array
    {
        $db = Database::getConnection();
        $sql = 'SELECT s.*, u.name as user_name, u.email as user_email
                FROM subscriptions s
                JOIN users u ON u.id = s.user_id';

        if ($status) {
            $sql .= ' WHERE s.status = ?';
            $stmt = $db->prepare($sql . ' ORDER BY s.created_at DESC');
            $stmt->execute([$status]);
        } else {
            $stmt = $db->query($sql . ' ORDER BY s.created_at DESC');
        }

        return $stmt->fetchAll();
    }

    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM subscriptions WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $sub = $stmt->fetch();
        return $sub ?: null;
    }

    public static function pauseDates(int $subscriptionId, array $dates): int
    {
        $db = Database::getConnection();
        $count = 0;

        foreach ($dates as $date) {
            try {
                $stmt = $db->prepare('INSERT INTO delivery_pauses (subscription_id, pause_date) VALUES (?, ?)');
                if ($stmt->execute([$subscriptionId, $date])) {
                    $count++;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        if ($count > 0) {
            $db->prepare('UPDATE subscriptions SET remaining_days = remaining_days + ? WHERE id = ?')
                ->execute([$count, $subscriptionId]);
        }

        return $count;
    }

    public static function resume(int $subscriptionId): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE subscriptions SET status = 'active' WHERE id = ?");
        return $stmt->execute([$subscriptionId]);
    }

    public static function pause(int $subscriptionId): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE subscriptions SET status = 'paused' WHERE id = ?");
        return $stmt->execute([$subscriptionId]);
    }

    public static function processDailyDelivery(): void
    {
        $db = Database::getConnection();
        $today = date('Y-m-d');

        $stmt = $db->query("SELECT * FROM subscriptions WHERE status = 'active' AND end_date >= '{$today}' AND remaining_days > 0");
        $subscriptions = $stmt->fetchAll();

        foreach ($subscriptions as $sub) {
            $pauseCheck = $db->prepare('SELECT id FROM delivery_pauses WHERE subscription_id = ? AND pause_date = ?');
            $pauseCheck->execute([$sub['id'], $today]);

            if ($pauseCheck->fetch()) {
                self::logDelivery($sub['user_id'], $sub['id'], $today, $sub['quantity'], 'paused');
                continue;
            }

            self::logDelivery($sub['user_id'], $sub['id'], $today, $sub['quantity'], 'delivered');
            $db->prepare('UPDATE subscriptions SET remaining_days = remaining_days - 1 WHERE id = ?')
                ->execute([$sub['id']]);

            $updated = self::findById($sub['id']);
            if ($updated && $updated['remaining_days'] <= 0) {
                $db->prepare("UPDATE subscriptions SET status = 'expired' WHERE id = ?")->execute([$sub['id']]);
            }
        }
    }

    public static function logDelivery(int $userId, int $subscriptionId, string $date, float $quantity, string $status): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO delivery_logs (user_id, subscription_id, delivery_date, quantity, status) VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE status = VALUES(status)'
        );
        $stmt->execute([$userId, $subscriptionId, $date, $quantity, $status]);
    }

    public static function getPauses(int $subscriptionId): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM delivery_pauses WHERE subscription_id = ? ORDER BY pause_date ASC');
        $stmt->execute([$subscriptionId]);
        return $stmt->fetchAll();
    }

    public static function getDeliveryLogs(int $userId, int $limit = 30): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM delivery_logs WHERE user_id = ? ORDER BY delivery_date DESC LIMIT ?');
        $stmt->bindValue(1, $userId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function countActive(): int
    {
        $db = Database::getConnection();
        return (int) $db->query("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'")->fetchColumn();
    }

    public static function getGrowthStats(int $months = 6): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
             FROM subscriptions
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month ASC"
        );
        $stmt->execute([$months]);
        return $stmt->fetchAll();
    }

    public static function cancel(int $subscriptionId): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE subscriptions SET status = 'cancelled' WHERE id = ?");
        return $stmt->execute([$subscriptionId]);
    }

    public static function countByStatus(string $status): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT COUNT(*) FROM subscriptions WHERE status = ?');
        $stmt->execute([$status]);
        return (int) $stmt->fetchColumn();
    }

    public static function getDeliverySummary(int $subscriptionId): array
    {
        $sub = self::findById($subscriptionId);
        if (!$sub) {
            return [];
        }
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT COUNT(*) FROM delivery_logs WHERE subscription_id = ? AND status = 'delivered'");
        $stmt->execute([$subscriptionId]);
        $delivered = (int) $stmt->fetchColumn();
        $stmt = $db->prepare("SELECT COUNT(*) FROM delivery_logs WHERE subscription_id = ? AND status = 'skipped'");
        $stmt->execute([$subscriptionId]);
        $skipped = (int) $stmt->fetchColumn();
        return [
            'total_days' => (int) $sub['total_days'],
            'delivered_days' => $delivered,
            'skipped_days' => $skipped,
            'remaining_days' => (int) $sub['remaining_days'],
            'carry_forward_days' => (int) $sub['carried_forward_days'],
        ];
    }

    public static function getNextDeliveryDate(int $subscriptionId): ?string
    {
        $sub = self::findById($subscriptionId);
        if (!$sub || $sub['status'] !== 'active' || $sub['remaining_days'] <= 0) {
            return null;
        }

        $db = Database::getConnection();
        $tomorrow = date('Y-m-d', strtotime('+1 day'));

        for ($i = 0; $i < 30; $i++) {
            $checkDate = date('Y-m-d', strtotime($tomorrow . " +{$i} days"));
            $stmt = $db->prepare('SELECT id FROM delivery_pauses WHERE subscription_id = ? AND pause_date = ?');
            $stmt->execute([$subscriptionId, $checkDate]);
            if (!$stmt->fetch()) {
                return $checkDate;
            }
        }

        return $tomorrow;
    }
}
