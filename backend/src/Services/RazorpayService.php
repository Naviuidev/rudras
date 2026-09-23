<?php

namespace App\Services;

class RazorpayService
{
    private string $keyId;
    private string $keySecret;

    public function __construct()
    {
        $this->keyId = $_ENV['RAZORPAY_KEY_ID'] ?? '';
        $this->keySecret = $_ENV['RAZORPAY_KEY_SECRET'] ?? '';
    }

    public function isConfigured(): bool
    {
        return $this->keyId !== '' && $this->keySecret !== '';
    }

    public function getKeyId(): string
    {
        return $this->keyId;
    }

    public function createOrder(string $receipt, float $amount, array $notes = []): array
    {
        $amountPaise = (int) round($amount * 100);

        if (!$this->isConfigured()) {
            return [
                'success' => true,
                'mock' => true,
                'key_id' => 'mock_key',
                'order_id' => 'order_mock_' . $receipt,
                'amount' => $amountPaise,
                'currency' => 'INR',
            ];
        }

        $body = [
            'amount' => $amountPaise,
            'currency' => 'INR',
            'receipt' => $receipt,
            'notes' => $notes,
        ];

        $response = $this->curlRequest('POST', 'https://api.razorpay.com/v1/orders', json_encode($body));

        if (empty($response['id'])) {
            return [
                'success' => false,
                'message' => $response['error']['description'] ?? 'Razorpay order creation failed',
                'raw' => $response,
            ];
        }

        return [
            'success' => true,
            'key_id' => $this->keyId,
            'order_id' => $response['id'],
            'amount' => $amountPaise,
            'currency' => $response['currency'] ?? 'INR',
        ];
    }

    public function verifySignature(string $orderId, string $paymentId, string $signature): bool
    {
        if (!$this->isConfigured()) {
            return true;
        }

        $expected = hash_hmac('sha256', $orderId . '|' . $paymentId, $this->keySecret);
        return hash_equals($expected, $signature);
    }

    public function fetchPayment(string $paymentId): array
    {
        if (!$this->isConfigured()) {
            return ['status' => 'captured', 'mock' => true];
        }

        return $this->curlRequest('GET', 'https://api.razorpay.com/v1/payments/' . urlencode($paymentId));
    }

    private function curlRequest(string $method, string $url, ?string $body = null): array
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, $this->keyId . ':' . $this->keySecret);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $result = curl_exec($ch);
        curl_close($ch);

        return json_decode($result ?: '{}', true) ?: [];
    }
}
