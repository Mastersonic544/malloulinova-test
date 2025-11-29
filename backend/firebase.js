// Firebase initialization and configuration for Malloulinova project
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { getDatabase, ref, onValue, set, update, remove, serverTimestamp } from 'firebase/database';

// Import your Firebase configuration
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app);

// Authentication state management
let currentUser = null;
let authToken = null;

// Email/Password Authentication functions
const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    authToken = await currentUser.getIdToken();
    console.log('User signed in successfully:', email);
    return { user: currentUser, token: authToken };
  } catch (error) {
    console.error('Sign-in error:', error);
    throw new Error('Failed to sign in: ' + error.message);
  }
};

const createUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    authToken = await currentUser.getIdToken();
    console.log('User created successfully:', email);
    return { user: currentUser, token: authToken };
  } catch (error) {
    console.error('User creation error:', error);
    throw new Error('Failed to create user: ' + error.message);
  }
};

const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Sign-out error:', error);
    throw new Error('Failed to sign out: ' + error.message);
  }
};

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    currentUser = user;
    user.getIdToken().then(token => {
      authToken = token;
      console.log('User authenticated:', user.uid);
    });
  } else {
    // User is signed out
    currentUser = null;
    authToken = null;
    console.log('User signed out');
  }
});

// Utility function to get RTDB reference for user's projects
const getProjectsRTDBRef = (userId) => {
  if (!userId) {
    throw new Error('User ID is required to access projects');
  }
  return ref(db, `users/${userId}/projects`);
};

// Export initialized services and utility functions
export {
  db,
  auth,
  // Authentication functions
  signInUser,
  createUser,
  signOutUser,
  getProjectsRTDBRef,
  // Firebase methods for use in services
  ref,
  onValue,
  set,
  update,
  remove,
  serverTimestamp,
  onAuthStateChanged
};