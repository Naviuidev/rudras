<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Order;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\User;
use App\Utils\Response;

class UserController
{
    public function profile(): void
    {
        $auth = AuthMiddleware::authenticate();
        $user = User::findById($auth->user_id);

        if (!$user) {
            Response::error('User not found', 404);
        }

        $activeSubscription = Subscription::getActive($auth->user_id);
        if ($activeSubscription) {
            $activeSubscription['next_delivery'] = Subscription::getNextDeliveryDate($activeSubscription['id']);
        }

        Response::success([
            'user' => $user,
            'active_subscription' => $activeSubscription,
            'subscription_history' => Subscription::getByUser($auth->user_id),
            'order_history' => Order::getByUser($auth->user_id),
        ]);
    }

    public function updateProfile(): void
    {
        $auth = AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true);

        User::update($auth->user_id, [
            'name' => $input['name'] ?? null,
            'mobile' => $input['mobile'] ?? null,
            'area' => $input['area'] ?? null,
            'address' => $input['address'] ?? null,
        ]);

        Response::success(User::findById($auth->user_id), 'Profile updated');
    }

    public function listAll(): void
    {
        AuthMiddleware::authenticate(true);
        $search = $_GET['search'] ?? null;
        $status = $_GET['status'] ?? null;
        $subscriptionStatus = $_GET['subscription_status'] ?? null;
        Response::success(User::getAll(200, 0, $search, $status, $subscriptionStatus));
    }
}
