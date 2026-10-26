import { SelectField, TextField } from '../../components/ui';

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'experience', label: 'Most experienced' },
  { value: 'fee_asc', label: 'Fee: low to high' },
  { value: 'fee_desc', label: 'Fee: high to low' },
];

function toOptions(values = []) {
  return values.map((value) => ({ value, label: value }));
}

export function DoctorFilters({ searchText, onSearchTextChange, filters, onFilterChange, filterOptions }) {
  return (
    <form className="filters card" role="search" onSubmit={(event) => event.preventDefault()}>
      <TextField
        label="Search"
        type="search"
        placeholder="Doctor name or speciality"
        value={searchText}
        onChange={(event) => onSearchTextChange(event.target.value)}
      />
      <SelectField
        label="Speciality"
        placeholder="All specialities"
        options={toOptions(filterOptions?.specialities)}
        value={filters.speciality}
        onChange={(event) => onFilterChange('speciality', event.target.value)}
      />
      <SelectField
        label="City"
        placeholder="All cities"
        options={toOptions(filterOptions?.cities)}
        value={filters.city}
        onChange={(event) => onFilterChange('city', event.target.value)}
      />
      <SelectField
        label="Sort by"
        options={SORT_OPTIONS}
        value={filters.sort}
        onChange={(event) => onFilterChange('sort', event.target.value)}
      />
    </form>
  );
}
