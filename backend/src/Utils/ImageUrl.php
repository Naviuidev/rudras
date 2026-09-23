<?php

namespace App\Utils;

class ImageUrl
{
    public static function resolve(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $baseUrl = rtrim($_ENV['APP_URL'] ?? 'http://localhost:8000', '/');
        return $baseUrl . (str_starts_with($path, '/') ? $path : '/' . $path);
    }

    public static function resolveInArray(array $items, string $field = 'image'): array
    {
        return array_map(function ($item) use ($field) {
            if (isset($item[$field])) {
                $item[$field] = self::resolve($item[$field]);
            }
            return $item;
        }, $items);
    }
}
