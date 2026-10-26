// All clinic times are Indian Standard Time. Using the server's UTC clock would
// treat 2 AM IST as "yesterday" and hide or show the wrong slots.

export const CLINIC_TIME_ZONE = 'Asia/Kolkata';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLINIC_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function clinicNow(now = new Date()) {
  const parts = Object.fromEntries(formatter.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}
