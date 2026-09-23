<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Env;

Env::load();

// CORS
header('Access-Control-Allow-Origin: ' . ($_ENV['CORS_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

use App\Controllers\AuthController;
use App\Controllers\BannerController;
use App\Controllers\CategoryController;
use App\Controllers\CmsController;
use App\Controllers\DashboardController;
use App\Controllers\NotificationController;
use App\Controllers\OrderController;
use App\Controllers\ProductController;
use App\Controllers\SubscriptionController;
use App\Controllers\CustomerController;
use App\Controllers\FaqController;
use App\Controllers\InventoryController;
use App\Controllers\PaymentController;
use App\Controllers\ReportController;
use App\Controllers\ServiceLocationController;
use App\Controllers\AddressController;
use App\Controllers\SkipController;
use App\Controllers\SupportController;
use App\Controllers\UploadController;
use App\Controllers\UserController;
use App\Utils\Response;

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');
$uri = preg_replace('#^/api#', '', $uri);

$routes = [
    'POST /auth/send-otp' => [AuthController::class, 'sendOtp'],
    'POST /auth/verify-otp' => [AuthController::class, 'verifyOtp'],
    'POST /auth/login' => [AuthController::class, 'login'],
    'POST /auth/set-password' => [AuthController::class, 'setPassword'],
    'POST /auth/admin-login' => [AuthController::class, 'adminLogin'],

    'GET /users' => [UserController::class, 'listAll'],
    'GET /customers' => [CustomerController::class, 'index'],
    'GET /customers/{id}' => [CustomerController::class, 'show'],
    'PUT /customers/{id}' => [CustomerController::class, 'update'],
    'DELETE /customers/{id}' => [CustomerController::class, 'destroy'],
    'GET /profile' => [UserController::class, 'profile'],
    'PUT /profile' => [UserController::class, 'updateProfile'],

    'GET /products' => [ProductController::class, 'index'],
    'GET /products/{id}' => [ProductController::class, 'show'],
    'POST /products' => [ProductController::class, 'store'],
    'PUT /products/{id}' => [ProductController::class, 'update'],
    'DELETE /products/{id}' => [ProductController::class, 'destroy'],

    'GET /banners' => [BannerController::class, 'index'],
    'GET /banners/{id}' => [BannerController::class, 'show'],
    'POST /banners' => [BannerController::class, 'store'],
    'PUT /banners/{id}' => [BannerController::class, 'update'],
    'DELETE /banners/{id}' => [BannerController::class, 'destroy'],

    'GET /orders' => [OrderController::class, 'index'],
    'GET /orders/{id}' => [OrderController::class, 'show'],
    'POST /orders' => [OrderController::class, 'store'],
    'PUT /orders/{id}/status' => [OrderController::class, 'updateStatus'],

    'GET /subscriptions' => [SubscriptionController::class, 'index'],
    'GET /subscriptions/active' => [SubscriptionController::class, 'active'],
    'POST /subscriptions' => [SubscriptionController::class, 'store'],
    'POST /subscriptions/{id}/pause-dates' => [SubscriptionController::class, 'pauseDates'],
    'PUT /subscriptions/{id}/pause' => [SubscriptionController::class, 'pause'],
    'PUT /subscriptions/{id}/resume' => [SubscriptionController::class, 'resume'],
    'PUT /subscriptions/{id}/cancel' => [SubscriptionController::class, 'cancel'],
    'GET /subscriptions/delivery-logs' => [SubscriptionController::class, 'deliveryLogs'],

    'GET /skip-requests' => [SkipController::class, 'index'],
    'POST /skip-requests' => [SkipController::class, 'store'],
    'PUT /skip-requests/{id}/approve' => [SkipController::class, 'approve'],
    'PUT /skip-requests/{id}/reject' => [SkipController::class, 'reject'],
    'GET /carry-forward' => [SkipController::class, 'carryForwardHistory'],

    'GET /inventory/stock' => [InventoryController::class, 'stock'],
    'GET /inventory/daily-requirement' => [InventoryController::class, 'dailyRequirement'],
    'POST /inventory/adjust' => [InventoryController::class, 'adjustStock'],

    'GET /payments' => [PaymentController::class, 'index'],
    'GET /payments/ledger' => [PaymentController::class, 'myLedger'],
    'GET /payments/ledger/{userId}' => [PaymentController::class, 'ledger'],
    'POST /payments/initiate' => [PaymentController::class, 'initiate'],
    'POST /payments/verify' => [PaymentController::class, 'verify'],

    'GET /addresses' => [AddressController::class, 'index'],
    'POST /addresses' => [AddressController::class, 'store'],
    'PUT /addresses/{id}' => [AddressController::class, 'update'],
    'DELETE /addresses/{id}' => [AddressController::class, 'destroy'],

    'GET /support/info' => [SupportController::class, 'info'],
    'POST /support/contact' => [SupportController::class, 'contact'],
    'POST /support/payment' => [SupportController::class, 'paymentSupport'],
    'GET /support/tickets' => [SupportController::class, 'myTickets'],
    'POST /support/tickets/{id}/reply' => [SupportController::class, 'userTicketReply'],
    'PUT /support/tickets/{id}/close' => [SupportController::class, 'userCloseTicket'],
    'GET /support/payment-tickets' => [SupportController::class, 'adminPaymentTickets'],
    'POST /support/payment-tickets/{id}/reply' => [SupportController::class, 'adminTicketReply'],
    'PUT /support/payment-tickets/{id}/status' => [SupportController::class, 'updatePaymentTicketStatus'],
    'PUT /support/payment-tickets/{id}/close' => [SupportController::class, 'adminCloseTicket'],
    'POST /support/admin-help' => [SupportController::class, 'adminHelp'],

    'GET /faqs/public' => [FaqController::class, 'publicList'],

    'GET /reports/sales' => [ReportController::class, 'sales'],
    'GET /reports/subscriptions' => [ReportController::class, 'subscriptions'],
    'GET /reports/customers' => [ReportController::class, 'customers'],

    'GET /faqs' => [FaqController::class, 'index'],
    'POST /faqs' => [FaqController::class, 'store'],
    'PUT /faqs/{id}' => [FaqController::class, 'update'],
    'DELETE /faqs/{id}' => [FaqController::class, 'destroy'],

    'GET /categories' => [CategoryController::class, 'index'],
    'POST /categories' => [CategoryController::class, 'store'],
    'PUT /categories/{id}' => [CategoryController::class, 'update'],
    'DELETE /categories/{id}' => [CategoryController::class, 'destroy'],

    'GET /service-locations' => [ServiceLocationController::class, 'index'],
    'POST /service-locations/preview' => [ServiceLocationController::class, 'preview'],
    'POST /service-locations/check' => [ServiceLocationController::class, 'check'],
    'POST /service-locations' => [ServiceLocationController::class, 'store'],
    'DELETE /service-locations/{id}' => [ServiceLocationController::class, 'destroy'],

    'GET /cms' => [CmsController::class, 'index'],
    'GET /cms/{slug}' => [CmsController::class, 'show'],
    'PUT /cms/{slug}' => [CmsController::class, 'update'],

    'GET /dashboard/stats' => [DashboardController::class, 'stats'],

    'GET /notifications' => [NotificationController::class, 'index'],
    'PUT /notifications/{id}/read' => [NotificationController::class, 'markRead'],
    'POST /notifications/send' => [NotificationController::class, 'send'],

    'POST /upload' => [UploadController::class, 'upload'],
];

$matched = false;

foreach ($routes as $route => $handler) {
    [$routeMethod, $routePath] = explode(' ', $route, 2);
    $pattern = preg_replace('/\{(\w+)\}/', '([^/]+)', $routePath);
    $pattern = '#^' . $pattern . '$#';

    if ($method === $routeMethod && preg_match($pattern, $uri, $matches)) {
        array_shift($matches);
        $matched = true;

        [$class, $action] = $handler;
        $controller = new $class();

        if (count($matches) > 0) {
            $params = array_map(fn($m) => is_numeric($m) ? (int) $m : $m, $matches);
            $controller->$action(...$params);
        } else {
            $controller->$action();
        }
        break;
    }
}

if (!$matched) {
    Response::error('Route not found', 404);
}
