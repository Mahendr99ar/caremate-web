import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Badge, Button, EmptyState, Modal, PageLoader } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useSignedInQueryOptions } from '../../hooks/useSignedInQueryOptions';
import {
  useCancelConsultationMutation,
  useCancelLabBookingMutation,
  useCancelOrderMutation,
  useGetConsultationsQuery,
  useGetLabBookingsQuery,
  useGetOrdersQuery,
} from '../../services/api';
import { getErrorMessage } from '../../utils/apiError';
import { isBeforeToday } from '../../utils/dates';
import { formatDate, formatPrice, formatTime, pluralize } from '../../utils/format';

const TABS = [
  { id: 'consultations', label: 'Consultations' },
  { id: 'labs', label: 'Lab tests' },
  { id: 'orders', label: 'Orders' },
];

const STATUSES = {
  confirmed: { label: 'Confirmed', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'success' },
  placed: { label: 'Placed', tone: 'info' },
  awaiting_prescription: { label: 'Needs prescription', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

function StatusBadge({ status }) {
  const { label, tone } = STATUSES[status] ?? { label: status, tone: 'neutral' };
  return <Badge tone={tone}>{label}</Badge>;
}

// One confirm dialog for all three lists. `pending` holds what we're about to cancel.
function useCancelConfirmation() {
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const [isWorking, setIsWorking] = useState(false);

  function ask(description, cancel) {
    setError(null);
    setPending({ description, cancel });
  }

  async function confirm() {
    setIsWorking(true);
    try {
      await pending.cancel().unwrap();
      setPending(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsWorking(false);
    }
  }

  const dialog = (
    <Modal
      isOpen={Boolean(pending)}
      title="Cancel this booking?"
      onClose={() => setPending(null)}
      footer={
        <>
          <Button variant="ghost" onClick={() => setPending(null)}>Keep it</Button>
          <Button variant="danger" onClick={confirm} isLoading={isWorking}>Yes, cancel</Button>
        </>
      }
    >
      <p>{pending?.description}</p>
      <Alert>{error}</Alert>
    </Modal>
  );

  return { ask, dialog };
}

function ListState({ query, emptyTitle, children }) {
  if (query.isLoading || query.isUninitialized) return <PageLoader />;
  if (query.error) return <Alert>{getErrorMessage(query.error)}</Alert>;
  if (!query.data?.length) return <EmptyState title={emptyTitle} />;
  return <ul className="booking-list">{children(query.data)}</ul>;
}

function ConsultationsList({ onCancel }) {
  const query = useGetConsultationsQuery(undefined, useSignedInQueryOptions());
  const [cancel] = useCancelConsultationMutation();

  return (
    <ListState query={query} emptyTitle="No consultations yet">
      {(items) => items.map((c) => {
        const canCancel = c.status === 'confirmed' && !isBeforeToday(c.date);
        return (
          <li key={c.id} className="card booking-item">
            <div>
              <p className="booking-item__title">{c.doctor?.name ?? 'Doctor'}</p>
              <p className="booking-item__meta">
                {c.mode === 'video' ? 'Video call' : 'Clinic visit'} with {c.doctor?.speciality ?? 'doctor'} on {formatDate(c.date)} at {formatTime(c.time)}
              </p>
            </div>
            <div className="booking-item__side">
              <StatusBadge status={c.status} />
              {canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(`${c.doctor?.name} on ${formatDate(c.date)} at ${formatTime(c.time)}`, () => cancel(c.id))}
                >
                  Cancel
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ListState>
  );
}

function LabBookingsList({ onCancel }) {
  const query = useGetLabBookingsQuery(undefined, useSignedInQueryOptions());
  const [cancel] = useCancelLabBookingMutation();

  return (
    <ListState query={query} emptyTitle="No lab tests booked">
      {(items) => items.map((b) => (
        <li key={b.id} className="card booking-item">
          <div>
            <p className="booking-item__title">{b.tests.map((t) => t.name).join(', ')}</p>
            <p className="booking-item__meta">
              Home collection on {formatDate(b.date)} at {formatTime(b.time)}, {formatPrice(b.total)}
            </p>
          </div>
          <div className="booking-item__side">
            <StatusBadge status={b.status} />
            {b.status === 'scheduled' && (
              <Button variant="ghost" size="sm" onClick={() => onCancel(`Sample collection on ${formatDate(b.date)}`, () => cancel(b.id))}>
                Cancel
              </Button>
            )}
          </div>
        </li>
      ))}
    </ListState>
  );
}

function OrdersList({ onCancel }) {
  const query = useGetOrdersQuery(undefined, useSignedInQueryOptions());
  const [cancel] = useCancelOrderMutation();

  return (
    <ListState query={query} emptyTitle="No medicine orders yet">
      {(items) => items.map((o) => (
        <li key={o.id} className="card booking-item">
          <div>
            <p className="booking-item__title">
              {pluralize(o.items.reduce((n, line) => n + line.quantity, 0), 'item')}, {formatPrice(o.total)}
            </p>
            <p className="booking-item__meta">
              {o.items.map((line) => line.name).join(', ')}. Ordered {formatDate(o.createdAt.slice(0, 10))}
            </p>
          </div>
          <div className="booking-item__side">
            <StatusBadge status={o.status} />
            {['placed', 'awaiting_prescription'].includes(o.status) && (
              <Button variant="ghost" size="sm" onClick={() => onCancel(`Order of ${formatPrice(o.total)}`, () => cancel(o.id))}>
                Cancel
              </Button>
            )}
          </div>
        </li>
      ))}
    </ListState>
  );
}

const PANELS = {
  consultations: ConsultationsList,
  labs: LabBookingsList,
  orders: OrdersList,
};

export default function BookingsPage() {
  useDocumentTitle('My bookings');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = PANELS[searchParams.get('tab')] ? searchParams.get('tab') : 'consultations';
  const { ask, dialog } = useCancelConfirmation();
  const tabRefs = useRef({});

  function selectTab(id) {
    setSearchParams({ tab: id }, { replace: true });
  }

  // Arrow keys move between tabs, as the WAI-ARIA tabs pattern expects.
  function handleTabKeyDown(event) {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const next = TABS[(index + step + TABS.length) % TABS.length];
    selectTab(next.id);
    tabRefs.current[next.id]?.focus();
  }

  const ActivePanel = PANELS[activeTab];

  return (
    <>
      <header className="page-header">
        <h1>My bookings</h1>
      </header>

      <div className="tabs" role="tablist" aria-label="Booking type" onKeyDown={handleTabKeyDown}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(element) => { tabRefs.current[tab.id] = element; }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className="tabs__tab"
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="tabs__panel">
        <ActivePanel onCancel={ask} />
      </div>

      {dialog}
    </>
  );
}
