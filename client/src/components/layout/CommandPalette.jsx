import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useGetDoctorsQuery } from '../../services/api';
import { formatPrice } from '../../utils/format';

const PAGES = [
  { id: 'page-doctors', label: 'Find a doctor', hint: 'Page', to: '/doctors' },
  { id: 'page-labs', label: 'Book a lab test at home', hint: 'Page', to: '/lab-tests' },
  { id: 'page-medicines', label: 'Order medicines', hint: 'Page', to: '/medicines' },
  { id: 'page-cart', label: 'Your cart', hint: 'Page', to: '/cart' },
  { id: 'page-bookings', label: 'My bookings', hint: 'Page', to: '/bookings' },
];

const MAX_DOCTORS = 6;

function matchesPage(page, term) {
  return page.label.toLowerCase().includes(term);
}

// The list of results the palette shows for a search term: matching pages first,
// then doctors from the API. Kept separate so the component only handles UI.
function buildResults(term, doctors) {
  const pages = term ? PAGES.filter((page) => matchesPage(page, term)) : PAGES;
  const doctorResults = doctors.slice(0, MAX_DOCTORS).map((doctor) => ({
    id: doctor.id,
    label: doctor.name,
    hint: `${doctor.speciality}, ${doctor.city}, ${formatPrice(doctor.fee)}`,
    to: `/doctors/${doctor.id}`,
  }));
  return [...pages, ...doctorResults];
}

export function CommandPalette({ isOpen, onClose }) {
  if (!isOpen) return null;
  return createPortal(<PaletteDialog onClose={onClose} />, document.body);
}

// Mounted only while open, so its state starts fresh every time.
function PaletteDialog({ onClose }) {
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const term = useDebouncedValue(query.trim().toLowerCase(), 200);
  const { data, isFetching } = useGetDoctorsQuery(
    { search: term, limit: MAX_DOCTORS, sort: 'rating' },
    { skip: term.length < 2 },
  );
  const results = useMemo(() => buildResults(term, term.length < 2 ? [] : data?.items ?? []), [term, data]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    inputRef.current?.focus();
    document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
      previouslyFocused?.focus?.();
    };
  }, []);

  function updateQuery(value) {
    setQuery(value);
    setActiveIndex(0);
  }

  function go(result) {
    onClose();
    navigate(result.to);
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      go(results[activeIndex]);
    } else if (event.key === 'Tab') {
      // Only the input is focusable; options are picked with the arrow keys.
      event.preventDefault();
    }
  }

  const activeResult = results[activeIndex];
  const showNoDoctors = term.length >= 2 && !isFetching && data?.items?.length === 0;

  return (
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search CareMate" onKeyDown={handleKeyDown}>
        <div className="palette__field">
          <svg className="palette__icon" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m14 14 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="palette__input"
            placeholder="Search doctors, specialities or pages"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeResult ? `palette-${activeResult.id}` : undefined}
            aria-autocomplete="list"
          />
          <kbd className="kbd">Esc</kbd>
        </div>

        <ul id={listId} className="palette__list" role="listbox" aria-label="Results">
          {results.map((result, index) => (
            <li
              key={result.id}
              id={`palette-${result.id}`}
              role="option"
              aria-selected={index === activeIndex}
              className="palette__option"
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => go(result)}
            >
              <span className="palette__label">{result.label}</span>
              <span className="palette__hint">{result.hint}</span>
            </li>
          ))}
        </ul>

        {showNoDoctors && <p className="palette__empty">No doctor matches “{query.trim()}”.</p>}

        <footer className="palette__footer">
          <span><kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> to move</span>
          <span><kbd className="kbd">Enter</kbd> to open</span>
        </footer>
      </div>
    </div>
  );
}
