import { clinicNow } from '../utils/clock.js';

// Turns a doctor's working hours into bookable slots for one day.

export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const LUNCH_BREAK = { start: timeToMinutes('13:00'), end: timeToMinutes('14:00') };

function overlapsLunch(slotStart, slotEnd) {
  return slotStart < LUNCH_BREAK.end && slotEnd > LUNCH_BREAK.start;
}

export function buildDaySlots(doctor) {
  const start = timeToMinutes(doctor.schedule.start);
  const end = timeToMinutes(doctor.schedule.end);
  const slots = [];

  for (let time = start; time + doctor.slotMinutes <= end; time += doctor.slotMinutes) {
    if (!overlapsLunch(time, time + doctor.slotMinutes)) {
      slots.push(minutesToTime(time));
    }
  }
  return slots;
}

// `now` is a parameter so tests can pin the clock.
export function getAvailableSlots({ doctor, date, consultations, now = new Date() }) {
  const taken = new Set(
    consultations
      .filter((c) => c.doctorId === doctor.id && c.date === date && c.status !== 'cancelled')
      .map((c) => c.time),
  );

  const clinic = clinicNow(now);

  return buildDaySlots(doctor).map((time) => {
    const isPast = date === clinic.date && timeToMinutes(time) <= clinic.minutes;
    return { time, available: !taken.has(time) && !isPast };
  });
}
