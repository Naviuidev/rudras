<?php

namespace App\Config;

class Env
{
    public static function load(): void
    {
        $paths = [
            dirname(__DIR__, 3) . '/.env',  // project root
            dirname(__DIR__, 2) . '/.env',  // backend fallback
        ];

        foreach ($paths as $envFile) {
            if (!file_exists($envFile)) {
                continue;
            }

            foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }
                [$key, $value] = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
            break;
        }
    }
}
