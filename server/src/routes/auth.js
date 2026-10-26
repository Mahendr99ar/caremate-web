import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { toPublicUser } from '../middleware/auth.js';
import { createLoginLimiter } from '../middleware/security.js';
import { badRequest, conflict, HttpError, unauthorized } from '../utils/httpError.js';
import { isValidEmail, requireFields } from '../utils/validate.js';

const MIN_PASSWORD_LENGTH = 8;

// express-session still uses callbacks; these wrappers let the routes use await.
function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

// A fresh session id on login stops session fixation attacks.
async function startSession(req, user) {
  await regenerateSession(req);
  req.session.userId = user.id;
}

export function authRouter(store) {
  const router = Router();
  const loginLimiter = createLoginLimiter();

  router.post('/register', async (req, res) => {
    requireFields(req.body, ['name', 'email', 'password']);
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    if (!isValidEmail(email)) throw badRequest('Please enter a valid email address');
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (store.users.some((u) => u.email === email)) {
      throw conflict('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = store.insert('users', { name, email, passwordHash });

    await startSession(req, user);
    res.status(201).json({ user: toPublicUser(user) });
  });

  router.post('/login', async (req, res) => {
    requireFields(req.body, ['email', 'password']);
    const email = req.body.email.trim().toLowerCase();

    if (loginLimiter.isBlocked(email)) {
      throw new HttpError(429, 'Too many failed attempts. Try again in 15 minutes.');
    }

    const user = store.users.find((u) => u.email === email);
    const passwordMatches = user && (await bcrypt.compare(req.body.password, user.passwordHash));

    if (!passwordMatches) {
      loginLimiter.recordFailure(email);
      // Same message for both cases so nobody can probe which emails are registered.
      throw unauthorized('Email or password is incorrect');
    }

    loginLimiter.reset(email);
    await startSession(req, user);
    res.json({ user: toPublicUser(user) });
  });

  router.post('/logout', async (req, res) => {
    await destroySession(req);
    res.clearCookie('caremate.sid');
    res.status(204).end();
  });

  // "Not logged in" is a normal answer here, not an error. Returning 200 with
  // null keeps logged-out visitors from logging a 401 on every page.
  router.get('/me', (req, res) => {
    const user = store.users.find((u) => u.id === req.session.userId);
    res.json({ user: user ? toPublicUser(user) : null });
  });

  return router;
}
