import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Modal, TextField } from '../../components/ui';
import { useBookConsultationMutation } from '../../services/api';
import { getErrorMessage } from '../../utils/apiError';
import { formatDate, formatPrice, formatTime } from '../../utils/format';

const MODES = [
  { value: 'video', label: 'Video call' },
  { value: 'clinic', label: 'Visit clinic' },
];

export function BookingDialog({ doctor, date, time, onClose }) {
  const [mode, setMode] = useState('video');
  const [reason, setReason] = useState('');
  const [book, { data: booked, error, isLoading, reset }] = useBookConsultationMutation();

  async function confirm() {
    try {
      await book({ doctorId: doctor.id, date, time, mode, reason }).unwrap();
    } catch {
      // Shown through `error`.
    }
  }

  function close() {
    reset();
    onClose();
  }

  if (booked) {
    return (
      <Modal
        isOpen
        title="Consultation booked"
        onClose={close}
        footer={
          <>
            <Button variant="ghost" onClick={close}>Done</Button>
            <Link to="/bookings" className="btn btn--primary btn--md">View my bookings</Link>
          </>
        }
      >
        <p>
          You're booked with <strong>{doctor.name}</strong> on {formatDate(booked.date)} at {formatTime(booked.time)}.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      title="Confirm your booking"
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={confirm} isLoading={isLoading}>Pay {formatPrice(doctor.fee)} &amp; book</Button>
        </>
      }
    >
      <dl className="summary-list">
        <div><dt>Doctor</dt><dd>{doctor.name}</dd></div>
        <div><dt>When</dt><dd>{formatDate(date)}, {formatTime(time)}</dd></div>
      </dl>

      <fieldset className="segmented">
        <legend className="field__label">Consultation type</legend>
        {MODES.map((option) => (
          <label key={option.value} className={`segmented__option ${mode === option.value ? 'segmented__option--active' : ''}`}>
            <input
              type="radio"
              name="mode"
              className="visually-hidden"
              value={option.value}
              checked={mode === option.value}
              onChange={() => setMode(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <TextField
        label="Reason for visit (optional)"
        multiline
        rows={3}
        maxLength={300}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />

      <Alert>{getErrorMessage(error)}</Alert>
    </Modal>
  );
}
