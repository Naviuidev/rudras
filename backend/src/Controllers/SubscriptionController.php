<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Notification as NotificationModel;
use App\Models\Subscription;
use App\Models\User;
use App\Services\PushNotificationService;
use App\Utils\Response;

class SubscriptionController
{
    public function index(): void
    {
        $auth = AuthMiddleware::authenticate();

        if (($auth->role ?? '') === 'admin') {
            $status = $_GET['status'] ?? null;
            Response::success(Subscription::getAll($status));
        }

        Response::success(Subscription::getByUser($auth->user_id));
    }

    public function active(): void
    {
        $auth = AuthMiddleware::authenticate();
        $sub = Subscription::getActive($auth->user_id);

        if ($sub) {
            $sub['next_delivery'] = Subscription::getNextDeliveryDate($sub['id']);
            $sub['pauses'] = Subscription::getPauses($sub['id']);
        }

        Response::success($sub);
    }

    public function store(): void
    {
        $auth = AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true);

        $existing = Subscription::getActive($auth->user_id);
        if ($existing) {
            Response::error('You already have an active subscription');
        }

        $id = Subscription::create($auth->user_id, [
            'quantity' => $input['quantity'] ?? 1,
            'total_days' => $input['total_days'] ?? 30,
            'price_per_day' => $input['price_per_day'] ?? 60,
            'start_date' => $input['start_date'] ?? date('Y-m-d'),
            'end_date' => $input['end_date'] ?? null,
            'frequency' => $input['frequency'] ?? 'daily',
            'product_id' => $input['product_id'] ?? null,
            'delivery_dates' => $input['delivery_dates'] ?? [],
            'total_amount' => $input['total_amount'] ?? null,
        ]);

        $sub = Subscription::findById($id);

        $user = User::findById($auth->user_id);
        if ($user && !empty($user['push_token'])) {
            PushNotificationService::send(
                $user['push_token'],
                'Subscription Started',
                "Your {$sub['total_days']}-day milk subscription is now active!",
                ['type' => 'subscription', 'subscription_id' => $id]
            );
        }

        NotificationModel::create($auth->user_id, 'Subscription Started', 'Your milk subscription is active.', 'subscription', $id);

        Response::success($sub, 'Subscription created', 201);
    }

    public function pauseDates(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true);
        $dates = $input['dates'] ?? [];

        $sub = Subscription::findById($id);
        if (!$sub) {
            Response::error('Subscription not found', 404);
        }

        if (($auth->role ?? '') !== 'admin' && $sub['user_id'] != $auth->user_id) {
            Response::error('Forbidden', 403);
        }

        if (empty($dates)) {
            Response::error('Dates array is required');
        }

        $count = Subscription::pauseDates($id, $dates);
        Response::success([
            'paused_days' => $count,
            'subscription' => Subscription::findById($id),
        ], "{$count} day(s) paused");
    }

    public function pause(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $sub = Subscription::findById($id);

        if (!$sub) {
            Response::error('Subscription not found', 404);
        }

        if (($auth->role ?? '') !== 'admin' && $sub['user_id'] != $auth->user_id) {
            Response::error('Forbidden', 403);
        }

        Subscription::pause($id);
        Response::success(Subscription::findById($id), 'Subscription paused');
    }

    public function resume(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $sub = Subscription::findById($id);

        if (!$sub) {
            Response::error('Subscription not found', 404);
        }

        if (($auth->role ?? '') !== 'admin' && $sub['user_id'] != $auth->user_id) {
            Response::error('Forbidden', 403);
        }

        Subscription::resume($id);
        Response::success(Subscription::findById($id), 'Subscription resumed');
    }

    public function cancel(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $sub = Subscription::findById($id);
        if (!$sub) {
            Response::error('Subscription not found', 404);
        }

        if (($auth->role ?? '') !== 'admin' && $sub['user_id'] != $auth->user_id) {
            Response::error('Forbidden', 403);
        }

        Subscription::cancel($id);
        Response::success(Subscription::findById($id), 'Subscription cancelled');
    }

    public function deliveryLogs(): void
    {
        $auth = AuthMiddleware::authenticate();
        Response::success(Subscription::getDeliveryLogs($auth->user_id));
    }
}
