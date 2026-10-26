import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { generateDoctors, LAB_TESTS, MEDICINES } from './seed.js';

// A tiny in-memory database. Catalogue data is regenerated from the seed;
// only what users create (accounts, bookings, orders) is written to disk.
// Swapping this for Postgres or Mongo later only touches this file.

function emptyUserData() {
  return { users: [], consultations: [], labBookings: [], orders: [] };
}

function readUserData(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return emptyUserData();
  try {
    return { ...emptyUserData(), ...JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch (error) {
    console.warn(`Could not read ${filePath}, starting with empty data: ${error.message}`);
    return emptyUserData();
  }
}

export function createStore({ filePath } = {}) {
  const userData = readUserData(filePath);

  const catalogue = {
    doctors: generateDoctors(),
    labTests: LAB_TESTS,
    medicines: MEDICINES,
  };

  function persist() {
    if (!filePath) return;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    // Write to a temp file first so a crash mid-write never leaves broken JSON behind.
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(userData, null, 2));
    fs.renameSync(tempPath, filePath);
  }

  function insert(collection, record) {
    const saved = { id: randomUUID(), createdAt: new Date().toISOString(), ...record };
    userData[collection].push(saved);
    persist();
    return saved;
  }

  function update(collection, id, changes) {
    const record = userData[collection].find((item) => item.id === id);
    if (!record) return null;
    Object.assign(record, changes, { updatedAt: new Date().toISOString() });
    persist();
    return record;
  }

  return {
    ...catalogue,
    get users() { return userData.users; },
    get consultations() { return userData.consultations; },
    get labBookings() { return userData.labBookings; },
    get orders() { return userData.orders; },
    insert,
    update,
  };
}
