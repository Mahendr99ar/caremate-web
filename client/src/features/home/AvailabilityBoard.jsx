import { Link } from 'react-router-dom';
import { useClinicClock } from '../../hooks/useClinicClock';
import { useGetAvailabilityBoardQuery } from '../../services/api';
import { formatPrice, formatTime } from '../../utils/format';

// Polls so the board stays honest if someone books while the page is open.
const REFRESH_MS = 60_000;

function NextSlot({ slot, today }) {
  if (!slot) return <span className="board__full">Full</span>;
  return (
    <>
      <span className="board__led board__slot">
        {slot.date !== today && <span className="board__day">Tmrw </span>}
        {formatTime(slot.time)}
      </span>
      <span className="board__doctor">{slot.doctorName}</span>
    </>
  );
}

function BoardSkeleton() {
  return Array.from({ length: 6 }, (_, index) => (
    <tr key={index} className="board__row board__row--loading" aria-hidden="true">
      <td colSpan={4}><span className="board__placeholder" /></td>
    </tr>
  ));
}

export function AvailabilityBoard() {
  const clock = useClinicClock();
  const { data, isLoading, isError, refetch } = useGetAvailabilityBoardQuery(undefined, {
    pollingInterval: REFRESH_MS,
  });

  return (
    <section className="board" aria-labelledby="board-title">
      <header className="board__header">
        <div>
          <h2 id="board-title" className="board__title">Next free slot by speciality</h2>
          <p className="board__subtitle">Updates every minute from the clinic schedule</p>
        </div>
        <p className="board__clock" aria-label={`Clinic time ${clock} IST`}>
          <span className="board__led">{clock}</span>
          <span className="board__tz">IST</span>
        </p>
      </header>

      {isError ? (
        <div className="board__error">
          <p>The schedule didn't load.</p>
          <button type="button" className="board__retry" onClick={refetch}>Try again</button>
        </div>
      ) : (
        <table className="board__table">
          <thead>
            <tr>
              <th scope="col">Speciality</th>
              <th scope="col" className="board__num">Doctors</th>
              <th scope="col">Next free</th>
              <th scope="col" className="board__num">From</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <BoardSkeleton />
            ) : (
              data.rows.map((row, index) => (
                <tr key={row.speciality} className="board__row" style={{ '--row': index }}>
                  <th scope="row">
                    {/* The link's ::after stretches over the row, so the whole row is clickable. */}
                    <Link to={`/doctors?speciality=${encodeURIComponent(row.speciality)}`} className="board__link">
                      {row.speciality}
                    </Link>
                  </th>
                  <td className="board__num">{row.doctorCount}</td>
                  <td><NextSlot slot={row.nextSlot} today={data.today} /></td>
                  <td className="board__num">{formatPrice(row.minFee)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
