// Authentication Service Layer - Interface between UI and Firebase Auth
// Provides clean API for email/password authentication operations

import {
  signInUser,
  createUser,
  signOutUser,
  auth,
  onAuthStateChanged
} from '@/lib/firebase.js';

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Promise that resolves with user data and token
 */
const signIn = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    const result = await signInUser(email, password);
    console.log('Authentication successful for:', email);
    return result;
  } catch (error) {
    console.error('Sign-in failed:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Authentication failed';
    
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address';
        break;
      case 'auth/user-disabled':
        errorMessage = 'User account has been disabled';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No user found with this email';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password';
        break;
      default:
        errorMessage = error.message || 'Authentication failed';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Create a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Promise that resolves with user data and token
 */
const signUp = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    const result = await createUser(email, password);
    console.log('User created successfully:', email);
    return result;
  } catch (error) {
    console.error('Sign-up failed:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'User creation failed';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Email address is already in use';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password accounts are not enabled';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak';
        break;
      default:
        errorMessage = error.message || 'User creation failed';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
const logout = async () => {
  try {
    await signOutUser();
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Sign-out failed:', error);
    throw new Error('Failed to sign out: ' + error.message);
  }
};

/**
 * Get the current authenticated user
 * @returns {object|null} Current user object or null if not authenticated
 */
const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen for authentication state changes
 * @param {function} callback - Callback function that receives user object
 * @returns {function} Unsubscribe function
 */
const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

/**
 * Check if a user is currently authenticated
 * @returns {boolean} True if user is authenticated
 */
const isAuthenticated = () => {
  return !!auth.currentUser;
};

/**
 * Get the current user's ID token
 * @returns {Promise<string|null>} Promise that resolves with token or null
 */
const getAuthToken = async () => {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

// Export the authentication service functions
export {
  signIn,
  signUp,
  logout,
  getCurrentUser,
  onAuthChange,
  isAuthenticated,
  getAuthToken
};