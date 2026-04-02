import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  query, where, serverTimestamp, orderBy
} from 'firebase/firestore';
import { db, auth } from './firebase';

const uid = () => auth.currentUser?.uid;

// =================== BEWERBER PRÜFUNGEN ===================

export async function getBewerberpruefungen() {
  if (!uid()) return [];
  try {
    const q = query(
      collection(db, 'users', uid(), 'bewerberpruefungen'),
      orderBy('datum', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

export async function getBewerberpruefung(id) {
  if (!uid()) return null;
  const snap = await getDoc(doc(db, 'users', uid(), 'bewerberpruefungen', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addBewerberpruefung(data) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const { id, ...rest } = data;
  await setDoc(doc(db, 'users', uid(), 'bewerberpruefungen', id), {
    ...rest,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function updateBewerberpruefung(data) {
  if (!uid()) throw new Error('Nicht angemeldet');
  const { id, ...rest } = data;
  await setDoc(doc(db, 'users', uid(), 'bewerberpruefungen', id), {
    ...rest,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteBewerberpruefung(id) {
  if (!uid()) throw new Error('Nicht angemeldet');
  await deleteDoc(doc(db, 'users', uid(), 'bewerberpruefungen', id));
}

// =================== BEWERBER NOTIZEN ===================

export async function getBewerberNotiz(pruefungId) {
  if (!uid()) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid(), 'bewerbernotizen', pruefungId));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

export async function setBewerberNotiz(pruefungId, daten) {
  if (!uid()) return;
  await setDoc(doc(db, 'users', uid(), 'bewerbernotizen', pruefungId), daten);
}
