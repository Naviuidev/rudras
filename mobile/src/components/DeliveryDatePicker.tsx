import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SubscriptionFrequency } from '../utils/subscriptionDates';
import { formatDisplayDate, sortDates, todayIso } from '../utils/subscriptionDates';
import {
  addonCreditsAvailable,
  classifyDate,
  createSchedule,
  type ScheduleState,
} from '../utils/subscriptionSchedule';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import AppButton from './AppButton';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DeliveryDatePickerProps {
  schedule: ScheduleState;
  frequency: SubscriptionFrequency;
  onToggleDate: (iso: string) => void;
  onReset?: () => void;
  showReset?: boolean;
  hintMessage?: string;
}

export default function DeliveryDatePicker({
  schedule,
  frequency,
  onToggleDate,
  onReset,
  showReset = false,
  hintMessage,
}: DeliveryDatePickerProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const safeSchedule = schedule ?? createSchedule(frequency, todayIso());
  const { deliveryDates, missedDates, addonDates } = safeSchedule;
  const selectedSet = useMemo(() => new Set(deliveryDates), [deliveryDates]);
  const minDate = todayIso();
  const addonCredits = addonCreditsAvailable(safeSchedule);

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

  const sortedSelected = sortDates(deliveryDates);

  return (
    <View style={styles.card}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarText}>
          <Text style={styles.label}>
            {frequency === 'custom'
              ? 'Tap dates to add or remove deliveries'
              : 'Prefilled schedule — tap to adjust'}
          </Text>
          <Text style={styles.count}>
            {deliveryDates.length} deliver{deliveryDates.length === 1 ? 'y' : 'ies'} selected
          </Text>
          {frequency !== 'custom' && missedDates.length > 0 ? (
            <Text style={styles.missedInfo}>
              {missedDates.length} skipped · {addonCredits} add-on slot{addonCredits === 1 ? '' : 's'}{' '}
              available
            </Text>
          ) : null}
        </View>
        {showReset && onReset ? <AppButton label="Reset" onPress={onReset} small /> : null}
      </View>

      {hintMessage ? <Text style={styles.hint}>{hintMessage}</Text> : null}

      {frequency !== 'custom' && addonCredits > 0 ? (
        <View style={styles.addonBanner}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.accent} />
          <Text style={styles.addonBannerText}>
            Tap a future day to schedule a missed delivery as an add-on ({addonCredits} left).
          </Text>
        </View>
      ) : null}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendBase]} />
          <Text style={styles.legendText}>Planned</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendAddon]} />
          <Text style={styles.legendText}>Add-on</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendMissed]} />
          <Text style={styles.legendText}>Skipped</Text>
        </View>
      </View>

      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setMonthOffset((m) => m - 1)}>
          <Ionicons name="chevron-back" size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.month}>{monthLabel}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => setMonthOffset((m) => m + 1)}>
          <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
        {calendarCells.map((cell, i) => {
          if (!cell) return <View key={`e-${i}`} style={styles.cellEmpty} />;
          const { day, iso } = cell;
          const isPast = iso < minDate;
          const kind = classifyDate(safeSchedule, iso);
          const isSelected = selectedSet.has(iso);
          const isMissed = kind === 'missed';
          const isAddon = kind === 'addon';
          const isToday = iso === minDate;

          return (
            <TouchableOpacity
              key={iso}
              style={[
                styles.cell,
                isSelected && !isAddon && styles.cellSelected,
                isAddon && styles.cellAddon,
                isMissed && styles.cellMissed,
                isPast && !isMissed && styles.cellPast,
                isToday && styles.cellToday,
              ]}
              onPress={() => onToggleDate(iso)}
              disabled={isPast && !isMissed && !isSelected}
            >
              <Text
                style={[
                  styles.cellText,
                  (isSelected || isAddon) && styles.cellTextSelected,
                  isMissed && styles.cellTextMissed,
                  isPast && !isMissed && !isSelected && styles.cellTextPast,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {sortedSelected.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {sortedSelected.map((iso) => {
            const isAddon = addonDates.includes(iso);
            return (
              <TouchableOpacity
                key={iso}
                style={[styles.chip, isAddon && styles.chipAddon]}
                onPress={() => onToggleDate(iso)}
              >
                <Text style={[styles.chipText, isAddon && styles.chipTextAddon]}>
                  {formatDisplayDate(iso)}
                  {isAddon ? ' · add-on' : ''} ×
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  toolbarText: { flex: 1 },
  label: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  count: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  missedInfo: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.accent, marginTop: 4 },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  addonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  addonBannerText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.accent,
    lineHeight: 18,
  },
  legend: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendBase: { backgroundColor: COLORS.accent },
  legendAddon: { backgroundColor: '#4a90e2' },
  legendMissed: { backgroundColor: '#f0c4c4', borderWidth: 1, borderColor: '#d88' },
  legendText: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.textLight },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  month: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textLight,
    paddingVertical: 4,
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  cellEmpty: { width: '14.28%', aspectRatio: 1 },
  cellSelected: { backgroundColor: COLORS.accent },
  cellAddon: { backgroundColor: '#4a90e2' },
  cellMissed: {
    backgroundColor: '#fdeaea',
    borderWidth: 1.5,
    borderColor: '#e57373',
    borderStyle: 'dashed',
  },
  cellPast: { opacity: 0.35 },
  cellToday: { borderWidth: 1.5, borderColor: COLORS.accent },
  cellText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
  cellTextSelected: { color: '#fff' },
  cellTextMissed: { color: '#c62828' },
  cellTextPast: { color: COLORS.textLight },
  chips: { marginTop: SPACING.sm },
  chip: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#badbcc',
  },
  chipAddon: {
    backgroundColor: '#e8f2fc',
    borderColor: '#9ec5eb',
  },
  chipText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.accent },
  chipTextAddon: { color: '#2a5f9e' },
});
