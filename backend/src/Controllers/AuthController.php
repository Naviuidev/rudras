<?php

namespace App\Controllers;

use App\Models\OtpVerification;
use App\Models\User;
use App\Services\MailService;
use App\Utils\JWT;
use App\Utils\Response;

class AuthController
{
    public function sendOtp(): void
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = strtolower(trim((string) filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL)));

        if (!$email) {
            Response::error('Valid email is required');
        }

        if (!preg_match('/@gmail\.com$/i', $email)) {
            Response::error('Only Gmail addresses are allowed for login');
        }

        $existing = User::findByEmail($email);
        if ($existing && User::hasPassword($existing)) {
            Response::error('An account already exists with this email. Please login with your password.');
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OtpVerification::create($email, $otp);

        $sent = MailService::sendOTP($email, $otp);

        if (!$sent) {
            Response::error('Failed to send OTP email. Please check your inbox settings and try again.', 500);
        }

        Response::success(['message' => 'OTP sent successfully'], 'OTP sent to your email');
    }

    public function verifyOtp(): void
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = strtolower(trim((string) filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL)));
        $otp = preg_replace('/\D/', '', (string) ($input['otp'] ?? ''));

        if (!$email || strlen($otp) !== 6) {
            Response::error('Valid email and 6-digit OTP are required');
        }

        if (!preg_match('/@gmail\.com$/i', $email)) {
            Response::error('Only Gmail addresses are allowed for login');
        }

        if (!OtpVerification::verify($email, $otp)) {
            Response::error('Invalid or expired OTP', 401);
        }

        $user = User::findByEmail($email);
        $isNew = false;

        if ($user && User::hasPassword($user)) {
            Response::error('An account already exists with this email. Please login with your password.', 401);
        }

        if (!$user) {
            $userId = User::create($email);
            $user = User::findById($userId);
            $isNew = true;
        }

        $token = JWT::encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'] ?? 'user',
        ]);

        Response::success([
            'token' => $token,
            'user' => self::publicUser($user),
            'is_new_user' => $isNew,
            'needs_password' => !User::hasPassword($user),
        ], 'OTP verified successfully');
    }

    public function login(): void
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = strtolower(trim((string) filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL)));
        $password = (string) ($input['password'] ?? '');

        if (!$email || $password === '') {
            Response::error('Email and password are required');
        }

        if (!preg_match('/@gmail\.com$/i', $email)) {
            Response::error('Only Gmail addresses are allowed for login');
        }

        $user = User::findByEmail($email);
        if (!$user || !User::hasPassword($user)) {
            Response::error('No account found', 401, ['code' => 'ACCOUNT_NOT_FOUND']);
        }

        if (!password_verify($password, $user['password_hash'])) {
            Response::error('Invalid email or password', 401, ['code' => 'INVALID_CREDENTIALS']);
        }

        if (isset($user['is_active']) && !(int) $user['is_active']) {
            Response::error('Your account has been deactivated. Please contact support.', 403);
        }

        $token = JWT::encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'] ?? 'user',
        ]);

        Response::success([
            'token' => $token,
            'user' => self::publicUser($user),
        ], 'Login successful');
    }

    public function setPassword(): void
    {
        $auth = \App\Middleware\AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true);
        $password = (string) ($input['password'] ?? '');

        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters');
        }

        $email = (string) ($auth->email ?? '');
        $userId = (int) ($auth->user_id ?? 0);

        $user = $email !== '' ? User::findByEmail($email) : null;
        if (!$user && $userId > 0) {
            $user = User::findById($userId);
        }

        if (!$user) {
            Response::error('User not found', 404);
        }

        if (User::hasPassword($user)) {
            Response::error('Password is already set. Use login to sign in.');
        }

        if (!User::setPassword((int) $user['id'], $password)) {
            Response::error('Failed to save password. Please try again.', 500);
        }

        $user = User::findByEmail($user['email']);

        Response::success(['user' => self::publicUser($user)], 'Password set successfully');
    }

    private static function publicUser(array $user): array
    {
        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'mobile' => $user['mobile'] ?? null,
            'role' => $user['role'] ?? 'user',
        ];
    }

    public function adminLogin(): void
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $username = trim($input['username'] ?? $input['user_id'] ?? '');
        $password = $input['password'] ?? '';

        if ($username === '' || $password === '') {
            Response::error('User ID and password are required');
        }

        $adminUsername = $_ENV['ADMIN_USERNAME'] ?? 'Rudra';
        $adminPassword = $_ENV['ADMIN_PASSWORD'] ?? 'Admin@123';

        if ($username !== $adminUsername || $password !== $adminPassword) {
            Response::error('Invalid user ID or password', 401);
        }

        $userData = [
            'id' => 1,
            'name' => 'Rudra',
            'username' => $adminUsername,
            'email' => 'admin@rudrasfarmfresh.com',
            'role' => 'admin',
        ];

        try {
            $user = User::findByEmail('admin@rudrasfarmfresh.com');
            if ($user) {
                $userData['id'] = (int) $user['id'];
                $userData['name'] = $user['name'];
            } else {
                $userId = User::create('admin@rudrasfarmfresh.com', 'Rudra');
                $db = \App\Config\Database::getConnection();
                $db->prepare("UPDATE users SET role = 'admin', name = 'Rudra' WHERE id = ?")->execute([$userId]);
                $userData['id'] = $userId;
            }
        } catch (\Exception $e) {
            // Allow admin panel development without database
        }

        $token = JWT::encode([
            'user_id' => $userData['id'],
            'email' => $userData['email'],
            'username' => $adminUsername,
            'role' => 'admin',
        ]);

        Response::success([
            'token' => $token,
            'user' => $userData,
        ], 'Login successful');
    }
}
