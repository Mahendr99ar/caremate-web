import { useEffect, useState } from 'react';

const clockFormat = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

// Clinic time (IST) as "06:42 pm", updated once a minute on the minute.
export function useClinicClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval;
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return clockFormat.format(now).toUpperCase();
}
