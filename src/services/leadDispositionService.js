import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { auth } from '../firebase';
import { dispositions as DEFAULT_DISPOSITIONS } from '../data/dispositions';

const DISPOSITIONS_COLLECTION = 'dispositions';

// Helper function to check if Firebase is properly initialized
const checkFirebaseConnection = () => {
  if (!db) {
    throw new Error('Firebase is not properly initialized. Please check your Firebase configuration.');
  }
};

// Helper function to check authentication for write operations
const checkAuth = () => {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to perform this action');
  }
  return auth.currentUser;
};

const leadDispositionService = {
  // Get all dispositions
  getAllDispositions: async () => {
    try {
      checkFirebaseConnection();
      const dispositionsQuery = query(
        collection(db, DISPOSITIONS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(dispositionsQuery);
      
      // If no dispositions exist, initialize defaults
      if (querySnapshot.empty) {
        console.log('No dispositions found, initializing defaults...');
        await leadDispositionService.initializeDefaultDispositions();
        // Fetch again after initialization
        const newSnapshot = await getDocs(dispositionsQuery);
        return newSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching dispositions:', error);
      throw error;
    }
  },

  // Get dispositions by category
  getDispositionsByCategory: async (category) => {
    try {
      checkFirebaseConnection();
      console.log(`Fetching dispositions for category: ${category}`);
      
      const dispositionsQuery = query(
        collection(db, DISPOSITIONS_COLLECTION),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(dispositionsQuery);
      const dispositions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Successfully fetched ${dispositions.length} dispositions for category ${category}`);
      return dispositions;
    } catch (error) {
      console.error('Error fetching dispositions by category:', error);
      throw error;
    }
  },

  // Search dispositions
  searchDispositions: async (searchTerm) => {
    try {
      checkFirebaseConnection();
      console.log('Searching dispositions...');
      
      const dispositionsQuery = query(
        collection(db, DISPOSITIONS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(dispositionsQuery);
      const dispositions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Client-side search since Firestore doesn't support full-text search
      return dispositions.filter(disposition => {
        const searchLower = searchTerm.toLowerCase();
        return (
          disposition.name?.toLowerCase().includes(searchLower) ||
          disposition.description?.toLowerCase().includes(searchLower) ||
          disposition.category?.toLowerCase().includes(searchLower) ||
          disposition.nextSteps?.toLowerCase().includes(searchLower) ||
          disposition.tips?.some(tip => tip.toLowerCase().includes(searchLower))
        );
      });
    } catch (error) {
      console.error('Error searching dispositions:', error);
      throw error;
    }
  },

  // Add a new disposition
  addDisposition: async (dispositionData) => {
    try {
      checkFirebaseConnection();
      const user = checkAuth();
      const docRef = await addDoc(collection(db, DISPOSITIONS_COLLECTION), {
        ...dispositionData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding disposition:', error);
      throw error;
    }
  },

  // Update a disposition
  updateDisposition: async (dispositionId, dispositionData) => {
    try {
      checkFirebaseConnection();
      const user = checkAuth();
      const dispositionRef = doc(db, DISPOSITIONS_COLLECTION, dispositionId);
      await updateDoc(dispositionRef, {
        ...dispositionData,
        updatedBy: user.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating disposition:', error);
      throw error;
    }
  },

  // Delete a disposition
  deleteDisposition: async (dispositionId) => {
    try {
      checkFirebaseConnection();
      checkAuth();
      const dispositionRef = doc(db, DISPOSITIONS_COLLECTION, dispositionId);
      await deleteDoc(dispositionRef);
    } catch (error) {
      console.error('Error deleting disposition:', error);
      throw error;
    }
  },

  // Debug function to list all dispositions
  debugListDispositions: async () => {
    try {
      console.log('Debug: Listing all dispositions...');
      const dispositionsQuery = query(collection(db, DISPOSITIONS_COLLECTION));
      const querySnapshot = await getDocs(dispositionsQuery);
      
      console.log(`Debug: Found ${querySnapshot.size} dispositions in database:`);
      querySnapshot.docs.forEach(doc => {
        console.log(`- ${doc.data().name} (${doc.data().category})`);
      });
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Debug: Error listing dispositions:', error);
      throw error;
    }
  },

  // Initialize default dispositions
  initializeDefaultDispositions: async () => {
    try {
      console.log('Starting to initialize default dispositions...');
      checkFirebaseConnection();

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to initialize dispositions');
      }

      // Get existing dispositions
      const existingDispositions = await getDocs(collection(db, DISPOSITIONS_COLLECTION));
      console.log(`Found ${existingDispositions.size} existing dispositions`);

      // Delete all existing dispositions
      if (existingDispositions.size > 0) {
        console.log('Deleting existing dispositions...');
        const batch = writeBatch(db);
        existingDispositions.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('Successfully deleted existing dispositions');
      }

      // Add all default dispositions
      console.log('Adding all default dispositions...');
      const addBatch = writeBatch(db);
      
      DEFAULT_DISPOSITIONS.forEach(disposition => {
        const docRef = doc(collection(db, DISPOSITIONS_COLLECTION));
        addBatch.set(docRef, {
          ...disposition,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await addBatch.commit();
      console.log(`Successfully added ${DEFAULT_DISPOSITIONS.length} default dispositions`);

      return DEFAULT_DISPOSITIONS.length;
    } catch (error) {
      console.error('Error initializing default dispositions:', error);
      throw error;
    }
  },

  // Force reinitialize all dispositions
  forceReinitializeDispositions: async () => {
    try {
      console.log('Force reinitializing all dispositions...');
      checkFirebaseConnection();

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to initialize dispositions');
      }

      // Get all existing dispositions
      const dispositionsQuery = query(collection(db, DISPOSITIONS_COLLECTION));
      const existingDispositions = await getDocs(dispositionsQuery);
      
      console.log(`Found ${existingDispositions.size} existing dispositions to delete`);
      
      // Delete all existing dispositions
      if (existingDispositions.size > 0) {
        const deleteBatch = writeBatch(db);
        existingDispositions.docs.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
        console.log('Successfully deleted all existing dispositions');
      }

      // Add all dispositions from dispositions.js
      console.log('Adding all dispositions from dispositions.js...');
      const addBatch = writeBatch(db);
      
      DEFAULT_DISPOSITIONS.forEach(disposition => {
        const docRef = doc(collection(db, DISPOSITIONS_COLLECTION));
        addBatch.set(docRef, {
          ...disposition,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await addBatch.commit();
      console.log(`Successfully added ${DEFAULT_DISPOSITIONS.length} dispositions`);

      // Verify the dispositions were added
      const verifyQuery = query(collection(db, DISPOSITIONS_COLLECTION));
      const verifySnapshot = await getDocs(verifyQuery);
      console.log(`Verification: Found ${verifySnapshot.size} dispositions in database`);
      
      return verifySnapshot.size;
    } catch (error) {
      console.error('Error force reinitializing dispositions:', error);
      throw error;
    }
  },

  // Get unique categories from dispositions
  getDispositionCategories: async () => {
    try {
      checkFirebaseConnection();
      const dispositionsQuery = query(collection(db, DISPOSITIONS_COLLECTION));
      const querySnapshot = await getDocs(dispositionsQuery);
      
      // Get unique categories from dispositions
      const categories = new Set();
      querySnapshot.docs.forEach(doc => {
        const category = doc.data().category;
        if (category) {
          categories.add(category);
        }
      });

      // Convert to array of category objects with default icons and colors
      const categoryObjects = Array.from(categories).map(category => {
        const defaultCategory = DEFAULT_DISPOSITIONS.find(d => d.category === category);
        return {
          id: category,
          name: category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          icon: defaultCategory?.icon || '📋',
          color: defaultCategory?.color || 'gray'
        };
      });

      // Add "All Categories" option
      return [
        { id: 'all', name: 'All Categories', icon: '📋', color: 'gray' },
        ...categoryObjects
      ];
    } catch (error) {
      console.error('Error fetching disposition categories:', error);
      throw error;
    }
  }
};

export default leadDispositionService; 