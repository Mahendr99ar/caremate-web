import { badRequest } from './httpError.js';
import { clinicNow } from './clock.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
  if (missing.length > 0) {
    throw badRequest(`Missing required fields: ${missing.join(', ')}`, { missing });
  }
}

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_PATTERN.test(email);
}

export function isValidTime(time) {
  return typeof time === 'string' && TIME_PATTERN.test(time);
}

// Checks the shape and that the date actually exists (rejects 2026-02-30).
export function isValidDate(dateString) {
  if (typeof dateString !== 'string' || !DATE_PATTERN.test(dateString)) return false;
  const date = new Date(`${dateString}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(dateString);
}

// ISO date strings compare correctly as plain strings ("2026-10-26" < "2026-11-01").
export function isPastDate(dateString, now = new Date()) {
  return dateString < clinicNow(now).date;
}

export function daysFromToday(dateString, now = new Date()) {
  const today = new Date(`${clinicNow(now).date}T00:00:00Z`);
  const target = new Date(`${dateString}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}

export function toPositiveInt(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}
