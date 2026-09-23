<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\ServiceLocation;
use App\Utils\Geo;
use App\Utils\Response;

class ServiceLocationController
{
    private function isValidMapUrl(string $url): bool
    {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
        $path = strtolower(parse_url($url, PHP_URL_PATH) ?? '');

        // Short share links: https://maps.app.goo.gl/xxxxx
        if ($host === 'maps.app.goo.gl') {
            return strlen(trim($path, '/')) > 0;
        }

        // Legacy short links: https://goo.gl/maps/xxxxx
        if (str_ends_with($host, 'goo.gl') && str_contains($path, '/maps')) {
            return true;
        }

        // Standard links: google.com/maps/..., maps.google.com/...
        return str_contains($host, 'google')
            && (str_contains($path, '/maps') || str_contains($host, 'maps'));
    }

    private function defaultName(string $mapUrl): string
    {
        $path = parse_url($mapUrl, PHP_URL_PATH) ?? '';
        if ($path !== '') {
            $segment = basename(rtrim($path, '/'));
            if ($segment !== '' && $segment !== 'maps') {
                return urldecode(str_replace(['+', '-'], ' ', $segment));
            }
        }

        return 'Service Location';
    }

    private function followRedirects(string $url): string
    {
        if (!function_exists('curl_init')) {
            return $url;
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_NOBODY => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; RudraAdmin/1.0)',
        ]);
        curl_exec($ch);
        $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        curl_close($ch);

        return is_string($finalUrl) && $finalUrl !== '' ? $finalUrl : $url;
    }

    private function extractCoords(string $url): ?array
    {
        if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $url, $matches)) {
            return ['lat' => (float) $matches[1], 'lng' => (float) $matches[2]];
        }
        if (preg_match('/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/', $url, $matches)) {
            return ['lat' => (float) $matches[1], 'lng' => (float) $matches[2]];
        }
        if (preg_match('/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/', $url, $matches)) {
            return ['lat' => (float) $matches[1], 'lng' => (float) $matches[2]];
        }

        return null;
    }

    private function extractPlaceName(string $url): ?string
    {
        if (preg_match('#/maps/place/([^/@?]+)#', $url, $matches)) {
            $name = urldecode(str_replace('+', ' ', $matches[1]));
            return trim($name) !== '' ? $name : null;
        }

        return null;
    }

    private function buildEmbedUrl(array $coords): string
    {
        return sprintf(
            'https://maps.google.com/maps?q=%s,%s&hl=en&z=15&output=embed',
            $coords['lat'],
            $coords['lng']
        );
    }

    public function preview(): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $mapUrl = trim((string) ($input['map_url'] ?? ''));

        if ($mapUrl === '') {
            Response::error('Google Maps link is required');
        }

        if (!$this->isValidMapUrl($mapUrl)) {
            Response::error('Please paste a valid Google Maps link');
        }

        $resolvedUrl = $this->followRedirects($mapUrl);
        $coords = $this->extractCoords($resolvedUrl) ?? $this->extractCoords($mapUrl);
        $placeName = $this->extractPlaceName($resolvedUrl) ?? $this->extractPlaceName($mapUrl);

        Response::success([
            'map_url' => $mapUrl,
            'resolved_url' => $resolvedUrl,
            'place_name' => $placeName,
            'lat' => $coords['lat'] ?? null,
            'lng' => $coords['lng'] ?? null,
            'embed_url' => $coords ? $this->buildEmbedUrl($coords) : null,
        ]);
    }

    public function index(): void
    {
        $all = isset($_GET['all']);
        try {
            $locations = ServiceLocation::getAll(!$all);
            Response::success($locations);
        } catch (\Exception $e) {
            Response::success([]);
        }
    }

    public function store(): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $mapUrl = trim((string) ($input['map_url'] ?? ''));
        $name = trim((string) ($input['name'] ?? ''));

        if ($mapUrl === '') {
            Response::error('Google Maps link is required');
        }

        if (!$this->isValidMapUrl($mapUrl)) {
            Response::error('Please paste a valid Google Maps link');
        }

        if ($name === '') {
            $name = $this->defaultName($mapUrl);
        }

        $resolvedUrl = $this->followRedirects($mapUrl);
        $coords = $this->extractCoords($resolvedUrl) ?? $this->extractCoords($mapUrl);

        try {
            $id = ServiceLocation::create(
                $name,
                $mapUrl,
                (int) ($input['display_order'] ?? 0),
                $coords['lat'] ?? null,
                $coords['lng'] ?? null
            );
            Response::success(ServiceLocation::findById($id), 'Service location added', 201);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'Duplicate')) {
                Response::error('This map link has already been added');
            }
            Response::error('Failed to add service location. Run database/service_locations.sql first.', 500);
        }
    }

    public function destroy(int $id): void
    {
        AuthMiddleware::authenticate(true);

        if (!ServiceLocation::findById($id)) {
            Response::error('Service location not found', 404);
        }

        ServiceLocation::delete($id);
        Response::success(null, 'Service location deleted');
    }

    private function resolveLocationCoords(array $location): ?array
    {
        if (isset($location['lat'], $location['lng']) && $location['lat'] !== null && $location['lng'] !== null) {
            return ['lat' => (float) $location['lat'], 'lng' => (float) $location['lng']];
        }

        $resolvedUrl = $this->followRedirects((string) $location['map_url']);
        $coords = $this->extractCoords($resolvedUrl) ?? $this->extractCoords((string) $location['map_url']);

        if ($coords && isset($location['id'])) {
            ServiceLocation::updateCoords((int) $location['id'], $coords['lat'], $coords['lng']);
        }

        return $coords;
    }

    public function check(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $lat = isset($input['lat']) ? (float) $input['lat'] : null;
        $lng = isset($input['lng']) ? (float) $input['lng'] : null;

        if ($lat === null || $lng === null) {
            Response::error('Location coordinates are required');
        }

        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            Response::error('Invalid location coordinates');
        }

        try {
            $locations = ServiceLocation::getAll(true);
        } catch (\Exception $e) {
            $locations = [];
        }

        if ($locations === []) {
            Response::success([
                'in_service_area' => true,
                'message' => 'No service boundaries configured',
                'total_locations' => 0,
                'locations_checked' => 0,
            ]);
        }

        $radiusKm = (float) ($_ENV['SERVICE_AREA_RADIUS_KM'] ?? 15);
        $nearest = null;
        $minDistance = null;
        $locationsChecked = 0;
        $matchedLocation = null;
        $matchedDistance = null;

        foreach ($locations as $location) {
            $coords = $this->resolveLocationCoords($location);
            if (!$coords) {
                continue;
            }

            $locationsChecked++;
            $distance = Geo::distanceKm($lat, $lng, $coords['lat'], $coords['lng']);

            if ($minDistance === null || $distance < $minDistance) {
                $minDistance = $distance;
                $nearest = [
                    'id' => (int) $location['id'],
                    'name' => $location['name'],
                    'lat' => $coords['lat'],
                    'lng' => $coords['lng'],
                    'distance_km' => round($distance, 2),
                ];
            }

            if ($distance <= $radiusKm && $matchedLocation === null) {
                $matchedLocation = [
                    'id' => (int) $location['id'],
                    'name' => $location['name'],
                ];
                $matchedDistance = round($distance, 2);
            }
        }

        if ($locationsChecked === 0) {
            Response::success([
                'in_service_area' => true,
                'message' => 'Service locations could not be resolved',
                'total_locations' => count($locations),
                'locations_checked' => 0,
            ]);
        }

        if ($matchedLocation !== null) {
            Response::success([
                'in_service_area' => true,
                'distance_km' => $matchedDistance,
                'radius_km' => $radiusKm,
                'location' => $matchedLocation,
                'total_locations' => count($locations),
                'locations_checked' => $locationsChecked,
            ]);
        }

        Response::success([
            'in_service_area' => false,
            'distance_km' => $minDistance !== null ? round($minDistance, 2) : null,
            'radius_km' => $radiusKm,
            'nearest' => $nearest,
            'total_locations' => count($locations),
            'locations_checked' => $locationsChecked,
            'message' => $nearest
                ? sprintf(
                    'We do not deliver to your location yet. Nearest service area is %s (%.1f km away).',
                    $nearest['name'],
                    (float) ($nearest['distance_km'] ?? $minDistance ?? 0)
                )
                : 'We do not deliver to your location yet.',
        ]);
    }
}
