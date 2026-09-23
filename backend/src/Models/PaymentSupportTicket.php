<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class PaymentSupportTicket
{
    public static function create(array $data): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO payment_support_tickets (ticket_number, user_id, full_name, email, phone, service_type, message, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['ticket_number'],
            $data['user_id'] ?? null,
            $data['full_name'],
            $data['email'],
            $data['phone'],
            $data['service_type'],
            $data['message'],
            $data['status'] ?? 'pending',
        ]);

        $ticketId = (int) $db->lastInsertId();
        PaymentSupportTicketMessage::add($ticketId, 'user', (string) $data['message']);

        return $ticketId;
    }

    public static function assignTicketNumber(int $id): string
    {
        $ticketNumber = 'RFF-' . str_pad((string) $id, 6, '0', STR_PAD_LEFT);
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE payment_support_tickets SET ticket_number = ? WHERE id = ?');
        $stmt->execute([$ticketNumber, $id]);

        return $ticketNumber;
    }

    /** @return array<int, array<string, mixed>> */
    public static function listForUser(int $userId, string $email): array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT id, ticket_number, full_name, email, phone, service_type, message, status, closed_by, closed_at, created_at, updated_at
             FROM payment_support_tickets
             WHERE user_id = ? OR email = ?
             ORDER BY created_at DESC
             LIMIT 50'
        );
        $stmt->execute([$userId, strtolower(trim($email))]);

        return self::attachMessages($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
    }

    /** @return array<int, array<string, mixed>> */
    public static function listAll(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query(
            'SELECT id, ticket_number, user_id, full_name, email, phone, service_type, message, status, closed_by, closed_at, created_at, updated_at
             FROM payment_support_tickets
             ORDER BY created_at DESC'
        );

        return self::attachMessages($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
    }

    /** @return array{total: int, answered: int, pending: int} */
    public static function getStats(): array
    {
        $db = Database::getConnection();
        $stmt = $db->query(
            "SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'closed' THEN 0 WHEN status = 'resolved' THEN 1 ELSE 0 END) AS answered,
                SUM(CASE WHEN status = 'closed' THEN 0 WHEN status IN ('pending', 'in_progress') THEN 1 ELSE 0 END) AS pending
             FROM payment_support_tickets"
        );
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        return [
            'total' => (int) ($row['total'] ?? 0),
            'answered' => (int) ($row['answered'] ?? 0),
            'pending' => (int) ($row['pending'] ?? 0),
        ];
    }

    public static function findById(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT id, ticket_number, user_id, full_name, email, phone, service_type, message, status, closed_by, closed_at, created_at, updated_at
             FROM payment_support_tickets
             WHERE id = ?
             LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        $attached = self::attachMessages([$row]);

        return $attached[0] ?? null;
    }

    public static function userOwnsTicket(array $ticket, int $userId, string $email): bool
    {
        $ticketUserId = (int) ($ticket['user_id'] ?? 0);
        $ticketEmail = strtolower(trim((string) ($ticket['email'] ?? '')));

        return ($ticketUserId > 0 && $ticketUserId === $userId)
            || ($ticketEmail !== '' && $ticketEmail === strtolower(trim($email)));
    }

    public static function isClosed(array $ticket): bool
    {
        return ($ticket['status'] ?? '') === 'closed';
    }

    public static function canUserReply(array $ticket): bool
    {
        if (self::isClosed($ticket)) {
            return false;
        }

        $messages = $ticket['messages'] ?? [];
        if ($messages === []) {
            return false;
        }

        $last = $messages[count($messages) - 1];

        return ($last['sender_type'] ?? '') === 'admin';
    }

    public static function canAdminReply(array $ticket): bool
    {
        if (self::isClosed($ticket)) {
            return false;
        }

        $messages = $ticket['messages'] ?? [];
        if ($messages === []) {
            return true;
        }

        $last = $messages[count($messages) - 1];

        return ($last['sender_type'] ?? '') === 'user';
    }

    public static function addAdminReply(int $id, string $message): bool
    {
        PaymentSupportTicketMessage::add($id, 'admin', $message);
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "UPDATE payment_support_tickets
             SET status = 'resolved', admin_reply = ?, admin_replied_at = NOW()
             WHERE id = ?"
        );

        return $stmt->execute([trim($message), $id]);
    }

    public static function addUserReply(int $id, string $message): bool
    {
        PaymentSupportTicketMessage::add($id, 'user', $message);
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "UPDATE payment_support_tickets
             SET status = 'pending', message = ?
             WHERE id = ?"
        );

        return $stmt->execute([trim($message), $id]);
    }

    public static function updateStatus(int $id, string $status): bool
    {
        $allowed = ['pending', 'in_progress', 'resolved', 'closed'];
        if (!in_array($status, $allowed, true)) {
            return false;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE payment_support_tickets SET status = ? WHERE id = ?');

        return $stmt->execute([$status, $id]);
    }

    public static function close(int $id, string $closedBy): bool
    {
        if (!in_array($closedBy, ['user', 'admin'], true)) {
            return false;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare(
            "UPDATE payment_support_tickets
             SET status = 'closed', closed_by = ?, closed_at = NOW()
             WHERE id = ?"
        );

        return $stmt->execute([$closedBy, $id]);
    }

    /** @param array<int, array<string, mixed>> $tickets */
    private static function attachMessages(array $tickets): array
    {
        if ($tickets === []) {
            return [];
        }

        $ids = array_map(static fn(array $ticket): int => (int) $ticket['id'], $tickets);
        $grouped = PaymentSupportTicketMessage::listGroupedByTicketIds($ids);

        foreach ($tickets as &$ticket) {
            $ticketId = (int) $ticket['id'];
            $ticket['messages'] = $grouped[$ticketId] ?? [];
            $ticket['can_user_reply'] = self::canUserReply($ticket);
            $ticket['can_admin_reply'] = self::canAdminReply($ticket);
        }
        unset($ticket);

        return $tickets;
    }
}
