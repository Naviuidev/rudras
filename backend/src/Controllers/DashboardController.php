<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\AuditLog;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\SkipRequest;
use App\Models\Subscription;
use App\Models\User;
use App\Utils\Response;

class DashboardController
{
    public function stats(): void
    {
        AuthMiddleware::authenticate(true);

        $defaults = [
            'total_customers' => 0,
            'total_users' => 0,
            'active_subscriptions' => 0,
            'paused_subscriptions' => 0,
            'expired_subscriptions' => 0,
            'cancelled_subscriptions' => 0,
            'total_products' => 0,
            'total_orders' => 0,
            'todays_deliveries' => 0,
            'tomorrows_deliveries' => 0,
            'pending_payments' => 0,
            'monthly_revenue' => 0,
            'total_revenue' => 0,
            'low_stock_products' => 0,
            'daily_revenue' => [],
            'monthly_revenue_chart' => [],
            'subscription_growth' => [],
            'product_sales' => [],
            'daily_orders' => [],
            'recent_customers' => [],
            'recent_orders' => [],
            'recent_payments' => [],
            'recent_skip_requests' => [],
            'total_categories' => 0,
            'categories' => [],
        ];

        try {
            $orderRevenue = Order::getMonthlyRevenue();
            $paymentRevenue = Payment::getMonthlyRevenue();

            Response::success([
                'total_customers' => User::countCustomers(),
                'total_users' => User::countCustomers(),
                'active_subscriptions' => Subscription::countByStatus('active'),
                'paused_subscriptions' => Subscription::countByStatus('paused'),
                'expired_subscriptions' => Subscription::countByStatus('expired'),
                'cancelled_subscriptions' => Subscription::countByStatus('cancelled'),
                'total_products' => Product::count(),
                'total_orders' => Order::count(),
                'todays_deliveries' => Inventory::countDeliveriesForDate(date('Y-m-d')),
                'tomorrows_deliveries' => Inventory::countDeliveriesForDate(date('Y-m-d', strtotime('+1 day'))),
                'pending_payments' => Payment::countPending(),
                'monthly_revenue' => $orderRevenue + $paymentRevenue,
                'total_revenue' => Order::getMonthlyRevenue() + Payment::getTotalRevenue(),
                'low_stock_products' => Inventory::getLowStockCount(),
                'daily_revenue' => Payment::getDailyRevenue(30),
                'monthly_revenue_chart' => Order::getDailyStats(30),
                'subscription_growth' => Subscription::getGrowthStats(6),
                'product_sales' => Product::getSalesStats(30),
                'daily_orders' => Order::getDailyStats(30),
                'recent_customers' => User::getRecent(5),
                'recent_orders' => array_slice(Order::getAll(null, 5, 0), 0, 5),
                'recent_payments' => array_slice(Payment::getAll(null, 5), 0, 5),
                'recent_skip_requests' => array_slice(SkipRequest::getAll('pending'), 0, 5),
                'total_categories' => \App\Models\Category::count(),
                'categories' => \App\Models\Category::getAll(),
            ]);
        } catch (\Exception $e) {
            Response::success($defaults);
        }
    }
}
