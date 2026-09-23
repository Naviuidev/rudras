<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Product;
use App\Utils\ImageUrl;
use App\Utils\Response;

class ProductController
{
    private function formatProduct(?array $product): ?array
    {
        if (!$product) {
            return null;
        }
        $product['image'] = ImageUrl::resolve($product['image'] ?? null);
        return $product;
    }

    public function index(): void
    {
        $category = $_GET['category'] ?? null;
        $search = $_GET['search'] ?? null;
        $activeOnly = !isset($_GET['all']);

        $products = Product::getAll($category, $search, $activeOnly);
        Response::success(ImageUrl::resolveInArray($products));
    }

    public function show(int $id): void
    {
        $product = Product::findById($id);
        if (!$product) {
            Response::error('Product not found', 404);
        }
        Response::success($this->formatProduct($product));
    }

    public function store(): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['name']) || !isset($input['price'])) {
            Response::error('Name and price are required');
        }

        try {
            $id = Product::create($input);
            Response::success($this->formatProduct(Product::findById($id)), 'Product created', 201);
        } catch (\InvalidArgumentException $e) {
            Response::error($e->getMessage());
        }
    }

    public function update(int $id): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);

        if (!Product::findById($id)) {
            Response::error('Product not found', 404);
        }

        try {
            Product::update($id, $input);
            Response::success($this->formatProduct(Product::findById($id)), 'Product updated');
        } catch (\InvalidArgumentException $e) {
            Response::error($e->getMessage());
        }
    }

    public function destroy(int $id): void
    {
        AuthMiddleware::authenticate(true);

        if (!Product::findById($id)) {
            Response::error('Product not found', 404);
        }

        Product::delete($id);
        Response::success(null, 'Product deleted');
    }
}
