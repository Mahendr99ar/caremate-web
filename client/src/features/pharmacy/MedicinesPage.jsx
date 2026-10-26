import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, EmptyState, PageLoader, QuantityStepper, TextField } from '../../components/ui';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useGetMedicinesQuery } from '../../services/api';
import { getErrorMessage } from '../../utils/apiError';
import { formatPrice } from '../../utils/format';
import { MAX_QUANTITY_PER_ITEM } from '../../utils/pricing';
import { addToCart, selectCartCount, selectQuantityInCart, setQuantity } from '../cart/cartSlice';

function MedicineCard({ medicine }) {
  const dispatch = useDispatch();
  const quantity = useSelector((state) => selectQuantityInCart(state, medicine.id));

  return (
    <article className="card medicine-card">
      <div>
        <h3 className="medicine-card__name">{medicine.name}</h3>
        <p className="medicine-card__pack">{medicine.pack}</p>
        {medicine.requiresPrescription && <Badge tone="warning">Rx required</Badge>}
      </div>
      <div className="medicine-card__footer">
        <strong>{formatPrice(medicine.price)}</strong>
        {quantity === 0 ? (
          <Button size="sm" variant="secondary" onClick={() => dispatch(addToCart(medicine))}>Add</Button>
        ) : (
          <QuantityStepper
            label={medicine.name}
            value={quantity}
            max={MAX_QUANTITY_PER_ITEM}
            onChange={(next) => dispatch(setQuantity({ id: medicine.id, quantity: next }))}
          />
        )}
      </div>
    </article>
  );
}

export default function MedicinesPage() {
  useDocumentTitle('Medicines');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const { data: medicines = [], isLoading, error } = useGetMedicinesQuery(debouncedSearch);
  const cartCount = useSelector(selectCartCount);

  return (
    <>
      <header className="page-header page-header--with-action">
        <div>
          <h1>Medicines</h1>
          <p className="page-header__subtitle">Free delivery on orders above ₹499.</p>
        </div>
        {cartCount > 0 && <Link to="/cart" className="btn btn--primary btn--md">Go to cart ({cartCount})</Link>}
      </header>

      <div className="search-bar">
        <TextField
          label="Search medicines"
          type="search"
          placeholder="e.g. Paracetamol"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <Alert>{getErrorMessage(error)}</Alert>

      {isLoading ? (
        <PageLoader label="Loading medicines" />
      ) : medicines.length === 0 ? (
        <EmptyState title={`No results for "${debouncedSearch}"`} message="Check the spelling or try the generic name." />
      ) : (
        <div className="grid">
          {medicines.map((medicine) => <MedicineCard key={medicine.id} medicine={medicine} />)}
        </div>
      )}
    </>
  );
}
