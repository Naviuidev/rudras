<?php

namespace App\Utils;

use Firebase\JWT\JWT as FirebaseJWT;
use Firebase\JWT\Key;

class JWT
{
    public static function encode(array $payload): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'default-secret';
        $expiry = (int) ($_ENV['JWT_EXPIRY'] ?? 604800);

        $payload['iat'] = time();
        $payload['exp'] = time() + $expiry;

        return FirebaseJWT::encode($payload, $secret, 'HS256');
    }

    public static function decode(string $token): ?object
    {
        try {
            $secret = $_ENV['JWT_SECRET'] ?? 'default-secret';
            return FirebaseJWT::decode($token, new Key($secret, 'HS256'));
        } catch (\Exception $e) {
            return null;
        }
    }
}
