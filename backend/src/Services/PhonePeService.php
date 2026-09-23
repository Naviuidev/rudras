<?php

namespace App\Services;

class PhonePeService
{
    private string $merchantId;
    private string $clientId;
    private string $clientSecret;
    private string $baseUrl;
    private string $webRedirectUrl;

    public function __construct()
    {
        $this->merchantId = $_ENV['PHONEPE_MERCHANT_ID'] ?? '';
        $this->clientId = $_ENV['PHONEPE_CLIENT_ID'] ?? '';
        $this->clientSecret = $_ENV['PHONEPE_CLIENT_SECRET'] ?? '';
        $isProd = ($_ENV['PHONEPE_ENV'] ?? 'sandbox') === 'production';
        $this->baseUrl = $isProd ? 'https://api.phonepe.com' : 'https://api-preprod.phonepe.com';
        $this->webRedirectUrl = $_ENV['WEB_URL'] ?? 'http://localhost:3001';
    }

    public function isConfigured(): bool
    {
        return $this->merchantId && $this->clientId && $this->clientSecret;
    }

    private function getAccessToken(): ?string
    {
        $url = $this->baseUrl . '/apis/identity-manager/v1/oauth/token';
        $payload = http_build_query([
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'client_version' => '1',
            'grant_type' => 'client_credentials',
        ]);

        $response = $this->curlRequest('POST', $url, $payload, [
            'Content-Type: application/x-www-form-urlencoded',
        ]);

        return $response['access_token'] ?? null;
    }

    public function createPayment(string $merchantTransactionId, float $amount, string $userId, string $mobile = '9999999999'): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'mock' => true,
                'redirect_url' => $this->webRedirectUrl . '/payment/success?txn=' . urlencode($merchantTransactionId) . '&mock=1',
                'message' => 'PhonePe not configured — using mock redirect',
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Failed to obtain PhonePe access token'];
        }

        $amountPaise = (int) round($amount * 100);
        $body = [
            'merchantOrderId' => $merchantTransactionId,
            'amount' => $amountPaise,
            'expireAfter' => 1200,
            'metaInfo' => ['udf1' => (string) $userId],
            'paymentFlow' => [
                'type' => 'PG_CHECKOUT',
                'merchantUrls' => [
                    'redirectUrl' => $this->webRedirectUrl . '/payment/success?txn=' . urlencode($merchantTransactionId),
                    'callbackUrl' => ($_ENV['APP_URL'] ?? 'http://localhost:8000') . '/api/payments/phonepe/callback',
                ],
            ],
            'deviceContext' => ['deviceOS' => 'WEB'],
        ];

        $url = $this->baseUrl . '/apis/pg/checkout/v2/pay';
        $response = $this->curlRequest('POST', $url, json_encode($body), [
            'Content-Type: application/json',
            'Authorization: O-Bearer ' . $token,
        ]);

        $redirectUrl = $response['data']['instrumentResponse']['redirectInfo']['url']
            ?? $response['redirectUrl']
            ?? null;

        if (!$redirectUrl) {
            return ['success' => false, 'message' => 'PhonePe payment initiation failed', 'raw' => $response];
        }

        return ['success' => true, 'redirect_url' => $redirectUrl, 'merchant_transaction_id' => $merchantTransactionId];
    }

    public function verifyPayment(string $merchantTransactionId): array
    {
        if (!$this->isConfigured()) {
            return ['success' => true, 'status' => 'COMPLETED', 'mock' => true];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return ['success' => false, 'status' => 'FAILED', 'message' => 'Token error'];
        }

        $url = $this->baseUrl . '/apis/pg/checkout/v2/order/' . urlencode($merchantTransactionId) . '/status?details=true';
        $response = $this->curlRequest('GET', $url, null, [
            'Content-Type: application/json',
            'Authorization: O-Bearer ' . $token,
        ]);

        $state = $response['data']['state'] ?? $response['state'] ?? 'PENDING';
        $paid = in_array(strtoupper($state), ['COMPLETED', 'SUCCESS', 'PAID'], true);

        return ['success' => $paid, 'status' => strtoupper($state), 'raw' => $response];
    }

    private function curlRequest(string $method, string $url, ?string $body, array $headers): array
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
        $result = curl_exec($ch);
        curl_close($ch);
        return json_decode($result ?: '{}', true) ?: [];
    }
}
