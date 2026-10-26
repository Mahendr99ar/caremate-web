import { configureStore } from '@reduxjs/toolkit';
import { api } from '../services/api';
import cartReducer from '../features/cart/cartSlice';

const CART_STORAGE_KEY = 'caremate.cart';

// localStorage throws in some private-browsing modes, so every access is guarded.
function loadSavedCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : undefined;
  } catch {
    return undefined;
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Cart still works for this tab; it just won't survive a refresh.
  }
}

export function setupStore(preloadedState) {
  const savedCart = loadSavedCart();
  const store = configureStore({
    reducer: {
      cart: cartReducer,
      [api.reducerPath]: api.reducer,
    },
    preloadedState: preloadedState ?? (savedCart ? { cart: savedCart } : undefined),
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });

  // subscribe() fires on every action, including every API request.
  // Comparing references means we only write when the cart itself changed.
  let lastCart = store.getState().cart;
  store.subscribe(() => {
    const { cart } = store.getState();
    if (cart !== lastCart) {
      lastCart = cart;
      saveCart(cart);
    }
  });

  return store;
}
