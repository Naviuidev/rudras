import { useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import type { SubscriptionFrequency } from '../types';
import {
  formatDisplayDate,
  sortDates,
  todayIso,
} from '../utils/subscriptionDates';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DeliveryDatePickerProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  frequency: SubscriptionFrequency;
  onReset?: () => void;
  showReset?: boolean;
}

export default function DeliveryDatePicker({
  selectedDates,
  onChange,
  frequency,
  onReset,
  showReset = false,
}: DeliveryDatePickerProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const minDate = todayIso();

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number; iso: string } | null> = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, iso });
    }

    return cells;
  }, [viewDate]);

  const toggleDate = (iso: string) => {
    if (iso < minDate) return;

    if (selectedSet.has(iso)) {
      onChange(selectedDates.filter((d) => d !== iso));
      return;
    }

    onChange(sortDates([...selectedDates, iso]));
  };

  const sortedSelected = sortDates(selectedDates);

  return (
    <div className="subscription-delivery-picker">
      <div className="subscription-delivery-picker-toolbar">
        <div>
          <p className="subscription-delivery-picker-label">
            {frequency === 'custom'
              ? 'Tap dates to add or remove deliveries'
              : 'Prefilled schedule — tap to adjust'}
          </p>
          <p className="subscription-delivery-picker-count">
            {selectedDates.length} delivery{selectedDates.length !== 1 ? 'ies' : ''} selected
          </p>
        </div>
        {showReset && onReset && (
          <Button
            type="button"
            variant="outline-success"
            size="sm"
            className="rounded-pill"
            onClick={onReset}
          >
            Reset schedule
          </Button>
        )}
      </div>

      <div className="subscription-calendar-nav">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          className="rounded-pill"
          onClick={() => setMonthOffset((m) => m - 1)}
        >
          ←
        </Button>
        <span className="subscription-calendar-month">{monthLabel}</span>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          className="rounded-pill"
          onClick={() => setMonthOffset((m) => m + 1)}
        >
          →
        </Button>
      </div>

      <div className="subscription-calendar-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="subscription-calendar-day header">
            {d}
          </div>
        ))}
        {calendarCells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="subscription-calendar-day empty" />;
          const { day, iso } = cell;
          const isPast = iso < minDate;
          const isSelected = selectedSet.has(iso);
          const isToday = iso === minDate;

          return (
            <button
              key={iso}
              type="button"
              className={`subscription-calendar-day ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => toggleDate(iso)}
              disabled={isPast}
              aria-pressed={isSelected}
              aria-label={`${formatDisplayDate(iso)}${isSelected ? ', selected' : ''}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {sortedSelected.length > 0 && (
        <div className="subscription-delivery-chips">
          {sortedSelected.slice(0, 8).map((iso) => (
            <button
              key={iso}
              type="button"
              className="subscription-delivery-chip"
              onClick={() => toggleDate(iso)}
              title="Remove date"
            >
              {formatDisplayDate(iso)}
              <span aria-hidden>×</span>
            </button>
          ))}
          {sortedSelected.length > 8 && (
            <span className="subscription-delivery-chip-more">
              +{sortedSelected.length - 8} more
            </span>
          )}
        </div>
      )}

      {frequency === 'custom' && selectedDates.length === 0 && (
        <p className="subscription-delivery-picker-hint text-muted small mb-0">
          Select at least one future delivery date to continue.
        </p>
      )}
    </div>
  );
}
