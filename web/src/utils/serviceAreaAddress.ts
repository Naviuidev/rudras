import type { Address, AddressInput, ServiceLocation } from '../types';

export function parseServiceLocationName(name: string): { locality: string; city: string; state: string } {
  const parts = name.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return { locality: parts[0], city: parts[1], state: parts[parts.length - 1] };
  }
  if (parts.length === 2) {
    return { locality: '', city: parts[0], state: parts[1] };
  }
  return { locality: '', city: name, state: '' };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchAddressToServiceLocation(
  address: Pick<Address, 'city' | 'state' | 'area'>,
  locations: ServiceLocation[]
): ServiceLocation | null {
  const city = normalize(address.city || '');
  const state = normalize(address.state || '');
  const area = normalize(address.area || '');

  if (!city && !state && !area) return null;

  for (const location of locations) {
    const parsed = parseServiceLocationName(location.name);
    const locState = normalize(parsed.state);
    const locCity = normalize(parsed.city);
    const locLocality = normalize(parsed.locality);
    const locName = normalize(location.name);

    if (state && locState && state !== locState) continue;

    const cityMatch =
      (city && (locCity === city || locLocality === city || locName.includes(city))) ||
      (area && (locLocality === area || locCity === area || locName.includes(area)));

    if (cityMatch) return location;
  }

  return null;
}

export function serviceLocationCoords(
  location: ServiceLocation | null | undefined
): { lat: number; lng: number } | null {
  if (location?.lat == null || location?.lng == null) return null;
  return { lat: Number(location.lat), lng: Number(location.lng) };
}

export function resolveAddressCheckCoords(
  address: Pick<Address, 'city' | 'state' | 'area' | 'lat' | 'lng'>,
  locations: ServiceLocation[],
  preferredLocationId?: number | null
): { lat: number; lng: number; source: 'gps' | 'service_location' } | null {
  if (preferredLocationId) {
    const preferred = locations.find((loc) => loc.id === preferredLocationId);
    const preferredCoords = serviceLocationCoords(preferred);
    if (preferredCoords) {
      return { ...preferredCoords, source: 'service_location' };
    }
  }

  const matched = matchAddressToServiceLocation(address, locations);
  const matchedCoords = serviceLocationCoords(matched);

  if (address.lat != null && address.lng != null) {
    return {
      lat: Number(address.lat),
      lng: Number(address.lng),
      source: 'gps',
    };
  }

  if (matchedCoords) {
    return { ...matchedCoords, source: 'service_location' };
  }

  return null;
}

export async function evaluateAddressServiceability(
  address: Address,
  locations: ServiceLocation[],
  checkServiceArea: (lat: number, lng: number) => Promise<{ in_service_area: boolean }>
): Promise<'serviceable' | 'unserviceable' | 'unknown'> {
  const gpsCoords =
    address.lat != null && address.lng != null
      ? { lat: Number(address.lat), lng: Number(address.lng) }
      : null;
  const matched = matchAddressToServiceLocation(address, locations);
  const matchedCoords = serviceLocationCoords(matched);

  if (gpsCoords) {
    try {
      const gpsResult = await checkServiceArea(gpsCoords.lat, gpsCoords.lng);
      if (gpsResult.in_service_area) return 'serviceable';
    } catch {
      /* try fallback below */
    }
  }

  if (matchedCoords) {
    try {
      const matchedResult = await checkServiceArea(matchedCoords.lat, matchedCoords.lng);
      return matchedResult.in_service_area ? 'serviceable' : 'unserviceable';
    } catch {
      return 'unknown';
    }
  }

  if (gpsCoords) {
    try {
      const gpsResult = await checkServiceArea(gpsCoords.lat, gpsCoords.lng);
      return gpsResult.in_service_area ? 'serviceable' : 'unserviceable';
    } catch {
      return 'unknown';
    }
  }

  return 'unknown';
}

export function applyServiceLocationToAddress(
  form: AddressInput,
  location: ServiceLocation
): AddressInput {
  const parsed = parseServiceLocationName(location.name);
  const coords = serviceLocationCoords(location);

  return {
    ...form,
    state: parsed.state || form.state,
    city: parsed.city || form.city,
    area: form.area || parsed.locality,
    lat: coords?.lat ?? form.lat ?? null,
    lng: coords?.lng ?? form.lng ?? null,
  };
}
