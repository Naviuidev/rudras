export interface Address {
  id: number;
  user_id?: number;
  name: string;
  mobile: string;
  address_line: string;
  area?: string | null;
  city: string;
  state: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  is_default?: number | boolean;
}

export interface AddressInput {
  name: string;
  mobile: string;
  address_line: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  is_default?: boolean;
}

export interface ServiceLocation {
  id: number;
  name: string;
  lat?: number | null;
  lng?: number | null;
  active_status?: number;
}

export interface ServiceAreaCheckResult {
  in_service_area: boolean;
  distance_km?: number;
  radius_km?: number;
  message?: string;
  location?: { id: number; name: string };
  nearest?: { id: number; name: string; lat: number; lng: number; distance_km: number };
  total_locations?: number;
  locations_checked?: number;
}

export type AddressServiceStatus = 'serviceable' | 'unserviceable' | 'unknown' | 'checking';
