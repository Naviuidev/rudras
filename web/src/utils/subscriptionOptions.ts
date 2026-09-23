import type { SubscriptionFrequency } from '../types';

export const FREQUENCY_OPTIONS: {
  value: SubscriptionFrequency;
  label: string;
  hint: string;
}[] = [
  { value: 'daily', label: 'Daily', hint: '30 deliveries' },
  { value: 'alternate_day', label: 'Alternate', hint: 'Every other day' },
  { value: 'weekly', label: 'Weekly', hint: 'Once a week' },
  { value: 'custom', label: 'Custom', hint: 'Pick your days' },
];
