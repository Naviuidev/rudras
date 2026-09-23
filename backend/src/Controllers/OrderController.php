<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Notification as NotificationModel;
use App\Models\Order;
use App\Models\User;
use App\Services\PushNotificationService;
use App\Utils\Response;

class OrderController
{
    public function index(): void
    {
        $auth = AuthMiddleware::authenticate();

        if (($auth->role ?? '') === 'admin') {
            $status = $_GET['status'] ?? null;
            Response::success(Order::getAll($status));
        }

        Response::success(Order::getByUser($auth->user_id));
    }

    public function show(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $order = Order::findById($id);

        if (!$order) {
            Response::error('Order not found', 404);
        }

        if (($auth->role ?? '') !== 'admin' && $order['user_id'] != $auth->user_id) {
            Response::error('Forbidden', 403);
        }

        if (($auth->role ?? '') === 'admin') {
            Response::success(Order::findDetailedById($id));
        }

        Response::success($order);
    }

    public function store(): void
    {
        $auth = AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true);
        $items = $input['items'] ?? [];

        if (empty($items)) {
            Response::error('Order items are required');
        }

        $totalAmount = 0;
        $orderItems = [];

        foreach ($items as $item) {
            $product = \App\Models\Product::findById($item['product_id']);
            if (!$product || $product['active_status'] != 1) {
                Response::error("Product {$item['product_id']} not available");
            }
            if ($product['stock'] < ($item['quantity'] ?? 1)) {
                Response::error("Insufficient stock for {$product['name']}");
            }

            $qty = $item['quantity'] ?? 1;
            $orderItems[] = [
                'product_id' => $product['id'],
                'quantity' => $qty,
                'price' => $product['price'],
            ];
            $totalAmount += $product['price'] * $qty;
        }

        $orderId = Order::create(
            $auth->user_id,
            $totalAmount,
            $orderItems,
            $input['delivery_address'] ?? null,
            isset($input['delivery_lat']) ? (float) $input['delivery_lat'] : null,
            isset($input['delivery_lng']) ? (float) $input['delivery_lng'] : null
        );
        $order = Order::findById($orderId);

        $user = User::findById($auth->user_id);
        if ($user && !empty($user['push_token'])) {
            PushNotificationService::send(
                $user['push_token'],
                'Order Placed',
                "Your order {$order['order_number']} has been placed successfully.",
                ['type' => 'order', 'order_id' => $orderId]
            );
        }

        NotificationModel::create($auth->user_id, 'Order Placed', "Order {$order['order_number']} placed.", 'order', $orderId);

        Response::success($order, 'Order placed successfully', 201);
    }

    public function updateStatus(int $id): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);
        $status = $input['order_status'] ?? '';

        $validStatuses = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!in_array($status, $validStatuses)) {
            Response::error('Invalid order status');
        }

        $order = Order::findById($id);
        if (!$order) {
            Response::error('Order not found', 404);
        }

        Order::updateStatus($id, $status);

        $user = User::findById($order['user_id']);
        if ($user && !empty($user['push_token'])) {
            $statusLabel = ucwords(str_replace('_', ' ', $status));
            PushNotificationService::send(
                $user['push_token'],
                'Order Update',
                "Your order {$order['order_number']} is now {$statusLabel}.",
                ['type' => 'order', 'order_id' => $id]
            );
        }

        NotificationModel::create(
            $order['user_id'],
            'Order Update',
            "Order {$order['order_number']} status: {$status}",
            'order',
            $id
        );

        Response::success(Order::findById($id), 'Order status updated');
    }
}
