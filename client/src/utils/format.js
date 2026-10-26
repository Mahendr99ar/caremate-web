const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatPrice(amount) {
  return rupeeFormatter.format(amount);
}

// Parse "YYYY-MM-DD" as a local date. new Date("2026-10-26") would be UTC midnight
// and can show the previous day in some time zones.
export function parseISODate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(isoDate, options = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return parseISODate(isoDate).toLocaleDateString('en-IN', options);
}

export function formatTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

// Always one decimal, so 5 shows as "5.0" and lines up with "4.7".
export function formatRating(rating) {
  return rating.toFixed(1);
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
