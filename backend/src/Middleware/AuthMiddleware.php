<?php

namespace App\Middleware;

use App\Utils\JWT;
use App\Utils\Response;

class AuthMiddleware
{
    public static function authenticate(bool $adminOnly = false): object
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
            Response::error('Unauthorized - Token required', 401);
        }

        $decoded = JWT::decode($matches[1]);
        if (!$decoded) {
            Response::error('Unauthorized - Invalid token', 401);
        }

        if ($adminOnly && ($decoded->role ?? 'user') !== 'admin') {
            Response::error('Forbidden - Admin access required', 403);
        }

        return $decoded;
    }
}
