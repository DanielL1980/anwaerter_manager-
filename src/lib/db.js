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
export async function getGespraechsnotiz(lehrprobeId) {
  if (!uid()) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid(), 'gespraechsnotizen', lehrprobeId));
    return snap.exists
