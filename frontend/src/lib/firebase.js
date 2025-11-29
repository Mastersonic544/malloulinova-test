// Frontend Firebase client initialization and auth helpers
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasAllCfg = Object.values(cfg).every((v) => typeof v === 'string' && v.length > 0);

let auth;
if (typeof window !== 'undefined' && hasAllCfg) {
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  auth = getAuth(app);
} else {
  // Safe fallbacks to avoid breaking builds when env is missing
  auth = { currentUser: null };
}

// Match the names used by existing code
const onAuthStateChanged = (authInstance, cb) => {
  if (authInstance && authInstance !== auth) {
    // Use provided instance if passed
    try { return firebaseOnAuthStateChanged(authInstance, cb); } catch {}
  }
  if (hasAllCfg && auth && typeof firebaseOnAuthStateChanged === 'function') {
    return firebaseOnAuthStateChanged(auth, cb);
  }
  // No-op fallback
  if (typeof cb === 'function') cb(null);
  return () => {};
};

const signInUser = (email, password) => {
  if (hasAllCfg && auth && auth.currentUser !== undefined) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  return Promise.reject(new Error('Auth not configured'));
};

const createUser = (email, password) => {
  if (hasAllCfg && auth && auth.currentUser !== undefined) {
    return createUserWithEmailAndPassword(auth, email, password);
  }
  return Promise.reject(new Error('Auth not configured'));
};

const signOutUser = () => {
  if (hasAllCfg && auth && auth.currentUser !== undefined) {
    return firebaseSignOut(auth);
  }
  return Promise.resolve();
};

export { auth, onAuthStateChanged, signInUser, createUser, signOutUser };
