import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './config';

// Function to list all users (using client SDK)
export const listAllUsers = async (maxResults = 1000) => {
  try {
    // Get all users from the users collection
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef);
    const usersSnapshot = await getDocs(usersQuery);
    
    return usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
};

// Function to check if a user is an admin
export const isUserAdmin = async (userId) => {
  try {
    const adminRef = collection(db, 'admins');
    const adminQuery = query(adminRef, where('uid', '==', userId));
    const adminSnapshot = await getDocs(adminQuery);
    
    return !adminSnapshot.empty;
  } catch (error) {
    console.error('Error checking admin status:', error);
    throw error;
  }
}; 