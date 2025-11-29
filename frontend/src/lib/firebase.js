// Frontend Firebase client initialization and auth helpers
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  getDatabase,
  ref as dbRef,
  onValue as dbOnValue,
  set as dbSet,
  update as dbUpdate,
  remove as dbRemove,
  serverTimestamp as dbServerTimestamp,
  push as dbPush
} from 'firebase/database';

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
let db;
if (typeof window !== 'undefined' && hasAllCfg) {
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  auth = getAuth(app);
  db = getDatabase(app);
} else {
  // Safe fallbacks to avoid breaking builds when env is missing
  auth = { currentUser: null };
  db = null;
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

// ==== Realtime Database Helpers (guarded) ====
const ref = (database, path) => {
  if (db) return dbRef(db, path);
  throw new Error('DB not configured');
};

const onValue = (reference, callback, onError) => {
  if (db && reference) return dbOnValue(reference, callback, onError);
  // No-op: invoke callback with empty object to avoid crashes
  try { if (typeof callback === 'function') callback({ val: () => null }); } catch {}
  return () => {};
};

const set = (reference, value) => {
  if (db && reference) return dbSet(reference, value);
  return Promise.reject(new Error('DB not configured'));
};

const update = (reference, value) => {
  if (db && reference) return dbUpdate(reference, value);
  return Promise.reject(new Error('DB not configured'));
};

const remove = (reference) => {
  if (db && reference) return dbRemove(reference);
  return Promise.reject(new Error('DB not configured'));
};

const serverTimestamp = () => dbServerTimestamp();

const getProjectsRTDBRef = (userId) => {
  if (!userId) throw new Error('userId is required');
  if (!db) throw new Error('DB not configured');
  return dbRef(db, `users/${userId}/projects`);
};

export { db, ref, onValue, set, update, remove, serverTimestamp, getProjectsRTDBRef };
