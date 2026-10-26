import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Accessible dialog: moves focus inside, keeps Tab within it, closes on Escape,
// and puts focus back on whatever opened it.
export function Modal({ isOpen, title, onClose, children, footer }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  // The keydown listener reads the latest onClose through this ref, so the effect
  // below doesn't re-run (and steal focus) every time the parent re-renders.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    const focusables = () => [...dialog.querySelectorAll(FOCUSABLE)];
    (focusables()[0] ?? dialog).focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('no-scroll');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('no-scroll');
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close dialog">×</button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
