import { Router } from 'express';
import { LAB_COLLECTION_TIMES } from '../data/seed.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import { daysFromToday, isValidDate, requireFields } from '../utils/validate.js';

// One phlebotomist team can cover this many homes per time window.
export const COLLECTIONS_PER_WINDOW = 3;
const LAB_BOOKING_WINDOW_DAYS = 7;

function activeBookingsAt(store, date, time) {
  return store.labBookings.filter((b) => b.date === date && b.time === time && b.status !== 'cancelled').length;
}

function collectionWindows(store, date) {
  return LAB_COLLECTION_TIMES.map((time) => {
    const left = COLLECTIONS_PER_WINDOW - activeBookingsAt(store, date, time);
    return { time, available: left > 0, spotsLeft: Math.max(left, 0) };
  });
}

function assertBookableDate(date) {
  if (!isValidDate(date)) throw badRequest('Pass a date as YYYY-MM-DD');
  // Same-day collection is not offered; samples are picked up early morning.
  const offset = daysFromToday(date);
  if (offset < 1 || offset > LAB_BOOKING_WINDOW_DAYS) {
    throw badRequest(`Home collection can be booked from tomorrow up to ${LAB_BOOKING_WINDOW_DAYS} days ahead`);
  }
}

export function labTestsRouter(store) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({ items: store.labTests });
  });

  router.get('/collection-slots', (req, res) => {
    assertBookableDate(req.query.date);
    res.json({ date: req.query.date, slots: collectionWindows(store, req.query.date) });
  });

  return router;
}

export function labBookingsRouter(store) {
  const router = Router();

  router.get('/', (req, res) => {
    const mine = store.labBookings
      .filter((b) => b.userId === req.user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ items: mine });
  });

  router.post('/', (req, res) => {
    requireFields(req.body, ['testIds', 'date', 'time', 'address']);
    const { testIds, date, time } = req.body;
    const address = String(req.body.address).trim();

    if (!Array.isArray(testIds) || testIds.length === 0) throw badRequest('Choose at least one test');
    assertBookableDate(date);

    const uniqueIds = [...new Set(testIds)];
    const tests = uniqueIds.map((id) => store.labTests.find((t) => t.id === id));
    if (tests.includes(undefined)) throw badRequest('One or more tests do not exist');

    const chosenWindow = collectionWindows(store, date).find((w) => w.time === time);
    if (!chosenWindow) throw badRequest('Pick one of the listed collection times');
    if (!chosenWindow.available) throw conflict('This collection time is full. Please pick another one.');
    if (address.length < 10) throw badRequest('Please enter the full collection address');

    const booking = store.insert('labBookings', {
      userId: req.user.id,
      tests: tests.map(({ id, name, price }) => ({ id, name, price })),
      total: tests.reduce((sum, t) => sum + t.price, 0),
      date,
      time,
      address,
      status: 'scheduled',
    });

    res.status(201).json({ booking });
  });

  router.patch('/:id/cancel', (req, res) => {
    const booking = store.labBookings.find((b) => b.id === req.params.id && b.userId === req.user.id);
    if (!booking) throw notFound('Lab booking not found');
    if (booking.status === 'cancelled') throw conflict('Already cancelled');

    res.json({ booking: store.update('labBookings', booking.id, { status: 'cancelled' }) });
  });

  return router;
}
