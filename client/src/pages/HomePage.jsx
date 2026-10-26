import { Link } from 'react-router-dom';
import { AvailabilityBoard } from '../features/home/AvailabilityBoard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const BOOKING_STEPS = [
  { title: 'Pick a doctor', text: 'Filter 500 doctors by speciality, city, fee or rating.' },
  { title: 'Choose a time', text: 'Free slots for the next seven days, video or in clinic.' },
  { title: 'Confirm', text: 'The slot is held for you the moment you book. Cancel any time before it starts.' },
];

export default function HomePage() {
  useDocumentTitle(null);

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <h1 className="hero__title">See a doctor today, not next week.</h1>
            <p className="hero__lede">
              CareMate shows every speciality's next open slot as it changes. Pick one, and you're booked in under a minute.
            </p>
            <div className="hero__actions">
              <Link to="/doctors" className="btn btn--primary btn--lg">Find a doctor</Link>
              <Link to="/lab-tests" className="btn btn--quiet btn--lg">Book a home test</Link>
            </div>
          </div>
          <AvailabilityBoard />
        </div>
      </section>

      <section className="services container" aria-label="Other services">
        <Link to="/lab-tests" className="service service--labs">
          <h2 className="service__title">Lab tests at home</h2>
          <p className="service__text">
            A phlebotomist comes to you from 6:30 in the morning. CBC from ₹349, full body checkup from ₹1,999,
            reports online in 12 to 48 hours.
          </p>
          <span className="service__cta">Choose tests</span>
        </Link>
        <Link to="/medicines" className="service service--meds">
          <h2 className="service__title">Medicines</h2>
          <p className="service__text">Everyday medicines at your door. Free delivery above ₹499.</p>
          <span className="service__cta">Shop medicines</span>
        </Link>
      </section>

      <section className="steps container" aria-labelledby="steps-title">
        <h2 id="steps-title" className="steps__title">How booking works</h2>
        <ol className="steps__list">
          {BOOKING_STEPS.map((step) => (
            <li key={step.title} className="steps__item">
              <h3 className="steps__name">{step.title}</h3>
              <p className="steps__text">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
