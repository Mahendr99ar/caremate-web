import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, ChoiceChips, PageLoader, Spinner, TextField } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  useBookLabTestsMutation,
  useGetCollectionSlotsQuery,
  useGetLabTestsQuery,
  useGetMeQuery,
} from '../../services/api';
import { getErrorMessage } from '../../utils/apiError';
import { upcomingDates } from '../../utils/dates';
import { formatDate, formatPrice, formatTime, pluralize } from '../../utils/format';

function discountPercent(test) {
  return Math.round(((test.mrp - test.price) / test.mrp) * 100);
}

function LabTestCard({ test, selected, onToggle }) {
  return (
    <label className={`card test-card ${selected ? 'test-card--selected' : ''}`}>
      <input type="checkbox" checked={selected} onChange={() => onToggle(test.id)} className="test-card__checkbox" />
      <span className="test-card__body">
        <span className="test-card__name">{test.name}</span>
        <span className="test-card__meta">
          {pluralize(test.parameters, 'parameter')}, report in {test.reportHours} hours
          {test.fasting && <Badge tone="warning">Fasting needed</Badge>}
        </span>
      </span>
      <span className="test-card__price">
        <strong>{formatPrice(test.price)}</strong>
        <s>{formatPrice(test.mrp)}</s>
        <span className="test-card__discount">{discountPercent(test)}% off</span>
      </span>
    </label>
  );
}

export default function LabTestsPage() {
  useDocumentTitle('Lab tests at home');
  const navigate = useNavigate();
  const location = useLocation();

  // Home collection starts tomorrow; samples are picked up early morning.
  const dates = useMemo(() => upcomingDates(7, { startOffset: 1 }), []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [date, setDate] = useState(dates[0]);
  const [time, setTime] = useState(null);
  const [address, setAddress] = useState('');

  const { data: user } = useGetMeQuery();
  const { data: tests = [], isLoading, error } = useGetLabTestsQuery();
  const slotsQuery = useGetCollectionSlotsQuery(date);
  const [bookTests, bookingState] = useBookLabTestsMutation();

  const selectedTests = tests.filter((test) => selectedIds.includes(test.id));
  const total = selectedTests.reduce((sum, test) => sum + test.price, 0);
  const needsFasting = selectedTests.some((test) => test.fasting);
  const canBook = selectedTests.length > 0 && time && address.trim().length >= 10;

  function toggleTest(id) {
    // Starting a new selection hides the "Booked for ..." message from last time.
    if (bookingState.isSuccess) bookingState.reset();
    setSelectedIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function changeDate(nextDate) {
    setDate(nextDate);
    setTime(null);
  }

  async function handleBook(event) {
    event.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    try {
      await bookTests({ testIds: selectedIds, date, time, address: address.trim() }).unwrap();
      setSelectedIds([]);
      setTime(null);
    } catch {
      // Shown through bookingState.error.
    }
  }

  if (isLoading) return <PageLoader label="Loading tests" />;

  return (
    <>
      <header className="page-header">
        <h1>Lab tests at home</h1>
        <p className="page-header__subtitle">A trained phlebotomist collects your sample. Reports arrive online.</p>
      </header>

      <Alert>{getErrorMessage(error)}</Alert>

      <div className="detail-layout detail-layout--wide-left">
        <section aria-labelledby="tests-heading">
          <h2 id="tests-heading" className="visually-hidden">Available tests</h2>
          <div className="stack">
            {tests.map((test) => (
              <LabTestCard key={test.id} test={test} selected={selectedIds.includes(test.id)} onToggle={toggleTest} />
            ))}
          </div>
        </section>

        <form className="card sticky-panel" onSubmit={handleBook} aria-labelledby="collection-heading">
          <h2 id="collection-heading">Home collection</h2>

          {bookingState.isSuccess && (
            <Alert tone="success">
              Booked for {formatDate(bookingState.data.date)} at {formatTime(bookingState.data.time)}.{' '}
              <Link to="/bookings?tab=labs">See booking</Link>
            </Alert>
          )}

          <ChoiceChips
            legend="Date"
            name="lab-date"
            value={date}
            onChange={changeDate}
            options={dates.map((d) => ({
              value: d,
              label: formatDate(d, { weekday: 'short' }),
              sublabel: formatDate(d, { day: 'numeric', month: 'short' }),
            }))}
          />

          {slotsQuery.isFetching ? (
            <Spinner label="Loading collection times" />
          ) : (
            <ChoiceChips
              legend="Collection time"
              name="lab-time"
              value={time}
              onChange={setTime}
              options={(slotsQuery.data ?? []).map((slot) => ({
                value: slot.time,
                label: formatTime(slot.time),
                sublabel: slot.available ? `${slot.spotsLeft} left` : 'Full',
                disabled: !slot.available,
              }))}
            />
          )}

          <TextField
            label="Collection address"
            multiline
            rows={3}
            placeholder="House no, street, area, city, PIN"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />

          {needsFasting && (
            <Alert tone="warning">One of your tests needs 10 to 12 hours of fasting. Water is fine.</Alert>
          )}
          <Alert>{getErrorMessage(bookingState.error)}</Alert>

          <div className="total-row">
            <span>{pluralize(selectedTests.length, 'test')}</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <Button type="submit" className="btn--block" disabled={!canBook} isLoading={bookingState.isLoading}>
            Book home collection
          </Button>
        </form>
      </div>
    </>
  );
}
