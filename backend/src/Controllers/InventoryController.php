<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Inventory;
use App\Models\AuditLog;
use App\Utils\Response;

class InventoryController
{
    public function stock(): void
    {
        AuthMiddleware::authenticate(true);
        Response::success([
            'products' => Inventory::getStockOverview(),
            'movements' => Inventory::getMovements(50),
        ]);
    }

    public function dailyRequirement(): void
    {
        AuthMiddleware::authenticate(true);
        $date = $_GET['date'] ?? date('Y-m-d', strtotime('+1 day'));
        Response::success([
            'date' => $date,
            'requirements' => Inventory::getDailyRequirement($date),
        ]);
    }

    public function adjustStock(): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);
        $productId = (int) ($input['product_id'] ?? 0);
        $type = $input['change_type'] ?? 'added';
        $quantity = (int) ($input['quantity'] ?? 0);
        if (!$productId || !$quantity) {
            Response::error('Product and quantity required');
        }
        if (!Inventory::addMovement($productId, $type, $quantity, $input['notes'] ?? null)) {
            Response::error('Stock adjustment failed');
        }
        AuditLog::log(null, 'stock_adjust', 'product', $productId, json_encode($input));
        Response::success(null, 'Stock updated');
    }
}
