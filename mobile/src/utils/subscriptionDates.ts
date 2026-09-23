export type SubscriptionFrequency = 'daily' | 'alternate_day' | 'weekly' | 'custom';

export const DEFAULT_DELIVERY_COUNT = 30;

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toIsoDate(d);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function sortDates(dates: string[]): string[] {
  return [...dates].sort();
}

export function generateDeliveryDates(
  frequency: SubscriptionFrequency,
  startDate: string,
  count = DEFAULT_DELIVERY_COUNT
): string[] {
  if (frequency === 'custom' || !startDate) return [];

  const start = parseIsoDate(startDate);
  const dates: string[] = [];
  const step = frequency === 'daily' ? 1 : frequency === 'alternate_day' ? 2 : 7;

  const cursor = new Date(start);
  while (dates.length < count) {
    dates.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + step);
  }

  return dates;
}

export function formatDisplayDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
