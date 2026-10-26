export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function Alert({ tone = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {message && <p className="empty-state__message">{message}</p>}
      {action}
    </div>
  );
}
