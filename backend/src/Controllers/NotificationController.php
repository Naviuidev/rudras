<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Notification as NotificationModel;
use App\Models\User;
use App\Services\PushNotificationService;
use App\Utils\Response;

class NotificationController
{
    public function index(): void
    {
        $auth = AuthMiddleware::authenticate();
        Response::success(NotificationModel::getByUser($auth->user_id));
    }

    public function markRead(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        NotificationModel::markRead($id, $auth->user_id);
        Response::success(null, 'Notification marked as read');
    }

    public function send(): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);

        $title = $input['title'] ?? '';
        $body = $input['body'] ?? '';
        $type = $input['type'] ?? 'promo';
        $userId = $input['user_id'] ?? null;

        if (empty($title) || empty($body)) {
            Response::error('Title and body are required');
        }

        if ($userId) {
            NotificationModel::create($userId, $title, $body, $type);
            $user = User::findById($userId);
            if ($user && !empty($user['push_token'])) {
                PushNotificationService::send($user['push_token'], $title, $body, ['type' => $type]);
            }
        } else {
            $tokens = User::getPushTokens();
            NotificationModel::create(null, $title, $body, $type);
            PushNotificationService::sendToMany($tokens, $title, $body, ['type' => $type]);
        }

        Response::success(null, 'Notification sent');
    }
}
