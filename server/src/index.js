import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createStore } from './data/store.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 4000;

const sessionSecret = process.env.SESSION_SECRET || (isProduction ? null : 'dev-only-secret-change-me');
if (!sessionSecret) {
  console.error('SESSION_SECRET must be set in production.');
  process.exit(1);
}

const store = createStore({ filePath: path.join(currentDir, '..', 'data', 'db.json') });
const app = createApp({
  store,
  sessionSecret,
  isProduction,
  clientDistPath: path.join(currentDir, '..', '..', 'client', 'dist'),
});

app.listen(port, () => {
  console.log(`CareMate API running on http://localhost:${port}`);
});
