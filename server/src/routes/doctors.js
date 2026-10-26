import { Router } from 'express';
import { getAvailableSlots } from '../services/slots.js';
import { clinicNow } from '../utils/clock.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { daysFromToday, isValidDate, toPositiveInt } from '../utils/validate.js';

export const BOOKING_WINDOW_DAYS = 14;
const MAX_PAGE_SIZE = 500;

const SORTERS = {
  relevance: () => 0,
  fee_asc: (a, b) => a.fee - b.fee,
  fee_desc: (a, b) => b.fee - a.fee,
  rating: (a, b) => b.rating - a.rating,
  experience: (a, b) => b.experienceYears - a.experienceYears,
};

export function filterDoctors(doctors, { search, speciality, city }) {
  const term = search?.trim().toLowerCase();
  return doctors.filter((doctor) => {
    if (speciality && doctor.speciality !== speciality) return false;
    if (city && doctor.city !== city) return false;
    if (term) {
      const haystack = `${doctor.name} ${doctor.speciality}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function nextDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

// Earliest free slot on `date` across a group of doctors, or null if all are full.
function earliestSlot(doctors, date, consultations, now) {
  let best = null;
  for (const doctor of doctors) {
    const slot = getAvailableSlots({ doctor, date, consultations, now }).find((s) => s.available);
    if (slot && (!best || slot.time < best.time)) {
      best = { date, time: slot.time, doctorId: doctor.id, doctorName: doctor.name };
    }
  }
  return best;
}

// One row per speciality for the home page board. Looks at today first and
// falls back to tomorrow once every doctor in that speciality is booked or done.
export function buildAvailabilityBoard(store, now = new Date()) {
  const today = clinicNow(now).date;
  const tomorrow = nextDate(today);

  const rows = uniqueSorted(store.doctors.map((d) => d.speciality)).map((speciality) => {
    const doctors = store.doctors.filter((d) => d.speciality === speciality);
    const todaySlot = earliestSlot(doctors, today, store.consultations, now);
    return {
      speciality,
      doctorCount: doctors.length,
      minFee: Math.min(...doctors.map((d) => d.fee)),
      nextSlot: todaySlot ?? earliestSlot(doctors, tomorrow, store.consultations, now),
    };
  });

  return { today, generatedAt: now.toISOString(), rows };
}

export function doctorsRouter(store) {
  const router = Router();

  router.get('/', (req, res) => {
    const { search, speciality, city, sort = 'relevance' } = req.query;
    const sorter = SORTERS[sort];
    if (!sorter) throw badRequest(`Unknown sort "${sort}"`);

    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), MAX_PAGE_SIZE);

    // filter() already returns a new array, so sorting it can't reorder store.doctors.
    const matches = filterDoctors(store.doctors, { search, speciality, city }).sort(sorter);
    const start = (page - 1) * limit;

    res.json({
      items: matches.slice(start, start + limit),
      total: matches.length,
      page,
      limit,
    });
  });

  router.get('/filters', (req, res) => {
    res.json({
      specialities: uniqueSorted(store.doctors.map((d) => d.speciality)),
      cities: uniqueSorted(store.doctors.map((d) => d.city)),
    });
  });

  router.get('/board', (req, res) => {
    res.json(buildAvailabilityBoard(store));
  });

  router.get('/:id', (req, res) => {
    const doctor = store.doctors.find((d) => d.id === req.params.id);
    if (!doctor) throw notFound('Doctor not found');
    res.json({ doctor });
  });

  router.get('/:id/slots', (req, res) => {
    const doctor = store.doctors.find((d) => d.id === req.params.id);
    if (!doctor) throw notFound('Doctor not found');

    const { date } = req.query;
    if (!isValidDate(date)) throw badRequest('Pass a date as YYYY-MM-DD');

    const offset = daysFromToday(date);
    if (offset < 0 || offset >= BOOKING_WINDOW_DAYS) {
      throw badRequest(`Slots are only open for the next ${BOOKING_WINDOW_DAYS} days`);
    }

    res.json({ date, slots: getAvailableSlots({ doctor, date, consultations: store.consultations }) });
  });

  return router;
}
