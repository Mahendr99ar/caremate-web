import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, EmptyState, QuantityStepper, TextField } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useGetMeQuery, usePlaceOrderMutation } from '../../services/api';
import { getErrorDetails, getErrorMessage } from '../../utils/apiError';
import { formatPrice } from '../../utils/format';
import { MAX_QUANTITY_PER_ITEM } from '../../utils/pricing';
import { clearCart, removeFromCart, selectCartItems, selectCartTotals, setQuantity } from './cartSlice';

function CartLine({ item }) {
  const dispatch = useDispatch();
  return (
    <li className="cart-line">
      <div className="cart-line__info">
        <p className="cart-line__name">{item.name}</p>
        <p className="cart-line__pack">
          {item.pack} {item.requiresPrescription && <Badge tone="warning">Rx</Badge>}
        </p>
      </div>
      <QuantityStepper
        label={item.name}
        value={item.quantity}
        max={MAX_QUANTITY_PER_ITEM}
        onChange={(quantity) => dispatch(setQuantity({ id: item.id, quantity }))}
      />
      <span className="cart-line__total">{formatPrice(item.price * item.quantity)}</span>
      <Button variant="ghost" size="sm" onClick={() => dispatch(removeFromCart(item.id))} aria-label={`Remove ${item.name}`}>
        Remove
      </Button>
    </li>
  );
}

export default function CartPage() {
  useDocumentTitle('Your cart');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const items = useSelector(selectCartItems);
  const totals = useSelector(selectCartTotals);
  const { data: user } = useGetMeQuery();
  const [placeOrder, { data: order, error, isLoading }] = usePlaceOrderMutation();
  const [address, setAddress] = useState('');

  const needsPrescription = items.some((item) => item.requiresPrescription);
  const errorDetails = getErrorDetails(error);

  async function handleCheckout(event) {
    event.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    try {
      await placeOrder({
        items: items.map(({ id, quantity }) => ({ medicineId: id, quantity })),
        address: address.trim(),
      }).unwrap();
      dispatch(clearCart());
    } catch {
      // Shown through `error`.
    }
  }

  if (order) {
    return (
      <EmptyState
        title="Order placed"
        message={`We've received your order for ${formatPrice(order.total)}.${
          order.status === 'awaiting_prescription' ? ' A pharmacist will call you to verify your prescription.' : ''
        }`}
        action={<Link to="/bookings?tab=orders" className="btn btn--primary btn--md">Track order</Link>}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Add medicines and they'll show up here."
        action={<Link to="/medicines" className="btn btn--primary btn--md">Browse medicines</Link>}
      />
    );
  }

  return (
    <>
      <header className="page-header">
        <h1>Your cart</h1>
      </header>

      <div className="detail-layout detail-layout--wide-left">
        <section className="card" aria-label="Cart items">
          <ul className="cart-lines">
            {items.map((item) => <CartLine key={item.id} item={item} />)}
          </ul>
        </section>

        <form className="card sticky-panel" onSubmit={handleCheckout} aria-labelledby="summary-heading">
          <h2 id="summary-heading">Order summary</h2>
          <dl className="summary-list">
            <div><dt>Subtotal</dt><dd>{formatPrice(totals.subtotal)}</dd></div>
            <div><dt>Delivery</dt><dd>{totals.deliveryFee === 0 ? 'Free' : formatPrice(totals.deliveryFee)}</dd></div>
            <div className="summary-list__total"><dt>Total</dt><dd>{formatPrice(totals.total)}</dd></div>
          </dl>
          {totals.amountToFreeDelivery > 0 && (
            <p className="hint">Add {formatPrice(totals.amountToFreeDelivery)} more for free delivery.</p>
          )}

          <TextField
            label="Delivery address"
            multiline
            rows={3}
            placeholder="House no, street, area, city, PIN"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />

          {needsPrescription && (
            <Alert tone="warning">Some items need a valid prescription before they can be shipped.</Alert>
          )}
          {error && (
            <Alert>
              {getErrorMessage(error)}
              {errorDetails.length > 0 && (
                <ul>{errorDetails.map((detail) => <li key={detail}>{detail}</li>)}</ul>
              )}
            </Alert>
          )}

          <Button type="submit" className="btn--block" disabled={address.trim().length < 10} isLoading={isLoading}>
            Place order
          </Button>
        </form>
      </div>
    </>
  );
}
