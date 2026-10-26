// toISOString() converts to UTC first, which turns 1 AM IST into the previous day.
// Building the string from local parts avoids that.
export function toLocalISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function upcomingDates(count, { startOffset = 0, from = new Date() } = {}) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + startOffset + index);
    return toLocalISODate(date);
  });
}

export function isBeforeToday(isoDate, now = new Date()) {
  return isoDate < toLocalISODate(now);
}
