<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Utils\Response;

class UploadController
{
    public function upload(): void
    {
        AuthMiddleware::authenticate(true);

        if (!isset($_FILES['file'])) {
            Response::error('No file uploaded');
        }

        $file = $_FILES['file'];
        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (!in_array($file['type'], $allowed)) {
            Response::error('Invalid file type. Only JPEG, PNG, WebP, GIF allowed.');
        }

        $uploadDir = __DIR__ . '/../../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('img_') . '.' . $ext;
        $path = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $path)) {
            Response::error('Failed to upload file', 500);
        }

        $baseUrl = rtrim($_ENV['APP_URL'] ?? 'http://localhost:8000', '/');
        Response::success(['url' => "{$baseUrl}/uploads/{$filename}"], 'File uploaded');
    }
}
