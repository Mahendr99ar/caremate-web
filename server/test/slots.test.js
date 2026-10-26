import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDaySlots, getAvailableSlots, minutesToTime, timeToMinutes } from '../src/services/slots.js';
import { priceOrder } from '../src/services/pricing.js';
import { isValidDate } from '../src/utils/validate.js';

const doctor = { id: 'doc-x', schedule: { start: '11:00', end: '15:00' }, slotMinutes: 30 };

describe('slots', () => {
  it('converts between "HH:MM" and minutes', () => {
    assert.equal(timeToMinutes('09:30'), 570);
    assert.equal(minutesToTime(570), '09:30');
  });

  it('skips the lunch hour', () => {
    assert.deepEqual(buildDaySlots(doctor), ['11:00', '11:30', '12:00', '12:30', '14:00', '14:30']);
  });

  it('marks booked and already-passed slots as unavailable (IST clock)', () => {
    // 06:15 UTC is 11:45 IST.
    const now = new Date('2026-10-26T06:15:00Z');
    const consultations = [{ doctorId: 'doc-x', date: '2026-10-26', time: '12:30', status: 'confirmed' }];

    const slots = getAvailableSlots({ doctor, date: '2026-10-26', consultations, now });
    const available = slots.filter((s) => s.available).map((s) => s.time);

    assert.deepEqual(available, ['12:00', '14:00', '14:30']);
  });

  it('frees a slot again after cancellation', () => {
    const consultations = [{ doctorId: 'doc-x', date: '2030-01-01', time: '11:00', status: 'cancelled' }];
    const slots = getAvailableSlots({ doctor, date: '2030-01-01', consultations });
    assert.equal(slots[0].available, true);
  });
});

describe('priceOrder', () => {
  const medicines = [{ id: 'm1', name: 'Test Med', price: 250, requiresPrescription: false }];

  it('gives free delivery at the threshold', () => {
    const result = priceOrder([{ medicineId: 'm1', quantity: 2 }], medicines);
    assert.equal(result.subtotal, 500);
    assert.equal(result.deliveryFee, 0);
  });

  it('collects every error instead of stopping at the first', () => {
    const result = priceOrder(
      [{ medicineId: 'nope', quantity: 1 }, { medicineId: 'm1', quantity: 0 }],
      medicines,
    );
    assert.equal(result.errors.length, 2);
  });
});

describe('isValidDate', () => {
  it('rejects dates that do not exist', () => {
    assert.equal(isValidDate('2026-02-30'), false);
    assert.equal(isValidDate('2026-02-28'), true);
    assert.equal(isValidDate('26-02-2026'), false);
  });
});
