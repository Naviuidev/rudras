<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\CmsPage;
use App\Utils\Response;

class CmsController
{
    public function show(string $slug): void
    {
        $page = CmsPage::getBySlug($slug);
        if (!$page) {
            Response::error('Page not found', 404);
        }
        Response::success($page);
    }

    public function index(): void
    {
        AuthMiddleware::authenticate(true);
        Response::success(CmsPage::getAll());
    }

    public function update(string $slug): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);

        if (!CmsPage::getBySlug($slug)) {
            Response::error('Page not found', 404);
        }

        CmsPage::update($slug, $input['title'] ?? '', $input['content'] ?? '');
        Response::success(CmsPage::getBySlug($slug), 'Page updated');
    }
}
