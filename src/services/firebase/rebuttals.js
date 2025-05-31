import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './config';

const REBUTTALS_COLLECTION = 'rebuttals';

// Helper function to check authentication
const checkAuth = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to perform this action');
  }
  return user;
};

// Add a new rebuttal
export const addRebuttal = async (rebuttalData) => {
  try {
    const user = checkAuth();
    const docRef = await addDoc(collection(db, REBUTTALS_COLLECTION), {
      ...rebuttalData,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding rebuttal:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to add rebuttals. Please make sure you are logged in as an admin.');
    }
    throw error;
  }
};

// Update a rebuttal
export const updateRebuttal = async (rebuttalId, rebuttalData) => {
  try {
    const user = checkAuth();
    const rebuttalRef = doc(db, REBUTTALS_COLLECTION, rebuttalId);
    await updateDoc(rebuttalRef, {
      ...rebuttalData,
      updatedBy: user.uid,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating rebuttal:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update rebuttals. Please make sure you are logged in as an admin.');
    }
    throw error;
  }
};

// Delete a rebuttal
export const deleteRebuttal = async (rebuttalId) => {
  try {
    checkAuth();
    const rebuttalRef = doc(db, REBUTTALS_COLLECTION, rebuttalId);
    await deleteDoc(rebuttalRef);
  } catch (error) {
    console.error('Error deleting rebuttal:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to delete rebuttals. Please make sure you are logged in as an admin.');
    }
    throw error;
  }
};

// Get all rebuttals
export const getAllRebuttals = async () => {
  try {
    checkAuth();
    const rebuttalsQuery = query(
      collection(db, REBUTTALS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(rebuttalsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting rebuttals:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to view rebuttals. Please make sure you are logged in.');
    }
    throw error;
  }
};

// Get a single rebuttal
export const getRebuttal = async (rebuttalId) => {
  try {
    checkAuth();
    const rebuttalRef = doc(db, REBUTTALS_COLLECTION, rebuttalId);
    const rebuttalSnap = await getDoc(rebuttalRef);
    if (rebuttalSnap.exists()) {
      return {
        id: rebuttalSnap.id,
        ...rebuttalSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting rebuttal:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to view this rebuttal. Please make sure you are logged in.');
    }
    throw error;
  }
}; 