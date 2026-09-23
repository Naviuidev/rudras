<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use App\Services\RazorpayService;
use App\Utils\Response;

class PaymentController
{
    public function index(): void
    {
        $auth = AuthMiddleware::authenticate();
        if (($auth->role ?? '') === 'admin') {
            $status = $_GET['status'] ?? null;
            Response::success(Payment::getAll($status));
        }
        Response::success(Payment::getByUser($auth->user_id));
    }

    public function ledger(int $userId): void
    {
        AuthMiddleware::authenticate(true);
        Response::success(Payment::getCustomerLedger($userId));
    }

    public function myLedger(): void
    {
        $auth = AuthMiddleware::authenticate();
        Response::success(Payment::getCustomerLedger($auth->user_id));
    }

    public function initiate(): void
    {
        $auth = AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true);
        $amount = (float) ($input['amount'] ?? 0);
        $referenceType = $input['reference_type'] ?? 'order';
        $referenceId = (int) ($input['reference_id'] ?? 0);

        if ($amount <= 0) {
            Response::error('Valid amount is required');
        }

        $txnId = 'RFF' . time() . random_int(1000, 9999);
        Payment::create([
            'transaction_id' => $txnId,
            'user_id' => $auth->user_id,
            'amount' => $amount,
            'payment_method' => 'razorpay',
            'payment_status' => 'pending',
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
        ]);

        $user = User::findById($auth->user_id);
        $razorpay = new RazorpayService();
        $result = $razorpay->createOrder($txnId, $amount, [
            'user_id' => (string) $auth->user_id,
            'reference_type' => $referenceType,
            'reference_id' => (string) $referenceId,
        ]);

        if (empty($result['order_id'])) {
            Response::error($result['message'] ?? 'Payment initiation failed');
        }

        Response::success([
            'transaction_id' => $txnId,
            'key_id' => $result['key_id'] ?? $razorpay->getKeyId(),
            'razorpay_order_id' => $result['order_id'],
            'amount' => $result['amount'],
            'currency' => $result['currency'] ?? 'INR',
            'mock' => $result['mock'] ?? false,
            'prefill' => [
                'name' => $user['name'] ?? '',
                'email' => $user['email'] ?? '',
                'contact' => $user['mobile'] ?? '',
            ],
        ]);
    }

    public function verify(): void
    {
        $auth = AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true);
        $txnId = $input['transaction_id'] ?? '';

        $payment = Payment::findByTransactionId($txnId);
        if (!$payment || (int) $payment['user_id'] !== (int) $auth->user_id) {
            Response::error('Payment not found', 404);
        }

        $razorpay = new RazorpayService();
        $razorpayOrderId = $input['razorpay_order_id'] ?? '';
        $razorpayPaymentId = $input['razorpay_payment_id'] ?? '';
        $razorpaySignature = $input['razorpay_signature'] ?? '';

        if ($razorpay->isConfigured()) {
            if (!$razorpayOrderId || !$razorpayPaymentId || !$razorpaySignature) {
                Response::error('Razorpay payment details are required');
            }

            if (!$razorpay->verifySignature($razorpayOrderId, $razorpayPaymentId, $razorpaySignature)) {
                Payment::updateStatus($txnId, 'failed');
                Response::error('Payment verification failed', 400);
            }

            $paymentInfo = $razorpay->fetchPayment($razorpayPaymentId);
            $paid = in_array($paymentInfo['status'] ?? '', ['captured', 'authorized'], true);
        } else {
            $paid = true;
        }

        Payment::updateStatus($txnId, $paid ? 'paid' : 'failed');

        if ($paid && $payment['reference_type'] === 'order' && $payment['reference_id']) {
            Order::updateStatus((int) $payment['reference_id'], 'confirmed');
            $db = \App\Config\Database::getConnection();
            $db->prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?")->execute([(int) $payment['reference_id']]);
        }

        if ($paid && $payment['reference_type'] === 'subscription' && $payment['reference_id']) {
            // subscription already created; mark as paid via subscription record if needed
        }

        Response::success([
            'paid' => $paid,
            'status' => $paid ? 'paid' : 'failed',
            'payment' => Payment::findByTransactionId($txnId),
        ]);
    }
}
