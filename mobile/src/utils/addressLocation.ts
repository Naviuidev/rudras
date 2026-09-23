import type { AddressInput } from '../types/address';

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

export function buildStaticMapUrl(lat: number, lng: number, width = 400, height = 180): string {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=${width}x${height}&markers=${lat},${lng},red`;
}

export function buildMapsLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

export async function reverseGeocode(lat: number, lng: number): Promise<Partial<AddressInput>> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
      },
    }
  );

  if (!res.ok) return {};

  const data = await res.json();
  const addr = data.address || {};
  const addressLine = [addr.house_number, addr.road, addr.residential, addr.suburb]
    .filter(Boolean)
    .join(', ');

  return {
    address_line: addressLine || (typeof data.display_name === 'string' ? data.display_name.split(',')[0] : ''),
    area: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '',
    city: addr.city || addr.town || addr.village || addr.state_district || '',
    state: addr.state || '',
    pincode: addr.postcode || '',
  };
}

export function matchConfiguredState(geocodedState: string, configuredStates: string[]): string {
  if (!geocodedState) return '';
  const normalized = geocodedState.trim().toLowerCase();
  return configuredStates.find((state) => state.toLowerCase() === normalized) || geocodedState;
}

export function formatAddressLine(a: {
  name: string;
  mobile: string;
  address_line: string;
  area?: string | null;
  city: string;
  state: string;
  pincode: string;
}): string {
  return `${a.name}, ${a.address_line}${a.area ? ', ' + a.area : ''}, ${a.city}, ${a.state} - ${a.pincode} (${a.mobile})`;
}
