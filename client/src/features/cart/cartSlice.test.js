import { describe, expect, it } from 'vitest';
import reducer, {
  addToCart,
  clearCart,
  removeFromCart,
  selectCartCount,
  selectCartItems,
  selectCartTotals,
  setQuantity,
} from './cartSlice';

const paracetamol = { id: 'med-1', name: 'Paracetamol', pack: '15 tabs', price: 32, requiresPrescription: false };
const thermometer = { id: 'med-2', name: 'Thermometer', pack: '1 unit', price: 249, requiresPrescription: false };

function stateFrom(...actions) {
  return { cart: actions.reduce(reducer, undefined) };
}

describe('cartSlice', () => {
  it('adds a new item with quantity 1 and increments on repeat adds', () => {
    const state = stateFrom(addToCart(paracetamol), addToCart(paracetamol));
    expect(selectCartItems(state)).toEqual([{ ...paracetamol, quantity: 2 }]);
  });

  it('never goes above the per-item limit', () => {
    const state = stateFrom(addToCart(paracetamol), setQuantity({ id: 'med-1', quantity: 50 }));
    expect(state.cart.itemsById['med-1'].quantity).toBe(10);
  });

  it('removes the item when quantity drops to zero', () => {
    const state = stateFrom(addToCart(paracetamol), setQuantity({ id: 'med-1', quantity: 0 }));
    expect(selectCartItems(state)).toEqual([]);
  });

  it('ignores quantity updates for items not in the cart', () => {
    const state = stateFrom(setQuantity({ id: 'missing', quantity: 3 }));
    expect(selectCartItems(state)).toEqual([]);
  });

  it('counts units, not distinct items', () => {
    const state = stateFrom(addToCart(paracetamol), addToCart(paracetamol), addToCart(thermometer));
    expect(selectCartCount(state)).toBe(3);
  });

  it('charges delivery below ₹499 and makes it free at or above', () => {
    const small = stateFrom(addToCart(paracetamol));
    expect(selectCartTotals(small)).toMatchObject({ subtotal: 32, deliveryFee: 49, total: 81 });

    const large = stateFrom(addToCart(thermometer), addToCart(thermometer));
    expect(selectCartTotals(large)).toMatchObject({ subtotal: 498, deliveryFee: 49 });

    const free = stateFrom(addToCart(thermometer), addToCart(thermometer), addToCart(paracetamol));
    expect(selectCartTotals(free)).toMatchObject({ subtotal: 530, deliveryFee: 0, total: 530 });
  });

  it('returns the same array reference when nothing changed (memoized selector)', () => {
    const state = stateFrom(addToCart(paracetamol));
    expect(selectCartItems(state)).toBe(selectCartItems(state));
  });

  it('removeFromCart and clearCart empty the cart', () => {
    expect(selectCartItems(stateFrom(addToCart(paracetamol), removeFromCart('med-1')))).toEqual([]);
    expect(selectCartItems(stateFrom(addToCart(paracetamol), addToCart(thermometer), clearCart()))).toEqual([]);
  });
});
