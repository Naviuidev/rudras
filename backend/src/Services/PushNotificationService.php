<?php

namespace App\Services;

class PushNotificationService
{
    public static function send(string $pushToken, string $title, string $body, array $data = []): bool
    {
        if (empty($pushToken)) {
            return false;
        }

        $message = [
            'to' => $pushToken,
            'sound' => 'default',
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ];

        $ch = curl_init('https://exp.host/--/api/v2/push/send');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($message),
            CURLOPT_RETURNTRANSFER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 200;
    }

    public static function sendToMany(array $tokens, string $title, string $body, array $data = []): void
    {
        foreach ($tokens as $token) {
            self::send($token, $title, $body, $data);
        }
    }
}
