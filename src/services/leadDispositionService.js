import { db } from './firebase/config';
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
  writeBatch
} from 'firebase/firestore';
import { auth } from './firebase/config';
import { dispositions as DEFAULT_DISPOSITIONS } from '../data/dispositions';

const DISPOSITIONS_COLLECTION = 'dispositions';

// Helper function to check if Firebase is properly initialized
const checkFirebaseConnection = () => {
  if (!db) {
    throw new Error('Firebase is not properly initialized. Please check your Firebase configuration.');
  }
};

const leadDispositionService = {
  // Get all dispositions
  getAllDispositions: async () => {
    try {
      console.log('Starting getAllDispositions...');
      
      // Check Firebase connection
      if (!db) {
        console.error('Firebase db is not initialized');
        throw new Error('Firebase is not properly initialized');
      }
      
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('User must be authenticated to access dispositions');
      }
      
      console.log('Fetching dispositions from Firestore...');
      const dispositionsQuery = query(
        collection(db, DISPOSITIONS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(dispositionsQuery);
      console.log(`Found ${querySnapshot.size} dispositions`);
      
      const dispositions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Successfully fetched dispositions:', dispositions);
      return dispositions;
    } catch (error) {
      console.error('Error in getAllDispositions:', error);
      if (error.code) {
        console.error('Firebase error code:', error.code);
      }
      throw new Error(`Failed to fetch dispositions: ${error.message}`);
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
      console.log('Adding new disposition...');
      
      const docRef = await addDoc(collection(db, DISPOSITIONS_COLLECTION), {
        ...dispositionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('Successfully added new disposition');
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
      console.log(`Updating disposition: ${dispositionId}`);
      
      const dispositionRef = doc(db, DISPOSITIONS_COLLECTION, dispositionId);
      await updateDoc(dispositionRef, {
        ...dispositionData,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Successfully updated disposition');
    } catch (error) {
      console.error('Error updating disposition:', error);
      throw error;
    }
  },

  // Delete a disposition
  deleteDisposition: async (dispositionId) => {
    try {
      checkFirebaseConnection();
      console.log(`Deleting disposition: ${dispositionId}`);
      
      const dispositionRef = doc(db, DISPOSITIONS_COLLECTION, dispositionId);
      await deleteDoc(dispositionRef);
      
      console.log('Successfully deleted disposition');
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
  }
};

export { leadDispositionService }; 