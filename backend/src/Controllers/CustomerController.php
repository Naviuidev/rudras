<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SkipRequest;
use App\Models\Subscription;
use App\Models\User;
use App\Utils\Response;

class CustomerController
{
    public function index(): void
    {
        AuthMiddleware::authenticate(true);
        $search = $_GET['search'] ?? null;
        $status = $_GET['status'] ?? null;
        $subscriptionStatus = $_GET['subscription_status'] ?? null;
        Response::success(User::getAll(200, 0, $search, $status, $subscriptionStatus));
    }

    public function show(int $id): void
    {
        AuthMiddleware::authenticate(true);
        $user = User::findById($id);
        if (!$user) {
            Response::error('Customer not found', 404);
        }

        $activeSub = Subscription::getActive($id);
        $subscriptions = Subscription::getByUser($id);
        $orders = Order::getByUser($id);
        $payments = Payment::getByUser($id);
        $ledger = Payment::getCustomerLedger($id);
        $skipRequests = SkipRequest::getAll(null);

        Response::success([
            'user' => $user,
            'active_subscription' => $activeSub,
            'subscriptions' => $subscriptions,
            'orders' => $orders,
            'payments' => $payments,
            'ledger' => $ledger,
            'skip_requests' => array_values(array_filter($skipRequests, fn($s) => (int) $s['user_id'] === $id)),
            'delivery_summary' => $activeSub ? Subscription::getDeliverySummary((int) $activeSub['id']) : null,
        ]);
    }

    public function update(int $id): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);
        if (!User::findById($id)) {
            Response::error('Customer not found', 404);
        }
        User::update($id, $input);
        AuditLog::log(null, 'update_customer', 'user', $id, json_encode($input));
        Response::success(User::findById($id), 'Customer updated');
    }

    public function destroy(int $id): void
    {
        AuthMiddleware::authenticate(true);
        User::softDelete($id);
        AuditLog::log(null, 'delete_customer', 'user', $id);
        Response::success(null, 'Customer deleted');
    }
}
