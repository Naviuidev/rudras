<?php
// Router script for PHP built-in server
// Usage: php -S localhost:8000 router.php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve uploaded files
if (str_starts_with($uri, '/uploads/')) {
    $file = __DIR__ . $uri;
    if (file_exists($file)) {
        $mime = mime_content_type($file);
        header('Content-Type: ' . $mime);
        readfile($file);
        return true;
    }
    http_response_code(404);
    return true;
}

// Route API requests
if (str_starts_with($uri, '/api')) {
    require __DIR__ . '/public/index.php';
    return true;
}

// Default
return false;
