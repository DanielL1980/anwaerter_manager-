import {
  collection, doc, getDoc, getDocs,
  query, where, setDoc, serverTimestamp, orderBy, deleteDoc, updateDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

const uid = () => auth.currentUser?.uid;

// =================== AUSWERTUNGSEINTRAEGE ===================
export async function getAuswertungseintraege() {
  if (!uid()) return [];
  try {
    const q = query(
      collection(db, 'users', uid(), 'lehrproben'),
      orderBy('datum', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

export async function getAuswertungseintrag(id) {
  if (!uid()) return null;
  const snap = await getDoc(doc(db, 'users', uid(), 'lehrproben', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addAuswertungseintrag(data) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const { id, ...rest } = data;
  await setDoc(doc(db, 'users', uid(), 'lehrproben', id), {
    ...rest,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function updateAuswertungseintrag(data) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const { id, ...rest } = data;
  await setDoc(doc(db, 'users', uid(), 'lehrproben', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteAuswertungseintrag(id) {
  if (!uid()) throw new Error('Nicht angemeldet');
  await deleteDoc(doc(db, 'users', uid(), 'lehrproben', id));
  // Zugehörige Auswertungen ebenfalls löschen
  const q = query(
    collection(db, 'users', uid(), 'auswertungen'),
    where('lehrprobeId', '==', id)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) await deleteDoc(d.ref);
}

// =================== AUSWERTUNGEN ===================
export async function getAuswertungenFuerEintrag(eintragId) {
  if (!uid()) return [];
  const q = query(
    collection(db, 'users', uid(), 'auswertungen'),
    where('lehrprobeId', '==', eintragId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addAuswertung(data) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const { id, ...rest } = data;
  await setDoc(doc(db, 'users', uid(), 'auswertungen', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
  return id;
}

export async function updateAuswertung(data) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const { id, ...rest } = data;
  if (!id) return;
  await setDoc(doc(db, 'users', uid(), 'auswertungen', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveAuswertung(data) {
  if (data.id) return updateAuswertung(data);
  return addAuswertung(data);
}

// =================== EINSTELLUNGEN ===================
export async function getEinstellung(key) {
  if (!uid()) return localStorage.getItem(`einstellung_${key}`);
  try {
    const snap = await getDoc(doc(db, 'users', uid(), 'einstellungen', key));
    return snap.exists() ? snap.data().value : null;
  } catch {
    return null;
  }
}

export async function setEinstellung(key, value) {
  if (!uid()) {
    localStorage.setItem(`einstellung_${key}`, value);
    return;
  }
  await setDoc(doc(db, 'users', uid(), 'einstellungen', key), { value });
}

// =================== GESPRÄCHSNOTIZEN ===================
export async function getGespraechsnotiz(eintragId) {
  if (!uid()) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid(), 'gespraechsnotizen', eintragId));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export async function saveGespraechsnotiz(eintragId, daten) {
  if (!uid()) return;
  await setDoc(doc(db, 'users', uid(), 'gespraechsnotizen', eintragId), {
    tastaturText: daten.tastaturText || '',
    stiftData: daten.stiftData || null,
    updatedAt: serverTimestamp(),
  });
}

// Alias für Abwärtskompatibilität
export async function getGespraechsnotizFuerEintrag(eintragId) {
  return getGespraechsnotiz(eintragId);
}

export async function setGespraechsnotiz(eintragId, daten) {
  return saveGespraechsnotiz(eintragId, daten);
}

// =================== BACKUP ===================
export async function exportiereAllesDaten() {
  if (!uid()) return null;
  const eintraege = await getAuswertungseintraege();
  const auswertungen = [];
  for (const e of eintraege) {
    const a = await getAuswertungenFuerEintrag(e.id);
    auswertungen.push(...a);
  }
  // Schlüssel "lehrproben" beibehalten (JSON-Datenschema unveränderlich)
  return { lehrproben: eintraege, auswertungen, exportDatum: new Date().toISOString() };
}

export async function importiereDaten(data) {
  if (!uid()) throw new Error('Nicht angemeldet');
  // Schlüssel "lehrproben" aus JSON-Datenschema
  const { lehrproben = [], auswertungen = [] } = data;
  for (const lp of lehrproben) {
    const { id, ...rest } = lp;
    await setDoc(doc(db, 'users', uid(), 'lehrproben', id), rest);
  }
  for (const a of auswertungen) {
    const { id, ...rest } = a;
    await setDoc(doc(db, 'users', uid(), 'auswertungen', id), rest);
  }
}

// =================== TEILEN (Einzelne Auswertung) ===================
export async function erstelleEinladungslink(eintragId) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const token = crypto.randomUUID();
  const ablauf = new Date();
  ablauf.setDate(ablauf.getDate() + 7);
  await setDoc(doc(db, 'einladungen', token), {
    ownerId: uid(),
    lehrprobeId: eintragId,
    ablauf: ablauf.toISOString(),
    createdAt: serverTimestamp(),
  });
  return `${window.location.origin}/invite/${token}`;
}

export async function getEinladung(token) {
  const snap = await getDoc(doc(db, 'einladungen', token));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (new Date(data.ablauf) < new Date()) return null;
  return data;
}

export async function nimmEinladungAn(token) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const einladung = await getEinladung(token);
  if (!einladung) throw new Error('Einladung ungültig oder abgelaufen');
  await setDoc(doc(db, 'geteilte_zugaenge', `${uid()}_${einladung.lehrprobeId}`), {
    userId: uid(),
    ownerId: einladung.ownerId,
    lehrprobeId: einladung.lehrprobeId,
    access: 'write',
    createdAt: serverTimestamp(),
  });
}

export async function getGeteilteAnwaerter() {
  if (!uid()) return [];
  const q = query(
    collection(db, 'geteilte_zugaenge'),
    where('userId', '==', uid())
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// =================== ORDNER TEILEN (ganzer Anwärter) ===================
export async function erstelleOrdnerEinladung(anwaerterId, anwaerterName, zugriff = 'schreiben') {
  if (!uid()) throw new Error('Nicht angemeldet');
  const token = crypto.randomUUID();
  const ablauf = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await setDoc(doc(db, 'ordner_einladungen', token), {
    ownerId: uid(),
    anwaerterId,
    anwaerterName,
    zugriff,
    ablauf,
    createdAt: serverTimestamp(),
  });
  return `${window.location.origin}/ordner-invite/${token}`;
}

export async function getOrdnerZugaenge(anwaerterId) {
  if (!uid()) return [];
  const q = query(
    collection(db, 'ordner_zugaenge'),
    where('ownerId', '==', uid()),
    where('anwaerterId', '==', anwaerterId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateOrdnerZugang(zugangId, zugriff) {
  await updateDoc(doc(db, 'ordner_zugaenge', zugangId), { zugriff });
}

export async function deleteOrdnerZugang(zugangId) {
  await deleteDoc(doc(db, 'ordner_zugaenge', zugangId));
}

export async function loesOrdnerEinladungEin(token) {
  const snap = await getDoc(doc(db, 'ordner_einladungen', token));
  if (!snap.exists()) throw new Error('Einladung nicht gefunden');
  const data = snap.data();
  if (new Date(data.ablauf) < new Date()) throw new Error('Einladung abgelaufen');
  if (!uid()) throw new Error('Nicht angemeldet');
  await setDoc(doc(db, 'ordner_zugaenge', crypto.randomUUID()), {
    ownerId: data.ownerId,
    gastId: uid(),
    anwaerterId: data.anwaerterId,
    anwaerterName: data.anwaerterName,
    zugriff: data.zugriff,
    createdAt: serverTimestamp(),
  });
}
