import { describe, expect, it } from 'vitest';
import { isBeforeToday, toLocalISODate, upcomingDates } from './dates';
import { formatPrice, formatTime, pluralize } from './format';
import { getErrorMessage } from './apiError';

describe('dates', () => {
  it('builds the ISO date from local parts, not UTC', () => {
    // 00:30 local time must stay on the 26th, even where UTC is still the 25th.
    expect(toLocalISODate(new Date(2026, 9, 26, 0, 30))).toBe('2026-10-26');
  });

  it('lists consecutive days and crosses month boundaries', () => {
    const from = new Date(2026, 9, 30);
    expect(upcomingDates(4, { from })).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(upcomingDates(2, { from, startOffset: 1 })).toEqual(['2026-10-31', '2026-11-01']);
  });

  it('detects past dates', () => {
    const now = new Date(2026, 9, 26);
    expect(isBeforeToday('2026-10-25', now)).toBe(true);
    expect(isBeforeToday('2026-10-26', now)).toBe(false);
  });
});

describe('format', () => {
  it('formats rupees in the Indian style without paise', () => {
    expect(formatPrice(125000)).toBe('₹1,25,000');
  });

  it('formats 24h times as 12h', () => {
    expect(formatTime('00:15')).toBe('12:15 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('17:30')).toBe('5:30 PM');
  });

  it('pluralizes', () => {
    expect(pluralize(1, 'test')).toBe('1 test');
    expect(pluralize(3, 'test')).toBe('3 tests');
  });
});

describe('getErrorMessage', () => {
  it('prefers the server message', () => {
    expect(getErrorMessage({ status: 409, data: { error: 'Slot taken' } })).toBe('Slot taken');
  });

  it('explains network failures', () => {
    expect(getErrorMessage({ status: 'FETCH_ERROR' })).toMatch(/reach the server/);
  });

  it('returns null when there is no error', () => {
    expect(getErrorMessage(undefined)).toBeNull();
  });
});
