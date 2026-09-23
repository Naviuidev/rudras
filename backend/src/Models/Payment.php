<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class Payment
{
    public static function create(array $data): int
    {
        $db = Database::getConnection();
        $txnId = $data['transaction_id'] ?? ('TXN' . strtoupper(substr(uniqid(), -10)));
        $stmt = $db->prepare(
            'INSERT INTO payments (transaction_id, user_id, amount, payment_method, payment_status, reference_type, reference_id, payment_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $txnId,
            $data['user_id'],
            $data['amount'],
            $data['payment_method'] ?? 'phonepe',
            $data['payment_status'] ?? 'pending',
            $data['reference_type'] ?? null,
            $data['reference_id'] ?? null,
            $data['payment_date'] ?? date('Y-m-d H:i:s'),
        ]);
        return (int) $db->lastInsertId();
    }

    public static function findByTransactionId(string $txnId): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM payments WHERE transaction_id = ? LIMIT 1');
        $stmt->execute([$txnId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function updateStatus(string $txnId, string $status): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE payments SET payment_status = ? WHERE transaction_id = ?');
        return $stmt->execute([$status, $txnId]);
    }

    public static function getAll(?string $status = null, int $limit = 100): array
    {
        $db = Database::getConnection();
        $sql = 'SELECT p.*, u.name as user_name, u.email as user_email FROM payments p JOIN users u ON u.id = p.user_id';
        if ($status) {
            $stmt = $db->prepare($sql . ' WHERE p.payment_status = ? ORDER BY p.payment_date DESC LIMIT ?');
            $stmt->bindValue(1, $status, PDO::PARAM_STR);
            $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        } else {
            $stmt = $db->prepare($sql . ' ORDER BY p.payment_date DESC LIMIT ?');
            $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function getByUser(int $userId): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY payment_date DESC');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public static function countPending(): int
    {
        $db = Database::getConnection();
        return (int) $db->query("SELECT COUNT(*) FROM payments WHERE payment_status = 'pending'")->fetchColumn();
    }

    public static function getTotalRevenue(): float
    {
        $db = Database::getConnection();
        return (float) $db->query("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'paid'")->fetchColumn();
    }

    public static function getMonthlyRevenue(): float
    {
        $db = Database::getConnection();
        return (float) $db->query(
            "SELECT COALESCE(SUM(amount), 0) FROM payments
             WHERE payment_status = 'paid'
             AND MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE())"
        )->fetchColumn();
    }

    public static function getDailyRevenue(int $days = 30): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT DATE(payment_date) as date, COALESCE(SUM(amount), 0) as revenue
             FROM payments WHERE payment_status = 'paid' AND payment_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(payment_date) ORDER BY date ASC"
        );
        $stmt->execute([$days]);
        return $stmt->fetchAll();
    }

    public static function getCustomerLedger(int $userId): array
    {
        $subs = Subscription::getByUser($userId);
        $sub = Subscription::getActive($userId) ?: ($subs[0] ?? null);
        $paid = 0.0;
        $pending = 0.0;
        foreach (self::getByUser($userId) as $p) {
            if ($p['payment_status'] === 'paid') {
                $paid += (float) $p['amount'];
            } elseif ($p['payment_status'] === 'pending') {
                $pending += (float) $p['amount'];
            }
        }
        $user = User::findById($userId);
        return [
            'user' => $user,
            'subscription_amount' => $sub ? (float) $sub['total_amount'] : 0,
            'paid' => $paid,
            'pending' => $pending,
            'wallet_balance' => (float) ($user['wallet_balance'] ?? 0),
            'carry_forward_balance' => $sub ? (int) ($sub['carried_forward_days'] ?? 0) : 0,
            'payments' => self::getByUser($userId),
        ];
    }
}
