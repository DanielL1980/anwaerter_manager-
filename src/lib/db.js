import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, setDoc, serverTimestamp, orderBy
} from 'firebase/firestore';
import { db, auth } from './firebase';

const uid = () => auth.currentUser?.uid;

// =================== LEHRPROBEN ===================

export async function getLehrproben() {
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

export async function getLehrprobe(id) {
  if (!uid()) return null;
  const snap = await getDoc(doc(db, 'users', uid(), 'lehrproben', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addLehrprobe(data) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const { id, ...rest } = data;
  await setDoc(doc(db, 'users', uid(), 'lehrproben', id), {
    ...rest,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function updateLehrprobe(data) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const { id, ...rest } = data;
  await setDoc(doc(db, 'users', uid(), 'lehrproben', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteLehrprobe(id) {
  if (!uid()) throw new Error('Nicht angemeldet');
  await deleteDoc(doc(db, 'users', uid(), 'lehrproben', id));
  const q = query(
    collection(db, 'users', uid(), 'auswertungen'),
    where('lehrprobeId', '==', id)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) await deleteDoc(d.ref);
}

// =================== AUSWERTUNGEN ===================

export async function getAuswertungenForLehrprobe(lehrprobeId) {
  if (!uid()) return [];
  const q = query(
    collection(db, 'users', uid(), 'auswertungen'),
    where('lehrprobeId', '==', lehrprobeId)
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

export async function getGespraechsnotiz(lehrprobeId) {
  if (!uid()) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid(), 'gespraechsnotizen', lehrprobeId));
    return snap.exists() ? snap.data().text : null;
  } catch {
    return null;
  }
}

export async function setGespraechsnotiz(lehrprobeId, text) {
  if (!uid()) return;
  await setDoc(doc(db, 'users', uid(), 'gespraechsnotizen', lehrprobeId), { text });
}

// Aliase für Abwärtskompatibilität
export const getGespraechsnotizForLehrprobe = getGespraechsnotiz;
export const saveGespraechsnotiz = setGespraechsnotiz;

// =================== BACKUP ===================

export async function exportiereAllesDaten() {
  if (!uid()) return null;
  const lehrproben = await getLehrproben();
  const auswertungen = [];
  for (const lp of lehrproben) {
    const a = await getAuswertungenForLehrprobe(lp.id);
    auswertungen.push(...a);
  }
  return { lehrproben, auswertungen, exportDatum: new Date().toISOString() };
}

export async function importiereDaten(data) {
  if (!uid()) throw new Error('Nicht angemeldet');
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

// =================== TEILEN ===================

export async function erstelleEinladungslink(lehrprobeId) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const token = crypto.randomUUID();
  const ablauf = new Date();
  ablauf.setDate(ablauf.getDate() + 7);
  await setDoc(doc(db, 'einladungen', token), {
    ownerId: uid(),
    lehrprobeId,
    ablauf: ablauf.toISOString(),
    createdAt: serverTimestamp(),
  });
  return `${window.location.origin}/anwaerter_manager-/invite/${token}`;
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
