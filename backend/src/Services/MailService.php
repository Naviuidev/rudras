<?php

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class MailService
{
    private static function createMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = $_ENV['SMTP_USER'] ?? '';
        $mail->Password = $_ENV['SMTP_PASS'] ?? '';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = (int) ($_ENV['SMTP_PORT'] ?? 587);

        $fromEmail = $_ENV['SMTP_FROM'] ?? $_ENV['SMTP_USER'] ?? '';
        $fromName = $_ENV['SMTP_FROM_NAME'] ?? 'Rudras Farm Fresh';
        if (!empty($_ENV['SMTP_USER']) && str_contains(strtolower($_ENV['SMTP_HOST'] ?? ''), 'gmail')) {
            $fromEmail = $_ENV['SMTP_USER'];
        }

        $mail->setFrom($fromEmail, $fromName);
        $mail->isHTML(true);

        return $mail;
    }

    public static function sendOTP(string $email, string $otp): bool
    {
        $mail = null;
        try {
            $mail = self::createMailer();
            $mail->addAddress($email);
            $mail->Subject = 'Your OTP - Rudras Farm Fresh';
            $mail->Body = "
                <div style='font-family: Poppins, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #d9e8c9; border-radius: 12px;'>
                    <h2 style='color: #2d5016;'>Rudras Farm Fresh</h2>
                    <p>Your verification code is:</p>
                    <h1 style='letter-spacing: 8px; color: #2d5016;'>{$otp}</h1>
                    <p style='color: #666;'>This code expires in 10 minutes.</p>
                </div>
            ";

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('Mail error: ' . ($mail?->ErrorInfo ?: $e->getMessage()));
            return false;
        }
    }

    public static function sendAdminHelpRequest(
        string $to,
        string $issueType,
        string $message,
        string $adminUsername = '',
        string $adminEmail = ''
    ): bool {
        $mail = null;
        try {
            $mail = self::createMailer();
            $mail->addAddress($to);
            $mail->Subject = 'Admin Help Request - ' . $issueType;
            $safeIssue = htmlspecialchars($issueType, ENT_QUOTES, 'UTF-8');
            $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
            $safeUser = htmlspecialchars($adminUsername, ENT_QUOTES, 'UTF-8');
            $safeEmail = htmlspecialchars($adminEmail, ENT_QUOTES, 'UTF-8');

            $mail->Body = "
                <div style='font-family: Poppins, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8f9f6; border-radius: 12px;'>
                    <h2 style='color: #2d5016; margin-top: 0;'>Admin Help Request</h2>
                    <p><strong>Issue type:</strong> {$safeIssue}</p>
                    <p><strong>Admin user:</strong> {$safeUser}</p>
                    <p><strong>Admin email:</strong> {$safeEmail}</p>
                    <p><strong>Message:</strong></p>
                    <div style='background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; padding: 12px;'>{$safeMessage}</div>
                </div>
            ";

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('Admin help mail error: ' . ($mail?->ErrorInfo ?: $e->getMessage()));
            return false;
        }
    }

    public static function sendPaymentSupportTicket(
        string $to,
        string $ticketNumber,
        string $fullName,
        string $email,
        string $phone,
        string $serviceType,
        string $message
    ): bool {
        $mail = null;
        try {
            $mail = self::createMailer();
            $mail->addAddress($to);
            $mail->Subject = 'Payment Support Ticket - ' . $ticketNumber;
            $safeTicket = htmlspecialchars($ticketNumber, ENT_QUOTES, 'UTF-8');
            $safeName = htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8');
            $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
            $safePhone = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
            $safeService = htmlspecialchars($serviceType, ENT_QUOTES, 'UTF-8');
            $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));

            $mail->Body = "
                <div style='font-family: Poppins, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8f9f6; border-radius: 12px;'>
                    <h2 style='color: #2d5016; margin-top: 0;'>Payment Support Request</h2>
                    <p><strong>Ticket:</strong> {$safeTicket}</p>
                    <p><strong>Full name:</strong> {$safeName}</p>
                    <p><strong>Email:</strong> {$safeEmail}</p>
                    <p><strong>Phone:</strong> {$safePhone}</p>
                    <p><strong>Service:</strong> {$safeService}</p>
                    <p><strong>Message:</strong></p>
                    <div style='background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; padding: 12px;'>{$safeMessage}</div>
                </div>
            ";

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('Payment support mail error: ' . ($mail?->ErrorInfo ?: $e->getMessage()));
            return false;
        }
    }

    public static function sendSupportTicketReplyToUser(
        string $email,
        string $ticketNumber,
        string $fullName,
        string $status,
        string $adminReply
    ): bool {
        $mail = null;
        try {
            $mail = self::createMailer();
            $mail->addAddress($email);
            $mail->Subject = 'Support reply - ' . $ticketNumber;
            $safeTicket = htmlspecialchars($ticketNumber, ENT_QUOTES, 'UTF-8');
            $safeName = htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8');
            $safeStatus = htmlspecialchars(ucfirst(str_replace('_', ' ', $status)), ENT_QUOTES, 'UTF-8');
            $safeReply = nl2br(htmlspecialchars($adminReply, ENT_QUOTES, 'UTF-8'));

            $mail->Body = "
                <div style='font-family: Poppins, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8f9f6; border-radius: 12px;'>
                    <h2 style='color: #2d5016; margin-top: 0;'>Support Ticket Update</h2>
                    <p>Hi {$safeName},</p>
                    <p>We have a new reply on your support ticket <strong>{$safeTicket}</strong>.</p>
                    <p><strong>Status:</strong> {$safeStatus}</p>
                    <p><strong>Our reply:</strong></p>
                    <div style='background: #fff; border: 1px solid #d9e8c9; border-radius: 8px; padding: 12px; margin-bottom: 16px;'>{$safeReply}</div>
                    <p style='color: #666; margin-bottom: 0;'>You can reply from your account dashboard until you or our team closes this ticket.</p>
                </div>
            ";

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('Support ticket reply mail error: ' . ($mail?->ErrorInfo ?: $e->getMessage()));
            return false;
        }
    }

    public static function sendUserSupportReplyToAdmin(
        string $to,
        string $ticketNumber,
        string $fullName,
        string $email,
        string $serviceType,
        string $message
    ): bool {
        $mail = null;
        try {
            $mail = self::createMailer();
            $mail->addAddress($to);
            $mail->Subject = 'Customer reply - ' . $ticketNumber;
            $safeTicket = htmlspecialchars($ticketNumber, ENT_QUOTES, 'UTF-8');
            $safeName = htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8');
            $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
            $safeService = htmlspecialchars($serviceType, ENT_QUOTES, 'UTF-8');
            $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));

            $mail->Body = "
                <div style='font-family: Poppins, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8f9f6; border-radius: 12px;'>
                    <h2 style='color: #2d5016; margin-top: 0;'>Customer Ticket Reply</h2>
                    <p><strong>Ticket:</strong> {$safeTicket}</p>
                    <p><strong>Customer:</strong> {$safeName}</p>
                    <p><strong>Email:</strong> {$safeEmail}</p>
                    <p><strong>Service:</strong> {$safeService}</p>
                    <p><strong>Reply:</strong></p>
                    <div style='background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; padding: 12px;'>{$safeMessage}</div>
                </div>
            ";

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('Customer support reply mail error: ' . ($mail?->ErrorInfo ?: $e->getMessage()));
            return false;
        }
    }
}
