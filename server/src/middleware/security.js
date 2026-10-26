import { HttpError } from '../utils/httpError.js';

// A cross-site <form> can only send urlencoded, multipart or text/plain bodies.
// Insisting on JSON for writes, together with SameSite cookies, blocks CSRF
// without needing a token for this app.
export function requireJsonForWrites(req, res, next) {
  const isWrite = ['POST', 'PUT', 'PATCH'].includes(req.method);
  if (isWrite && !req.is('application/json')) {
    return next(new HttpError(415, 'Requests must be sent as application/json'));
  }
  next();
}

// Counts failed logins per email in memory. Good enough for one server;
// with several servers this counter would move to Redis.
export function createLoginLimiter({ maxAttempts = 5, windowMs = 15 * 60 * 1000 } = {}) {
  const failures = new Map();

  function keyFor(email) {
    return String(email || '').trim().toLowerCase();
  }

  function isBlocked(email, now = Date.now()) {
    const entry = failures.get(keyFor(email));
    if (!entry) return false;
    if (now - entry.firstFailureAt > windowMs) {
      failures.delete(keyFor(email));
      return false;
    }
    return entry.count >= maxAttempts;
  }

  function recordFailure(email, now = Date.now()) {
    const key = keyFor(email);
    const entry = failures.get(key);
    if (!entry || now - entry.firstFailureAt > windowMs) {
      failures.set(key, { count: 1, firstFailureAt: now });
    } else {
      entry.count += 1;
    }
  }

  function reset(email) {
    failures.delete(keyFor(email));
  }

  return { isBlocked, recordFailure, reset };
}
