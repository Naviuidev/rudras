<?php

namespace App\Models;

use App\Config\Database;

class OtpVerification
{
    public static function create(string $email, string $otp): void
    {
        $email = strtolower(trim($email));
        $db = Database::getConnection();
        $db->prepare('UPDATE otp_verifications SET is_used = 1 WHERE email = ? AND is_used = 0')->execute([$email]);

        $stmt = $db->prepare(
            'INSERT INTO otp_verifications (email, otp_code, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))'
        );
        $stmt->execute([$email, $otp]);
    }

    public static function verify(string $email, string $otp): bool
    {
        $email = strtolower(trim($email));
        $otp = preg_replace('/\D/', '', $otp);
        if (strlen($otp) !== 6) {
            return false;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT id FROM otp_verifications WHERE email = ? AND otp_code = ? AND is_used = 0 AND expires_at > NOW() LIMIT 1'
        );
        $stmt->execute([$email, $otp]);
        $record = $stmt->fetch();

        if (!$record) {
            return false;
        }

        $db->prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?')->execute([$record['id']]);
        return true;
    }
}
