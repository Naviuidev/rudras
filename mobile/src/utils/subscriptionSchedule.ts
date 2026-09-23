import type { SubscriptionFrequency } from './subscriptionDates';
import { generateDeliveryDates, sortDates } from './subscriptionDates';

export type DateKind = 'base' | 'addon' | 'missed';

export interface ScheduleState {
  baseDates: string[];
  deliveryDates: string[];
  missedDates: string[];
  addonDates: string[];
}

export function createSchedule(freq: SubscriptionFrequency, startDate: string): ScheduleState {
  if (freq === 'custom') {
    return { baseDates: [], deliveryDates: [], missedDates: [], addonDates: [] };
  }
  const baseDates = generateDeliveryDates(freq, startDate);
  return {
    baseDates,
    deliveryDates: [...baseDates],
    missedDates: [],
    addonDates: [],
  };
}

export function addonCreditsAvailable(state: ScheduleState): number {
  return Math.max(0, state.missedDates.length - state.addonDates.length);
}

export function classifyDate(state: ScheduleState, iso: string): DateKind | null {
  if (state.deliveryDates.includes(iso)) {
    return state.addonDates.includes(iso) ? 'addon' : 'base';
  }
  if (state.missedDates.includes(iso)) return 'missed';
  return null;
}

export function toggleScheduleDate(
  state: ScheduleState,
  iso: string,
  frequency: SubscriptionFrequency,
  minDate: string
): { state: ScheduleState; message?: string } {
  if (iso < minDate) return { state };

  const deliverySet = new Set(state.deliveryDates);
  const isSelected = deliverySet.has(iso);

  if (frequency === 'custom') {
    const deliveryDates = isSelected
      ? state.deliveryDates.filter((d) => d !== iso)
      : sortDates([...state.deliveryDates, iso]);
    return { state: { ...state, deliveryDates } };
  }

  if (isSelected) {
    const deliveryDates = state.deliveryDates.filter((d) => d !== iso);
    const missedDates =
      state.baseDates.includes(iso) && !state.missedDates.includes(iso)
        ? sortDates([...state.missedDates, iso])
        : state.missedDates;
    const addonDates = state.addonDates.filter((d) => d !== iso);
    return {
      state: { ...state, deliveryDates, missedDates, addonDates },
    };
  }

  if (state.missedDates.includes(iso)) {
    return {
      state: {
        ...state,
        deliveryDates: sortDates([...state.deliveryDates, iso]),
        missedDates: state.missedDates.filter((d) => d !== iso),
      },
    };
  }

  const credits = addonCreditsAvailable(state);
  if (credits > 0) {
    return {
      state: {
        ...state,
        deliveryDates: sortDates([...state.deliveryDates, iso]),
        addonDates: sortDates([...state.addonDates, iso]),
      },
    };
  }

  return {
    state,
    message: 'Skip a planned delivery first, then add it on a future day as an add-on.',
  };
}
