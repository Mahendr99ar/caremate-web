import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FixedSizeList } from 'react-window';
import { Alert, Button, EmptyState, PageLoader } from '../../components/ui';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useGetDoctorFiltersQuery, useGetDoctorsQuery } from '../../services/api';
import { getErrorMessage } from '../../utils/apiError';
import { pluralize } from '../../utils/format';
import { DoctorFilters } from './DoctorFilters';
import { DoctorRow } from './DoctorRow';

const ROW_HEIGHT = 100;
const MAX_LIST_HEIGHT = 640;
const FILTER_KEYS = ['speciality', 'city', 'sort'];

// Filters live in the URL so a search can be bookmarked, shared, or restored with Back.
function readFilters(searchParams) {
  return {
    q: searchParams.get('q') ?? '',
    speciality: searchParams.get('speciality') ?? '',
    city: searchParams.get('city') ?? '',
    sort: searchParams.get('sort') ?? 'relevance',
  };
}

function toApiParams(filters) {
  const params = { limit: 500, sort: filters.sort };
  if (filters.q) params.search = filters.q;
  if (filters.speciality) params.speciality = filters.speciality;
  if (filters.city) params.city = filters.city;
  return params;
}

// Defined outside the page on purpose. react-window renders `children` as a
// component; an inline arrow would be a new component type on every render
// and every visible row would unmount and remount.
function VirtualDoctorRow({ index, style, data }) {
  return <DoctorRow doctor={data[index]} style={style} />;
}

const doctorKey = (index, data) => data[index].id;

export default function DoctorsPage() {
  useDocumentTitle('Find a doctor');
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);

  const [searchText, setSearchText] = useState(filters.q);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);

  const updateParam = useCallback(
    (key, value) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value && !(key === 'sort' && value === 'relevance')) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Remembers the last ?q= this page wrote, to tell our own URL updates apart
  // from Back/Forward navigation.
  const lastWrittenQuery = useRef(filters.q);

  useEffect(() => {
    lastWrittenQuery.current = debouncedSearch;
    updateParam('q', debouncedSearch);
  }, [debouncedSearch, updateParam]);

  useEffect(() => {
    if (filters.q !== lastWrittenQuery.current) {
      lastWrittenQuery.current = filters.q;
      setSearchText(filters.q);
    }
  }, [filters.q]);

  const { data: filterOptions } = useGetDoctorFiltersQuery();
  const { data, error, isLoading, isFetching } = useGetDoctorsQuery(toApiParams(filters));

  function clearFilters() {
    lastWrittenQuery.current = '';
    setSearchText('');
    setSearchParams({}, { replace: true });
  }

  const doctors = data?.items ?? [];
  const hasActiveFilters = Boolean(filters.q) || FILTER_KEYS.some((key) => searchParams.has(key));

  return (
    <>
      <header className="page-header">
        <h1>Find a doctor</h1>
        <p className="page-header__subtitle">Video or in-clinic consultations with verified specialists.</p>
      </header>

      <DoctorFilters
        searchText={searchText}
        onSearchTextChange={setSearchText}
        filters={filters}
        onFilterChange={updateParam}
        filterOptions={filterOptions}
      />

      <Alert>{getErrorMessage(error)}</Alert>

      {isLoading ? (
        <PageLoader label="Loading doctors" />
      ) : (
        <section aria-labelledby="results-heading" aria-busy={isFetching}>
          <div className="results-bar">
            <h2 id="results-heading" className="results-bar__count" aria-live="polite">
              {pluralize(data?.total ?? 0, 'doctor')} found
            </h2>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
            )}
          </div>

          {doctors.length === 0 ? (
            <EmptyState title="No doctors match these filters" message="Try another city or a broader search." />
          ) : (
            // Only rows in view (plus a few extra) are in the DOM, so 500 doctors scroll smoothly.
            <FixedSizeList
              className="doctor-list"
              height={Math.min(doctors.length * ROW_HEIGHT, MAX_LIST_HEIGHT)}
              width="100%"
              itemCount={doctors.length}
              itemSize={ROW_HEIGHT}
              itemData={doctors}
              itemKey={doctorKey}
              overscanCount={4}
            >
              {VirtualDoctorRow}
            </FixedSizeList>
          )}
        </section>
      )}
    </>
  );
}
