import { Router } from 'express';
import { getAvailableSlots } from '../services/slots.js';
import { BOOKING_WINDOW_DAYS } from './doctors.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import { daysFromToday, isValidDate, isValidTime, requireFields } from '../utils/validate.js';

const CONSULT_MODES = ['video', 'clinic'];

function findOwnConsultation(store, user, id) {
  const consultation = store.consultations.find((c) => c.id === id && c.userId === user.id);
  if (!consultation) throw notFound('Consultation not found');
  return consultation;
}

function withDoctorSummary(store, consultation) {
  const doctor = store.doctors.find((d) => d.id === consultation.doctorId);
  return {
    ...consultation,
    doctor: doctor && { id: doctor.id, name: doctor.name, speciality: doctor.speciality, city: doctor.city },
  };
}

export function consultationsRouter(store) {
  const router = Router();

  router.get('/', (req, res) => {
    const mine = store.consultations
      .filter((c) => c.userId === req.user.id)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
      .map((c) => withDoctorSummary(store, c));
    res.json({ items: mine });
  });

  router.post('/', (req, res) => {
    requireFields(req.body, ['doctorId', 'date', 'time', 'mode']);
    const { doctorId, date, time, mode } = req.body;
    const reason = String(req.body.reason ?? '').trim().slice(0, 300);

    const doctor = store.doctors.find((d) => d.id === doctorId);
    if (!doctor) throw notFound('Doctor not found');
    if (!CONSULT_MODES.includes(mode)) throw badRequest(`Mode must be one of: ${CONSULT_MODES.join(', ')}`);
    if (!isValidDate(date) || !isValidTime(time)) throw badRequest('Date or time is in the wrong format');

    const offset = daysFromToday(date);
    if (offset < 0 || offset >= BOOKING_WINDOW_DAYS) {
      throw badRequest(`You can book up to ${BOOKING_WINDOW_DAYS} days ahead`);
    }

    // Never trust the slot list the browser showed; it may be minutes old.
    const slot = getAvailableSlots({ doctor, date, consultations: store.consultations }).find((s) => s.time === time);
    if (!slot) throw badRequest('That time is outside the doctor\'s hours');
    if (!slot.available) throw conflict('This slot was just taken. Please pick another one.');

    const clashesWithOwnBooking = store.consultations.some(
      (c) => c.userId === req.user.id && c.date === date && c.time === time && c.status !== 'cancelled',
    );
    if (clashesWithOwnBooking) throw conflict('You already have a consultation at this time');

    const consultation = store.insert('consultations', {
      userId: req.user.id,
      doctorId,
      date,
      time,
      mode,
      reason,
      fee: doctor.fee,
      status: 'confirmed',
    });

    res.status(201).json({ consultation: withDoctorSummary(store, consultation) });
  });

  router.patch('/:id/cancel', (req, res) => {
    const consultation = findOwnConsultation(store, req.user, req.params.id);
    if (consultation.status === 'cancelled') throw conflict('Already cancelled');
    if (daysFromToday(consultation.date) < 0) throw badRequest('Past consultations cannot be cancelled');

    const updated = store.update('consultations', consultation.id, { status: 'cancelled' });
    res.json({ consultation: withDoctorSummary(store, updated) });
  });

  return router;
}
