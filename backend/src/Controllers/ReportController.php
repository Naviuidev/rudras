<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Order;
use App\Models\Subscription;
use App\Models\User;
use App\Utils\Response;

class ReportController
{
    public function sales(): void
    {
        AuthMiddleware::authenticate(true);
        $days = (int) ($_GET['days'] ?? 30);
        Response::success([
            'daily' => Order::getDailyStats($days),
            'monthly_revenue' => Order::getMonthlyRevenue(),
        ]);
    }

    public function subscriptions(): void
    {
        AuthMiddleware::authenticate(true);
        Response::success([
            'active' => Subscription::countByStatus('active'),
            'paused' => Subscription::countByStatus('paused'),
            'expired' => Subscription::countByStatus('expired'),
            'cancelled' => Subscription::countByStatus('cancelled'),
            'growth' => Subscription::getGrowthStats(12),
        ]);
    }

    public function customers(): void
    {
        AuthMiddleware::authenticate(true);
        Response::success([
            'total' => User::countCustomers(),
            'recent' => User::getRecent(20),
        ]);
    }
}
