import { Router } from 'express';
import { priceOrder } from '../services/pricing.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import { requireFields } from '../utils/validate.js';

export function medicinesRouter(store) {
  const router = Router();

  router.get('/', (req, res) => {
    const term = String(req.query.search ?? '').trim().toLowerCase();
    const items = term
      ? store.medicines.filter((m) => m.name.toLowerCase().includes(term))
      : store.medicines;
    res.json({ items });
  });

  return router;
}

export function ordersRouter(store) {
  const router = Router();

  router.get('/', (req, res) => {
    const mine = store.orders
      .filter((o) => o.userId === req.user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ items: mine });
  });

  router.post('/', (req, res) => {
    requireFields(req.body, ['items', 'address']);
    const { items } = req.body;
    const address = String(req.body.address).trim();

    if (!Array.isArray(items) || items.length === 0) throw badRequest('Your cart is empty');
    if (address.length < 10) throw badRequest('Please enter the full delivery address');

    const priced = priceOrder(items, store.medicines);
    if (priced.errors) throw badRequest('Some items could not be ordered', { errors: priced.errors });

    const needsPrescription = priced.lines.some((line) => line.requiresPrescription);
    const order = store.insert('orders', {
      userId: req.user.id,
      items: priced.lines,
      subtotal: priced.subtotal,
      deliveryFee: priced.deliveryFee,
      total: priced.total,
      address,
      status: needsPrescription ? 'awaiting_prescription' : 'placed',
    });

    res.status(201).json({ order });
  });

  router.patch('/:id/cancel', (req, res) => {
    const order = store.orders.find((o) => o.id === req.params.id && o.userId === req.user.id);
    if (!order) throw notFound('Order not found');
    if (!['placed', 'awaiting_prescription'].includes(order.status)) {
      throw conflict('This order can no longer be cancelled');
    }

    res.json({ order: store.update('orders', order.id, { status: 'cancelled' }) });
  });

  return router;
}
