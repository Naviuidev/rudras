import type { Address, ServiceLocation } from '../types/address';

export type DeliveryChoice =
  | { kind: 'address'; address: Address }
  | { kind: 'service_location'; location: ServiceLocation }
  | { kind: 'gps'; lat: number; lng: number; label: string };

export function deliveryChoiceLabel(choice: DeliveryChoice): string {
  if (choice.kind === 'address') {
    return `${choice.address.address_line}${choice.address.area ? ', ' + choice.address.area : ''}, ${choice.address.city}`;
  }
  if (choice.kind === 'service_location') {
    return choice.location.name;
  }
  return choice.label;
}

export function deliveryChoiceCoords(choice: DeliveryChoice): { lat: number; lng: number } | null {
  if (choice.kind === 'address') {
    if (choice.address.lat == null || choice.address.lng == null) return null;
    return { lat: Number(choice.address.lat), lng: Number(choice.address.lng) };
  }
  if (choice.kind === 'service_location') {
    if (choice.location.lat == null || choice.location.lng == null) return null;
    return { lat: Number(choice.location.lat), lng: Number(choice.location.lng) };
  }
  return { lat: choice.lat, lng: choice.lng };
}
