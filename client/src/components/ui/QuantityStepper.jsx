export function QuantityStepper({ value, min = 0, max, onChange, label }) {
  return (
    <div className="stepper" role="group" aria-label={`Quantity for ${label}`}>
      <button
        type="button"
        className="stepper__button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <span className="stepper__value" aria-live="polite">{value}</span>
      <button
        type="button"
        className="stepper__button"
        onClick={() => onChange(value + 1)}
        disabled={max !== undefined && value >= max}
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
}
