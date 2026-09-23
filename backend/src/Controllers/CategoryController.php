<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Category;
use App\Utils\ImageUrl;
use App\Utils\Response;

class CategoryController
{
    private function formatCategory(?array $category): ?array
    {
        if (!$category) {
            return null;
        }
        $category['image'] = ImageUrl::resolve($category['image'] ?? null);
        return $category;
    }

    public function index(): void
    {
        $all = isset($_GET['all']);
        try {
            $categories = Category::getAll(!$all);
            Response::success(ImageUrl::resolveInArray($categories));
        } catch (\Exception $e) {
            Response::success([]);
        }
    }

    public function store(): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);
        $name = trim($input['name'] ?? '');

        if ($name === '') {
            Response::error('Category name is required');
        }

        try {
            $slug = Category::slugify($name);
            if (Category::findBySlug($slug)) {
                Response::error('Category already exists');
            }
            $id = Category::create(
                $name,
                $input['image'] ?? null,
                (int) ($input['display_order'] ?? 0)
            );
            Response::success($this->formatCategory(Category::findById($id)), 'Category created', 201);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'Duplicate')) {
                Response::error('Category already exists');
            }
            Response::error('Failed to create category. Run database/categories.sql first.', 500);
        }
    }

    public function update(int $id): void
    {
        AuthMiddleware::authenticate(true);

        if (!Category::findById($id)) {
            Response::error('Category not found', 404);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        Category::update($id, $input);
        Response::success($this->formatCategory(Category::findById($id)), 'Category updated');
    }

    public function destroy(int $id): void
    {
        AuthMiddleware::authenticate(true);

        $category = Category::findById($id);
        if (!$category) {
            Response::error('Category not found', 404);
        }

        if (Category::countProducts($category['slug']) > 0) {
            Response::error('Cannot delete category with associated products. Reassign products first.');
        }

        Category::delete($id);
        Response::success(null, 'Category deleted');
    }
}
