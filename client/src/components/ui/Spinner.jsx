export function Spinner({ size = 'md', label = 'Loading' }) {
  return (
    <span className={`spinner spinner--${size}`} role={label ? 'status' : undefined}>
      {label && <span className="visually-hidden">{label}</span>}
    </span>
  );
}

export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="page-loader">
      <Spinner label={label} />
    </div>
  );
}
