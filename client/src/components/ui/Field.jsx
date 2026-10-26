import { useId } from 'react';

// Wraps any input with a label, hint and error, wired up with the right aria attributes.
function FieldShell({ label, hint, error, id, children }) {
  return (
    <div className={`field ${error ? 'field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field__error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

function describedBy(id, hint, error) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextField({ label, hint, error, multiline = false, ...inputProps }) {
  const id = useId();
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <Tag
        id={id}
        className="field__control"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...inputProps}
      />
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, options, placeholder, ...selectProps }) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <select
        id={id}
        className="field__control"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...selectProps}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </FieldShell>
  );
}
