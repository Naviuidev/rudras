import type { SubscriptionFrequency } from './subscriptionDates';

export const FREQUENCY_OPTIONS: {
  value: SubscriptionFrequency;
  label: string;
  hint: string;
}[] = [
  { value: 'daily', label: 'Daily', hint: '30 deliveries' },
  { value: 'alternate_day', label: 'Alternate', hint: 'Every other day' },
  { value: 'weekly', label: 'Weekly', hint: 'Once a week' },
];

export const CALENDAR_FREQUENCY: SubscriptionFrequency = 'custom';
