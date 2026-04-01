import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPQvvKALczd3uuWxPpPx1RalTvh1A7q54",
  authDomain: "anwaerterauswertung.firebaseapp.com",
  projectId: "anwaerterauswertung",
  storageBucket: "anwaerterauswertung.firebasestorage.app",
  messagingSenderId: "744006504342",
  appId: "1:744006504342:web:37b7b87ddb2a24da0897b7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
