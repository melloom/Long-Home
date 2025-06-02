import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Helper function to create admin entry
const createAdminEntry = async (user, additionalData = {}) => {
  try {
    const adminRef = doc(db, 'admins', user.uid);
    await setDoc(adminRef, {
      email: user.email,
      role: 'admin',
      displayName: user.displayName || '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      ...additionalData
    }, { merge: true });
  } catch (error) {
    console.error('Error creating admin entry:', error);
    throw error;
  }
};

// Register a new user
export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create admin entry
    await createAdminEntry(user, { displayName });

    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Sign in user
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create or update admin entry
    await createAdminEntry(user);

    return user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe();
        if (user) {
          try {
            // Create admin entry if it doesn't exist
            await createAdminEntry(user);
          } catch (error) {
            console.error('Error creating admin entry for current user:', error);
          }
        }
        resolve(user);
      },
      (error) => {
        console.error('Auth state change error:', error);
        reject(error);
      }
    );
  });
};

// Create admin user
export const createAdminUser = async (email, password) => {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create admin entry
    await createAdminEntry(user);

    return user;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}; 