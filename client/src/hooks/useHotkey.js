import { useEffect, useRef } from 'react';

function isTypingTarget(element) {
  return element?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName);
}

// Calls `handler` for Ctrl/⌘ + key, or for the bare key when the user isn't typing.
// Example: useHotkey('k', open, { withModifier: true }); useHotkey('/', open);
export function useHotkey(key, handler, { withModifier = false } = {}) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key.toLowerCase() !== key) return;
      const modifierHeld = event.metaKey || event.ctrlKey;
      if (withModifier ? !modifierHeld : modifierHeld || isTypingTarget(event.target)) return;
      event.preventDefault();
      handlerRef.current(event);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [key, withModifier]);
}
