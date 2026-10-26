import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import session from 'express-session';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { requireJsonForWrites } from './middleware/security.js';
import { authRouter } from './routes/auth.js';
import { consultationsRouter } from './routes/consultations.js';
import { doctorsRouter } from './routes/doctors.js';
import { labBookingsRouter, labTestsRouter } from './routes/labs.js';
import { medicinesRouter, ordersRouter } from './routes/pharmacy.js';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function createApp({ store, sessionSecret, isProduction = false, clientDistPath }) {
  if (!sessionSecret) throw new Error('createApp needs a sessionSecret');

  const app = express();
  const authenticated = requireAuth(store);

  if (isProduction) {
    // Behind a load balancer the app sees plain HTTP; this lets secure cookies work.
    app.set('trust proxy', 1);
  }

  app.disable('x-powered-by');
  app.use(express.json({ limit: '20kb' }));
  app.use(
    session({
      name: 'caremate.sid',
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        // 'auto' marks the cookie Secure whenever the request came over HTTPS
        // (on Render, via the proxy header), and still works on plain localhost.
        secure: 'auto',
        maxAge: ONE_WEEK_MS,
      },
    }),
  );

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api', requireJsonForWrites);
  app.use('/api/auth', authRouter(store));
  app.use('/api/doctors', doctorsRouter(store));
  app.use('/api/lab-tests', labTestsRouter(store));
  app.use('/api/medicines', medicinesRouter(store));
  app.use('/api/consultations', authenticated, consultationsRouter(store));
  app.use('/api/lab-bookings', authenticated, labBookingsRouter(store));
  app.use('/api/orders', authenticated, ordersRouter(store));

  app.use('/api', notFoundHandler);

  // In production the same server hosts the built React app, so the site and
  // API share one origin and the session cookie needs no CORS setup.
  if (clientDistPath && fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    // Hashed asset files never change, so browsers may cache them for a year.
    app.use('/assets', express.static(path.join(clientDistPath, 'assets'), { immutable: true, maxAge: '1y' }));
    app.use(express.static(clientDistPath, { index: false }));
    // Any other path is a client-side route like /doctors/doc-0001.
    app.get('/{*path}', (req, res) => res.sendFile(path.join(clientDistPath, 'index.html')));
  }

  app.use(errorHandler);

  return app;
}
