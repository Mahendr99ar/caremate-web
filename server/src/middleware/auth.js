import { unauthorized } from '../utils/httpError.js';

export function requireAuth(store) {
  return function checkSession(req, res, next) {
    const user = store.users.find((u) => u.id === req.session.userId);
    if (!user) {
      return next(unauthorized());
    }
    req.user = user;
    next();
  };
}

export function toPublicUser(user) {
  const { passwordHash, ...publicFields } = user;
  return publicFields;
}
