import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createStore } from '../src/data/store.js';
import { clinicNow } from '../src/utils/clock.js';

function dateAfter(days) {
  const date = new Date(`${clinicNow().date}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function registeredAgent(app, email = 'riya@example.com') {
  const agent = request.agent(app);
  await agent
    .post('/api/auth/register')
    .send({ name: 'Riya', email, password: 'secret123' })
    .expect(201);
  return agent;
}

describe('CareMate API', () => {
  let app;

  beforeEach(() => {
    app = createApp({ store: createStore(), sessionSecret: 'test-secret' });
  });

  describe('auth', () => {
    it('sets an httpOnly session cookie on register and never returns the password hash', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Riya', email: 'Riya@Example.com', password: 'secret123' })
        .expect(201);

      assert.equal(res.body.user.email, 'riya@example.com');
      assert.equal(res.body.user.passwordHash, undefined);
      assert.match(res.headers['set-cookie'][0], /caremate\.sid=.*HttpOnly/);
    });

    it('rejects a duplicate email', async () => {
      await registeredAgent(app);
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Riya 2', email: 'riya@example.com', password: 'secret123' })
        .expect(409);
    });

    it('keeps the user logged in across requests and logs out cleanly', async () => {
      const agent = await registeredAgent(app);
      const before = await agent.get('/api/auth/me').expect(200);
      assert.equal(before.body.user.name, 'Riya');

      await agent.post('/api/auth/logout').set('Content-Type', 'application/json').expect(204);
      const after = await agent.get('/api/auth/me').expect(200);
      assert.equal(after.body.user, null);
    });

    it('blocks login after five wrong passwords', async () => {
      await registeredAgent(app);
      for (let i = 0; i < 5; i += 1) {
        await request(app).post('/api/auth/login').send({ email: 'riya@example.com', password: 'wrong-pass' }).expect(401);
      }
      await request(app).post('/api/auth/login').send({ email: 'riya@example.com', password: 'secret123' }).expect(429);
    });

    it('refuses form-encoded writes (CSRF guard)', async () => {
      await request(app)
        .post('/api/auth/login')
        .type('form')
        .send({ email: 'a@b.com', password: 'x' })
        .expect(415);
    });
  });

  describe('doctors', () => {
    it('filters by speciality and sorts by fee', async () => {
      const res = await request(app)
        .get('/api/doctors')
        .query({ speciality: 'Cardiology', sort: 'fee_asc', limit: 500 })
        .expect(200);

      assert.ok(res.body.total > 0);
      assert.ok(res.body.items.every((d) => d.speciality === 'Cardiology'));
      const fees = res.body.items.map((d) => d.fee);
      assert.deepEqual(fees, [...fees].sort((a, b) => a - b));
    });

    it('builds one board row per speciality with a next free slot', async () => {
      const res = await request(app).get('/api/doctors/board').expect(200);
      assert.equal(res.body.rows.length, 10);
      for (const row of res.body.rows) {
        assert.ok(row.doctorCount > 0);
        assert.ok(row.minFee >= 200);
        assert.match(row.nextSlot.time, /^\d{2}:\d{2}$/);
      }
    });

    it('returns 404 for an unknown doctor', async () => {
      await request(app).get('/api/doctors/doc-9999').expect(404);
    });

    it('does not allow slots outside the booking window', async () => {
      await request(app).get('/api/doctors/doc-0001/slots').query({ date: dateAfter(30) }).expect(400);
    });
  });

  describe('consultations', () => {
    it('needs a login', async () => {
      await request(app).get('/api/consultations').expect(401);
    });

    it('books a slot once and refuses a second booking for the same slot', async () => {
      const date = dateAfter(2);
      const slotsRes = await request(app).get('/api/doctors/doc-0001/slots').query({ date }).expect(200);
      const { time } = slotsRes.body.slots.find((s) => s.available);

      const first = await registeredAgent(app, 'first@example.com');
      await first.post('/api/consultations').send({ doctorId: 'doc-0001', date, time, mode: 'video' }).expect(201);

      const second = await registeredAgent(app, 'second@example.com');
      await second.post('/api/consultations').send({ doctorId: 'doc-0001', date, time, mode: 'video' }).expect(409);

      const after = await request(app).get('/api/doctors/doc-0001/slots').query({ date });
      assert.equal(after.body.slots.find((s) => s.time === time).available, false);
    });

    it('does not let one user cancel another user\'s booking', async () => {
      const date = dateAfter(3);
      const owner = await registeredAgent(app, 'owner@example.com');
      const { body: slotsBody } = await request(app).get('/api/doctors/doc-0002/slots').query({ date });
      const { time } = slotsBody.slots.find((s) => s.available);
      const { body } = await owner
        .post('/api/consultations')
        .send({ doctorId: 'doc-0002', date, time, mode: 'clinic' })
        .expect(201);

      const stranger = await registeredAgent(app, 'stranger@example.com');
      await stranger
        .patch(`/api/consultations/${body.consultation.id}/cancel`)
        .set('Content-Type', 'application/json')
        .expect(404);
    });
  });

  describe('orders', () => {
    it('prices the order on the server and ignores prices sent by the client', async () => {
      const agent = await registeredAgent(app);
      const res = await agent
        .post('/api/orders')
        .send({
          items: [{ medicineId: 'med-paracetamol', quantity: 2, price: 1 }],
          address: '12, MG Road, Indore 452001',
        })
        .expect(201);

      assert.equal(res.body.order.subtotal, 64);
      assert.equal(res.body.order.deliveryFee, 49);
      assert.equal(res.body.order.total, 113);
    });

    it('marks prescription medicines as awaiting prescription', async () => {
      const agent = await registeredAgent(app);
      const res = await agent
        .post('/api/orders')
        .send({ items: [{ medicineId: 'med-amox', quantity: 1 }], address: '12, MG Road, Indore 452001' })
        .expect(201);

      assert.equal(res.body.order.status, 'awaiting_prescription');
    });
  });

  describe('lab bookings', () => {
    it('closes a collection window once it is full', async () => {
      const date = dateAfter(1);
      const booking = { testIds: ['lab-cbc'], date, time: '07:00', address: '12, MG Road, Indore 452001' };

      for (let i = 0; i < 3; i += 1) {
        const agent = await registeredAgent(app, `user${i}@example.com`);
        await agent.post('/api/lab-bookings').send(booking).expect(201);
      }
      const late = await registeredAgent(app, 'late@example.com');
      await late.post('/api/lab-bookings').send(booking).expect(409);
    });
  });
});
