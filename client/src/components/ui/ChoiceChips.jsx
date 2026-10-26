// A row of single-select buttons, used for picking a date or a time slot.
// Rendered as radio buttons so screen readers announce "1 of 7, selected".
export function ChoiceChips({ legend, name, options, value, onChange, emptyText = 'Nothing available' }) {
  return (
    <fieldset className="chips">
      <legend className="chips__legend">{legend}</legend>
      {options.length === 0 ? (
        <p className="chips__empty">{emptyText}</p>
      ) : (
        <div className="chips__list">
          {options.map((option) => (
            <label
              key={option.value}
              className={`chip ${value === option.value ? 'chip--selected' : ''} ${option.disabled ? 'chip--disabled' : ''}`}
            >
              <input
                type="radio"
                className="visually-hidden"
                name={name}
                value={option.value}
                checked={value === option.value}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
              />
              <span className="chip__label">{option.label}</span>
              {option.sublabel && <span className="chip__sublabel">{option.sublabel}</span>}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
