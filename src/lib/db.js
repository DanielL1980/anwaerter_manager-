import { openDB } from 'idb';

const DB_NAME = 'lehrprobe-db';
const DB_VERSION = 2;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('lehrproben', { keyPath: 'id' });
        db.createObjectStore('auswertungen', { keyPath: 'id' });
        db.createObjectStore('einstellungen', { keyPath: 'key' });
      }
      if (oldVersion < 2) {
        db.createObjectStore('gespraechsnotizen', { keyPath: 'lehrprobeId' });
      }
    },
  });
}

export async function getLehrproben() {
  const db = await getDB();
  const all = await db.getAll('lehrproben');
  return all.sort((a, b) => new Date(b.datum) - new Date(a.datum));
}

export async function getLehrprobe(id) {
  const db = await getDB();
  return db.get('lehrproben', id);
}

export async function addLehrprobe(data) {
  const db = await getDB();
  await db.put('lehrproben', data);
  return data.id;
}

export async function updateLehrprobe(data) {
  const db = await getDB();
  await db.put('lehrproben', data);
}

export async function deleteLehrprobe(id) {
  const db = await getDB();
  await db.delete('lehrproben', id);
  const all = await db.getAll('auswertungen');
  for (const a of all.filter(a => a.lehrprobeId === id)) {
    await db.delete('auswertungen', a.id);
  }
}

export async function getAuswertungenForLehrprobe(lehrprobeId) {
  const db = await getDB();
  const all = await db.getAll('auswertungen');
  return all.filter(a => a.lehrprobeId === lehrprobeId);
}

export async function addAuswertung(data) {
  const db = await getDB();
  await db.put('auswertungen', data);
  return data.id;
}

export async function updateAuswertung(data) {
  const db = await getDB();
  await db.put('auswertungen', data);
}

export async function getEinstellung(key) {
  const db = await getDB();
  const entry = await db.get('einstellungen', key);
  return entry?.value ?? null;
}

export async function setEinstellung(key, value) {
  const db = await getDB();
  await db.put('einstellungen', { key, value });
}

export async function getGespraechsnotiz(lehrprobeId) {
  const db = await getDB();
  const entry = await db.get('gespraechsnotizen', lehrprobeId);
  return entry?.text ?? null;
}

export async function setGespraechsnotiz(lehrprobeId, text) {
  const db = await getDB();
  await db.put('gespraechsnotizen', { lehrprobeId, text });
}

export async function exportiereAllesDaten() {
  const db = await getDB();
  const lehrproben = await db.getAll('lehrproben');
  const auswertungen = await db.getAll('auswertungen');
  return { lehrproben, auswertungen, exportDatum: new Date().toISOString() };
}

export async function importiereDaten(data) {
  const db = await getDB();
  const { lehrproben = [], auswertungen = [] } = data;
  for (const lp of lehrproben) await db.put('lehrproben', lp);
  for (const a of auswertungen) await db.put('auswertungen', a);
}

// Aliase für Abwärtskompatibilität
export const getLehrproben = getAllLehrproben;
export const getGespraechsnotizForLehrprobe = getGespraechsnotiz;
export const saveGespraechsnotiz = setGespraechsnotiz;
