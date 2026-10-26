import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, ChoiceChips, EmptyState, PageLoader, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useGetDoctorQuery, useGetDoctorSlotsQuery, useGetMeQuery } from '../../services/api';
import { getErrorMessage } from '../../utils/apiError';
import { upcomingDates } from '../../utils/dates';
import { formatDate, formatPrice, formatRating, formatTime } from '../../utils/format';
import { BookingDialog } from './BookingDialog';

const DAYS_SHOWN = 7;

export default function DoctorDetailPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const dates = useMemo(() => upcomingDates(DAYS_SHOWN), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: user } = useGetMeQuery();
  const { data: doctor, error, isLoading } = useGetDoctorQuery(doctorId);
  const slotsQuery = useGetDoctorSlotsQuery({ doctorId, date: selectedDate }, { skip: !doctor });

  useDocumentTitle(doctor?.name ?? 'Doctor');

  if (isLoading) return <PageLoader label="Loading doctor" />;
  if (error) {
    return (
      <EmptyState
        title={error.status === 404 ? 'Doctor not found' : 'Could not load this doctor'}
        message={getErrorMessage(error)}
        action={<Link to="/doctors" className="btn btn--primary btn--md">Back to doctors</Link>}
      />
    );
  }

  const slots = slotsQuery.data ?? [];
  const openSlots = slots.filter((slot) => slot.available).length;

  function selectDate(date) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  function startBooking() {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setDialogOpen(true);
  }

  function finishBooking() {
    setDialogOpen(false);
    setSelectedTime(null);
  }

  return (
    <div className="detail-layout">
      <section className="card doctor-profile">
        <Link to="/doctors" className="back-link">All doctors</Link>
        <h1>{doctor.name}</h1>
        <p className="doctor-profile__speciality">{doctor.speciality}</p>
        <div className="doctor-profile__badges">
          <Badge tone="info">{doctor.experienceYears} years experience</Badge>
          <Badge tone="success">★ {formatRating(doctor.rating)}</Badge>
          <Badge>{doctor.city}</Badge>
        </div>
        <dl className="summary-list">
          <div><dt>Consultation fee</dt><dd>{formatPrice(doctor.fee)}</dd></div>
          <div><dt>Languages</dt><dd>{doctor.languages.join(', ')}</dd></div>
          <div><dt>Hours</dt><dd>{formatTime(doctor.schedule.start)} to {formatTime(doctor.schedule.end)}</dd></div>
        </dl>
      </section>

      <section className="card" aria-labelledby="slot-heading">
        <h2 id="slot-heading">Pick a time</h2>

        <ChoiceChips
          legend="Date"
          name="date"
          value={selectedDate}
          onChange={selectDate}
          options={dates.map((date, index) => ({
            value: date,
            label: index === 0 ? 'Today' : formatDate(date, { weekday: 'short' }),
            sublabel: formatDate(date, { day: 'numeric', month: 'short' }),
          }))}
        />

        {slotsQuery.isFetching ? (
          <Spinner label="Loading slots" />
        ) : (
          <>
            <Alert>{getErrorMessage(slotsQuery.error)}</Alert>
            <ChoiceChips
              legend={`Available slots (${openSlots})`}
              name="time"
              value={selectedTime}
              onChange={setSelectedTime}
              emptyText="No slots left on this day. Try another date."
              options={slots.map((slot) => ({
                value: slot.time,
                label: formatTime(slot.time),
                disabled: !slot.available,
              }))}
            />
          </>
        )}

        <Button className="btn--block" disabled={!selectedTime} onClick={startBooking}>
          {selectedTime ? `Book ${formatTime(selectedTime)}` : 'Select a slot'}
        </Button>
      </section>

      {dialogOpen && (
        <BookingDialog doctor={doctor} date={selectedDate} time={selectedTime} onClose={finishBooking} />
      )}
    </div>
  );
}
