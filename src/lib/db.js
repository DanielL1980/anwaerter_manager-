import { openDB } from 'idb';

const DB_NAME = 'lehrprobe-db';
const DB_VERSION = 2;

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('lehrproben')) {
          const store = db.createObjectStore('lehrproben', { keyPath: 'id' });
          store.createIndex('datum', 'datum');
        }
        if (!db.objectStoreNames.contains('auswertungen')) {
          const store = db.createObjectStore('auswertungen', { keyPath: 'id' });
          store.createIndex('lehrprobeId', 'lehrprobeId');
        }
        if (!db.objectStoreNames.contains('einstellungen')) {
          db.createObjectStore('einstellungen', { keyPath: 'key' });
        }
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('gespraechsnotizen')) {
          const store = db.createObjectStore('gespraechsnotizen', { keyPath: 'id' });
          store.createIndex('lehrprobeId', 'lehrprobeId');
        }
      }
    },
  });
}

export async function getLehrproben() {
  const db = await initDB();
  return db.getAllFromIndex('lehrproben', 'datum');
}

export async function getLehrprobe(id) {
  const db = await initDB();
  return db.get('lehrproben', id);
}

export async function addLehrprobe(lehrprobe) {
  const db = await initDB();
  return db.add('lehrproben', lehrprobe);
}

export async function updateLehrprobe(lehrprobe) {
  const db = await initDB();
  return db.put('lehrproben', lehrprobe);
}

export async function deleteLehrprobe(id) {
  const db = await initDB();
  return db.delete('lehrproben', id);
}

export async function getAuswertungenForLehrprobe(lehrprobeId) {
  const db = await initDB();
  return db.getAllFromIndex('auswertungen', 'lehrprobeId', lehrprobeId);
}

export async function addAuswertung(auswertung) {
  const db = await initDB();
  return db.add('auswertungen', auswertung);
}

export async function updateAuswertung(auswertung) {
  const db = await initDB();
  return db.put('auswertungen', auswertung);
}

export async function deleteAuswertung(id) {
  const db = await initDB();
  return db.delete('auswertungen', id);
}

export async function getEinstellung(key) {
  const db = await initDB();
  const entry = await db.get('einstellungen', key);
  return entry?.value;
}

export async function setEinstellung(key, value) {
  const db = await initDB();
  return db.put('einstellungen', { key, value });
}

export async function getGesprächsnotizForLehrprobe(lehrprobeId) {
  const db = await initDB();
  const notizen = await db.getAllFromIndex('gespraechsnotizen', 'lehrprobeId', lehrprobeId);
  return notizen[0] || null;
}

export async function saveGesprächsnotiz(lehrprobeId, text) {
  const db = await initDB();
  const existing = await getGesprächsnotizForLehrprobe(lehrprobeId);
  if (existing) {
    return db.put('gespraechsnotizen', { ...existing, text, aktualisiertAm: new Date().toISOString() });
  } else {
    return db.add('gespraechsnotizen', {
      id: crypto.randomUUID(),
      lehrprobeId,
      text,
      erstelltAm: new Date().toISOString(),
      aktualisiertAm: new Date().toISOString(),
    });
  }
}
