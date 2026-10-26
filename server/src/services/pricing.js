export const FREE_DELIVERY_THRESHOLD = 499;
export const DELIVERY_FEE = 49;
export const MAX_QUANTITY_PER_ITEM = 10;

// Prices always come from the catalogue, never from the request body,
// otherwise anyone could edit the cart in DevTools and order at ₹1.
export function priceOrder(requestedItems, medicines) {
  const lines = requestedItems.map(({ medicineId, quantity }) => {
    const medicine = medicines.find((m) => m.id === medicineId);
    if (!medicine) {
      return { error: `Unknown medicine: ${medicineId}` };
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
      return { error: `Quantity for ${medicine.name} must be between 1 and ${MAX_QUANTITY_PER_ITEM}` };
    }
    return {
      medicineId,
      name: medicine.name,
      unitPrice: medicine.price,
      quantity,
      lineTotal: medicine.price * quantity,
      requiresPrescription: medicine.requiresPrescription,
    };
  });

  const errors = lines.filter((line) => line.error).map((line) => line.error);
  if (errors.length > 0) return { errors };

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  return { lines, subtotal, deliveryFee, total: subtotal + deliveryFee };
}
