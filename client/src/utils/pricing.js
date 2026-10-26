// Mirrors server/src/services/pricing.js so the cart can show a total before checkout.
// The server recalculates everything; its response is what the user is charged.
export const FREE_DELIVERY_THRESHOLD = 499;
export const DELIVERY_FEE = 49;
export const MAX_QUANTITY_PER_ITEM = 10;

export function calculateCartTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return {
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    amountToFreeDelivery: Math.max(FREE_DELIVERY_THRESHOLD - subtotal, 0),
  };
}
