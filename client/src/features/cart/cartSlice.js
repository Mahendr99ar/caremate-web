import { createSelector, createSlice } from '@reduxjs/toolkit';
import { calculateCartTotals, MAX_QUANTITY_PER_ITEM } from '../../utils/pricing';

const initialState = {
  // Keyed by medicine id so add/update/remove are O(1) lookups.
  itemsById: {},
};

function clampQuantity(quantity) {
  return Math.min(Math.max(quantity, 0), MAX_QUANTITY_PER_ITEM);
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Immer lets us write "mutating" code here; it produces a new state object underneath.
    addToCart(state, action) {
      const { id, name, pack, price, requiresPrescription } = action.payload;
      const existing = state.itemsById[id];
      if (existing) {
        existing.quantity = clampQuantity(existing.quantity + 1);
      } else {
        state.itemsById[id] = { id, name, pack, price, requiresPrescription, quantity: 1 };
      }
    },
    setQuantity(state, action) {
      const { id, quantity } = action.payload;
      if (!state.itemsById[id]) return;
      const next = clampQuantity(quantity);
      if (next === 0) {
        delete state.itemsById[id];
      } else {
        state.itemsById[id].quantity = next;
      }
    },
    removeFromCart(state, action) {
      delete state.itemsById[action.payload];
    },
    clearCart() {
      return initialState;
    },
  },
});

export const { addToCart, setQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

const selectItemsById = (state) => state.cart.itemsById;

// createSelector caches the result, so components re-render only when the cart really changes.
export const selectCartItems = createSelector(selectItemsById, (itemsById) => Object.values(itemsById));

export const selectCartCount = createSelector(selectCartItems, (items) =>
  items.reduce((count, item) => count + item.quantity, 0),
);

export const selectCartTotals = createSelector(selectCartItems, calculateCartTotals);

export const selectQuantityInCart = (state, id) => state.cart.itemsById[id]?.quantity ?? 0;
