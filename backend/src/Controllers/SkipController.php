<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\AuditLog;
use App\Models\CarryForwardLog;
use App\Models\SkipRequest;
use App\Models\Subscription;
use App\Utils\Response;

class SkipController
{
    public function index(): void
    {
        $auth = AuthMiddleware::authenticate();
        if (($auth->role ?? '') === 'admin') {
            $status = $_GET['status'] ?? null;
            Response::success(SkipRequest::getAll($status));
        }
        Response::success(SkipRequest::getByUser($auth->user_id));
    }

    public function store(): void
    {
        $auth = AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true);
        $subscriptionId = (int) ($input['subscription_id'] ?? 0);
        $skipDate = $input['skip_date'] ?? '';
        $reason = $input['reason'] ?? '';

        $sub = Subscription::findById($subscriptionId);
        if (!$sub || (int) $sub['user_id'] !== (int) $auth->user_id) {
            Response::error('Subscription not found', 404);
        }

        $id = SkipRequest::create([
            'user_id' => $auth->user_id,
            'subscription_id' => $subscriptionId,
            'product_id' => $sub['product_id'] ?? null,
            'skip_date' => $skipDate,
            'reason' => $reason,
        ]);

        Response::success(SkipRequest::findById($id), 'Skip request submitted', 201);
    }

    public function approve(int $id): void
    {
        AuthMiddleware::authenticate(true);
        if (!SkipRequest::approve($id)) {
            Response::error('Unable to approve skip request');
        }
        AuditLog::log(null, 'approve_skip', 'skip_request', $id);
        Response::success(null, 'Skip request approved');
    }

    public function reject(int $id): void
    {
        AuthMiddleware::authenticate(true);
        if (!SkipRequest::reject($id)) {
            Response::error('Unable to reject skip request');
        }
        AuditLog::log(null, 'reject_skip', 'skip_request', $id);
        Response::success(null, 'Skip request rejected');
    }

    public function carryForwardHistory(): void
    {
        $auth = AuthMiddleware::authenticate();
        if (($auth->role ?? '') === 'admin') {
            Response::success(CarryForwardLog::getAll());
        }
        Response::success(CarryForwardLog::getByUser($auth->user_id));
    }
}
