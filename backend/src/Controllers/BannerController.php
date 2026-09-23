<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\Banner;
use App\Utils\ImageUrl;
use App\Utils\Response;

class BannerController
{
    private function formatBanner(?array $banner): ?array
    {
        if (!$banner) {
            return null;
        }
        $banner['image'] = ImageUrl::resolve($banner['image'] ?? null);
        return $banner;
    }

    public function index(): void
    {
        $all = isset($_GET['all']);
        $banners = $all ? Banner::getAll() : Banner::getActive();
        Response::success(ImageUrl::resolveInArray($banners));
    }

    public function show(int $id): void
    {
        $banner = Banner::findById($id);
        if (!$banner) {
            Response::error('Banner not found', 404);
        }
        Response::success($this->formatBanner($banner));
    }

    public function store(): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['image'])) {
            Response::error('Banner image is required');
        }

        $input['title'] = trim((string) ($input['title'] ?? ''));

        $id = Banner::create($input);
        Response::success($this->formatBanner(Banner::findById($id)), 'Banner created', 201);
    }

    public function update(int $id): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);

        if (!Banner::findById($id)) {
            Response::error('Banner not found', 404);
        }

        if (array_key_exists('title', $input)) {
            $input['title'] = trim((string) ($input['title'] ?? ''));
        }

        Banner::update($id, $input);
        Response::success($this->formatBanner(Banner::findById($id)), 'Banner updated');
    }

    public function destroy(int $id): void
    {
        AuthMiddleware::authenticate(true);

        if (!Banner::findById($id)) {
            Response::error('Banner not found', 404);
        }

        Banner::delete($id);
        Response::success(null, 'Banner deleted');
    }
}
