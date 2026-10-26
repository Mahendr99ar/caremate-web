import { memo } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatRating } from '../../utils/format';

function initials(name) {
  return name
    .replace(/^Dr\.\s*/, '')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
}

// memo: while scrolling, react-window re-renders the list often; rows whose
// props didn't change are skipped.
export const DoctorRow = memo(function DoctorRow({ doctor, style }) {
  return (
    <div style={style} className="doctor-row">
      <div className="avatar" aria-hidden="true">{initials(doctor.name)}</div>
      <div className="doctor-row__info">
        <h3 className="doctor-row__name">{doctor.name}</h3>
        <p className="doctor-row__meta">
          {doctor.speciality}, {doctor.experienceYears} years, {doctor.city}
        </p>
        <p className="doctor-row__meta doctor-row__meta--muted">
          <span className="rating" aria-label={`Rated ${doctor.rating} out of 5`}>★ {formatRating(doctor.rating)}</span>
          {' '}Speaks {doctor.languages.join(', ')}
        </p>
      </div>
      <div className="doctor-row__action">
        <span className="doctor-row__fee">{formatPrice(doctor.fee)}</span>
        <Link to={`/doctors/${doctor.id}`} className="btn btn--primary btn--sm" aria-label={`Book ${doctor.name}`}>
          Book
        </Link>
      </div>
    </div>
  );
});
