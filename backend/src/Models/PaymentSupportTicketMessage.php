<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class PaymentSupportTicketMessage
{
    public static function add(int $ticketId, string $senderType, string $message): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO payment_support_ticket_messages (ticket_id, sender_type, message)
             VALUES (?, ?, ?)'
        );
        $stmt->execute([$ticketId, $senderType, trim($message)]);

        return (int) $db->lastInsertId();
    }

    /** @return array<int, array<int, array<string, mixed>>> */
    public static function listGroupedByTicketIds(array $ticketIds): array
    {
        if ($ticketIds === []) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($ticketIds), '?'));
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT id, ticket_id, sender_type, message, created_at
             FROM payment_support_ticket_messages
             WHERE ticket_id IN ($placeholders)
             ORDER BY created_at ASC, id ASC"
        );
        $stmt->execute(array_values($ticketIds));

        $grouped = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
            $ticketId = (int) $row['ticket_id'];
            $grouped[$ticketId][] = $row;
        }

        return $grouped;
    }

    public static function getLastMessage(int $ticketId): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT id, ticket_id, sender_type, message, created_at
             FROM payment_support_ticket_messages
             WHERE ticket_id = ?
             ORDER BY created_at DESC, id DESC
             LIMIT 1'
        );
        $stmt->execute([$ticketId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }
}
