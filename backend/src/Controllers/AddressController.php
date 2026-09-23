<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\UserAddress;
use App\Utils\Response;

class AddressController
{
    public function index(): void
    {
        $auth = AuthMiddleware::authenticate();
        Response::success(UserAddress::getByUser($auth->user_id));
    }

    public function store(): void
    {
        $auth = AuthMiddleware::authenticate();
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['name', 'mobile', 'address_line', 'city', 'state', 'pincode'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                Response::error("Field {$field} is required");
            }
        }
        $id = UserAddress::create($auth->user_id, $input);
        Response::success(UserAddress::findById($id), 'Address added', 201);
    }

    public function update(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $address = UserAddress::findById($id);
        if (!$address || (int) $address['user_id'] !== (int) $auth->user_id) {
            Response::error('Address not found', 404);
        }
        $input = json_decode(file_get_contents('php://input'), true);
        UserAddress::update($id, $auth->user_id, $input);
        Response::success(UserAddress::findById($id), 'Address updated');
    }

    public function destroy(int $id): void
    {
        $auth = AuthMiddleware::authenticate();
        UserAddress::delete($id, $auth->user_id);
        Response::success(null, 'Address deleted');
    }
}
