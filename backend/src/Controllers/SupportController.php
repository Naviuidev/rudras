<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Models\PaymentSupportTicket;
use App\Services\MailService;
use App\Utils\JWT;
use App\Utils\Response;

class SupportController
{
    private const ADMIN_HELP_ISSUES = [
        'User interface issue',
        'Functionality issue',
        'Payment integration Issue',
        'Admin portal login Issue',
        'Forgot admin password ?',
        'Message Query',
    ];

    private const PAYMENT_SERVICE_TYPES = [
        'Payment success but order not confirmed',
        'Payment status pending but money got debited',
        'Issue with the payment initiation',
        'Message us',
    ];

    public function contact(): void
    {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['name']) || empty($input['email']) || empty($input['message'])) {
            Response::error('Name, email and message are required');
        }
        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO support_messages (name, email, message) VALUES (?, ?, ?)');
        $stmt->execute([$input['name'], $input['email'], $input['message']]);
        Response::success(null, 'Message sent successfully');
    }

    public function info(): void
    {
        Response::success([
            'phone' => $_ENV['SUPPORT_PHONE'] ?? '+91 98765 43210',
            'email' => $_ENV['SUPPORT_EMAIL'] ?? 'support@rudrasfarmfresh.com',
            'whatsapp' => $_ENV['SUPPORT_WHATSAPP'] ?? '+91 98765 43210',
        ]);
    }

    public function adminHelp(): void
    {
        $auth = AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $issueType = trim((string) ($input['issue_type'] ?? ''));
        $message = trim((string) ($input['message'] ?? ''));

        if (!in_array($issueType, self::ADMIN_HELP_ISSUES, true)) {
            Response::error('Please select a valid issue type');
        }

        if ($message === '') {
            Response::error('Message is required');
        }

        $to = $_ENV['ADMIN_HELP_EMAIL'] ?? 'naveenreddy.webdev@gmail.com';
        $sent = MailService::sendAdminHelpRequest(
            $to,
            $issueType,
            $message,
            (string) ($auth->username ?? 'Admin'),
            (string) ($auth->email ?? '')
        );

        if (!$sent) {
            Response::error('Failed to send help request. Please try again later.', 500);
        }

        Response::success(null, 'Help request sent successfully');
    }

    public function paymentSupport(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $fullName = trim((string) ($input['full_name'] ?? ''));
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $phone = trim((string) ($input['phone'] ?? ''));
        $serviceType = trim((string) ($input['service_type'] ?? ''));
        $message = trim((string) ($input['message'] ?? ''));

        if ($fullName === '' || $email === '' || $phone === '' || $serviceType === '' || $message === '') {
            Response::error('Full name, email, phone, service and message are required');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Please enter a valid email address');
        }

        if (!in_array($serviceType, self::PAYMENT_SERVICE_TYPES, true)) {
            Response::error('Please select a valid service type');
        }

        $userId = $this->optionalUserId();

        $placeholder = 'TMP-' . bin2hex(random_bytes(4));
        $id = PaymentSupportTicket::create([
            'ticket_number' => $placeholder,
            'user_id' => $userId,
            'full_name' => $fullName,
            'email' => $email,
            'phone' => $phone,
            'service_type' => $serviceType,
            'message' => $message,
            'status' => 'pending',
        ]);

        $ticketNumber = PaymentSupportTicket::assignTicketNumber($id);

        $to = $_ENV['ADMIN_HELP_EMAIL'] ?? 'naveenreddy.webdev@gmail.com';
        $sent = MailService::sendPaymentSupportTicket(
            $to,
            $ticketNumber,
            $fullName,
            $email,
            $phone,
            $serviceType,
            $message
        );

        if (!$sent) {
            Response::error('Failed to submit your request. Please try again later.', 500);
        }

        Response::success([
            'ticket_number' => $ticketNumber,
            'status' => 'pending',
        ], 'Support ticket submitted successfully');
    }

    public function myTickets(): void
    {
        $auth = AuthMiddleware::authenticate(false);
        $userId = (int) ($auth->user_id ?? $auth->sub ?? $auth->id ?? 0);
        $email = (string) ($auth->email ?? '');

        if ($userId <= 0 || $email === '') {
            Response::error('Unable to load tickets for this account', 400);
        }

        $tickets = PaymentSupportTicket::listForUser($userId, $email);
        Response::success($tickets);
    }

    public function userTicketReply(int $id): void
    {
        $auth = AuthMiddleware::authenticate(false);
        $userId = (int) ($auth->user_id ?? $auth->sub ?? $auth->id ?? 0);
        $email = (string) ($auth->email ?? '');

        $ticket = PaymentSupportTicket::findById($id);
        if (!$ticket || !PaymentSupportTicket::userOwnsTicket($ticket, $userId, $email)) {
            Response::error('Ticket not found', 404);
        }

        if (PaymentSupportTicket::isClosed($ticket)) {
            Response::error('This ticket is closed');
        }

        if (!PaymentSupportTicket::canUserReply($ticket)) {
            Response::error('You can reply only after the admin responds to your ticket');
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $message = trim((string) ($input['message'] ?? ''));
        if ($message === '') {
            Response::error('Message is required');
        }

        if (!PaymentSupportTicket::addUserReply($id, $message)) {
            Response::error('Failed to send your reply', 500);
        }

        $to = $_ENV['ADMIN_HELP_EMAIL'] ?? 'naveenreddy.webdev@gmail.com';
        $sent = MailService::sendUserSupportReplyToAdmin(
            $to,
            (string) $ticket['ticket_number'],
            (string) $ticket['full_name'],
            (string) $ticket['email'],
            (string) $ticket['service_type'],
            $message
        );

        if (!$sent) {
            Response::error('Reply saved but failed to notify support. Please try again.', 500);
        }

        $updated = PaymentSupportTicket::findById($id);
        Response::success($updated, 'Reply sent successfully');
    }

    public function userCloseTicket(int $id): void
    {
        $auth = AuthMiddleware::authenticate(false);
        $userId = (int) ($auth->user_id ?? $auth->sub ?? $auth->id ?? 0);
        $email = (string) ($auth->email ?? '');

        $ticket = PaymentSupportTicket::findById($id);
        if (!$ticket || !PaymentSupportTicket::userOwnsTicket($ticket, $userId, $email)) {
            Response::error('Ticket not found', 404);
        }

        if (PaymentSupportTicket::isClosed($ticket)) {
            Response::error('This ticket is already closed');
        }

        if (!PaymentSupportTicket::close($id, 'user')) {
            Response::error('Failed to close ticket', 500);
        }

        $updated = PaymentSupportTicket::findById($id);
        Response::success($updated, 'Ticket closed successfully');
    }

    public function adminPaymentTickets(): void
    {
        AuthMiddleware::authenticate(true);

        Response::success([
            'stats' => PaymentSupportTicket::getStats(),
            'tickets' => PaymentSupportTicket::listAll(),
        ]);
    }

    public function adminTicketReply(int $id): void
    {
        AuthMiddleware::authenticate(true);

        $ticket = PaymentSupportTicket::findById($id);
        if (!$ticket) {
            Response::error('Ticket not found', 404);
        }

        if (PaymentSupportTicket::isClosed($ticket)) {
            Response::error('This ticket is closed');
        }

        if (!PaymentSupportTicket::canAdminReply($ticket)) {
            Response::error('Wait for the customer reply before sending another response');
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $message = trim((string) ($input['message'] ?? ''));
        if ($message === '') {
            Response::error('Reply message is required');
        }

        if (!PaymentSupportTicket::addAdminReply($id, $message)) {
            Response::error('Failed to send reply', 500);
        }

        $sent = MailService::sendSupportTicketReplyToUser(
            (string) $ticket['email'],
            (string) $ticket['ticket_number'],
            (string) $ticket['full_name'],
            'resolved',
            $message
        );

        if (!$sent) {
            Response::error('Reply saved but failed to email the customer. Please try again.', 500);
        }

        Response::success([
            'stats' => PaymentSupportTicket::getStats(),
            'ticket' => PaymentSupportTicket::findById($id),
        ], 'Reply sent successfully');
    }

    public function updatePaymentTicketStatus(int $id): void
    {
        AuthMiddleware::authenticate(true);

        $ticket = PaymentSupportTicket::findById($id);
        if (!$ticket) {
            Response::error('Ticket not found', 404);
        }

        if (PaymentSupportTicket::isClosed($ticket)) {
            Response::error('This ticket is closed');
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = trim((string) ($input['status'] ?? ''));

        if ($status !== 'in_progress') {
            Response::error('Only in-progress updates are supported here. Use reply to respond to the customer.');
        }

        if (!PaymentSupportTicket::updateStatus($id, $status)) {
            Response::error('Failed to update ticket status', 500);
        }

        Response::success([
            'stats' => PaymentSupportTicket::getStats(),
            'ticket' => PaymentSupportTicket::findById($id),
        ], 'Ticket status updated successfully');
    }

    public function adminCloseTicket(int $id): void
    {
        AuthMiddleware::authenticate(true);

        $ticket = PaymentSupportTicket::findById($id);
        if (!$ticket) {
            Response::error('Ticket not found', 404);
        }

        if (PaymentSupportTicket::isClosed($ticket)) {
            Response::error('This ticket is already closed');
        }

        if (!PaymentSupportTicket::close($id, 'admin')) {
            Response::error('Failed to close ticket', 500);
        }

        Response::success([
            'stats' => PaymentSupportTicket::getStats(),
            'ticket' => PaymentSupportTicket::findById($id),
        ], 'Ticket closed successfully');
    }

    private function optionalUserId(): ?int
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (!preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
            return null;
        }

        $decoded = JWT::decode($matches[1]);
        if (!$decoded) {
            return null;
        }

        $userId = (int) ($decoded->user_id ?? $decoded->sub ?? $decoded->id ?? 0);

        return $userId > 0 ? $userId : null;
    }
}
