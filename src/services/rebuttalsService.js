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
  doc
} from 'firebase/firestore';
import { auth } from './firebase/config';

const REBUTTALS_COLLECTION = 'rebuttals';

// Helper function to check if Firebase is properly initialized
const checkFirebaseConnection = () => {
  if (!db) {
    throw new Error('Firebase is not properly initialized. Please check your Firebase configuration.');
  }
};

const rebuttalsService = {
  // Get all rebuttals
  getAllRebuttals: async () => {
    try {
      checkFirebaseConnection();
      console.log('Fetching all rebuttals...');
      
      const rebuttalsQuery = query(
        collection(db, REBUTTALS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(rebuttalsQuery);
      const rebuttals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Successfully fetched ${rebuttals.length} rebuttals`);
      return rebuttals;
    } catch (error) {
      console.error('Error fetching rebuttals:', error);
      if (error.code) {
        console.error('Firebase error code:', error.code);
      }
      throw new Error(`Failed to fetch rebuttals: ${error.message}`);
    }
  },

  // Get active rebuttals (not archived)
  getActiveRebuttals: async () => {
    try {
      checkFirebaseConnection();
      console.log('Fetching active rebuttals...');
      
      const rebuttalsQuery = query(
        collection(db, REBUTTALS_COLLECTION),
        where('archived', '==', false),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(rebuttalsQuery);
      const rebuttals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Successfully fetched ${rebuttals.length} active rebuttals`);
      return rebuttals;
    } catch (error) {
      console.error('Error fetching active rebuttals:', error);
      if (error.code) {
        console.error('Firebase error code:', error.code);
      }
      throw new Error(`Failed to fetch active rebuttals: ${error.message}`);
    }
  },

  // Get archived rebuttals
  getArchivedRebuttals: async () => {
    try {
      checkFirebaseConnection();
      console.log('Fetching archived rebuttals...');
      
      const rebuttalsQuery = query(
        collection(db, REBUTTALS_COLLECTION),
        where('archived', '==', true),
        orderBy('archivedAt', 'desc')
      );
      const querySnapshot = await getDocs(rebuttalsQuery);
      const rebuttals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Successfully fetched ${rebuttals.length} archived rebuttals`);
      return rebuttals;
    } catch (error) {
      console.error('Error fetching archived rebuttals:', error);
      if (error.code) {
        console.error('Firebase error code:', error.code);
      }
      throw new Error(`Failed to fetch archived rebuttals: ${error.message}`);
    }
  },

  // Get rebuttals by category
  getRebuttalsByCategory: async (category) => {
    try {
      const rebuttalsQuery = query(
        collection(db, REBUTTALS_COLLECTION),
        where('category', '==', category),
        where('archived', '==', false),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(rebuttalsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching rebuttals by category:', error);
      throw error;
    }
  },

  // Search rebuttals
  searchRebuttals: async (searchTerm) => {
    try {
      const rebuttalsQuery = query(
        collection(db, REBUTTALS_COLLECTION),
        where('archived', '==', false),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(rebuttalsQuery);
      const rebuttals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Client-side search since Firestore doesn't support full-text search
      return rebuttals.filter(rebuttal => {
        const searchLower = searchTerm.toLowerCase();
        return (
          rebuttal.title?.toLowerCase().includes(searchLower) ||
          rebuttal.objection?.toLowerCase().includes(searchLower) ||
          rebuttal.response?.toLowerCase().includes(searchLower) ||
          rebuttal.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
    } catch (error) {
      console.error('Error searching rebuttals:', error);
      throw error;
    }
  },

  // Add a new rebuttal
  addRebuttal: async (rebuttalData) => {
    try {
      const docRef = await addDoc(collection(db, REBUTTALS_COLLECTION), {
        ...rebuttalData,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding rebuttal:', error);
      throw error;
    }
  },

  // Update a rebuttal
  updateRebuttal: async (rebuttalId, rebuttalData) => {
    try {
      const rebuttalRef = doc(db, REBUTTALS_COLLECTION, rebuttalId);
      await updateDoc(rebuttalRef, {
        ...rebuttalData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating rebuttal:', error);
      throw error;
    }
  },

  // Archive a rebuttal
  archiveRebuttal: async (rebuttalId) => {
    try {
      const rebuttalRef = doc(db, REBUTTALS_COLLECTION, rebuttalId);
      await updateDoc(rebuttalRef, {
        archived: true,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error archiving rebuttal:', error);
      throw error;
    }
  },

  // Unarchive a rebuttal
  unarchiveRebuttal: async (rebuttalId) => {
    try {
      const rebuttalRef = doc(db, REBUTTALS_COLLECTION, rebuttalId);
      await updateDoc(rebuttalRef, {
        archived: false,
        archivedAt: null,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error unarchiving rebuttal:', error);
      throw error;
    }
  },

  // Delete a rebuttal
  deleteRebuttal: async (rebuttalId) => {
    try {
      const rebuttalRef = doc(db, REBUTTALS_COLLECTION, rebuttalId);
      await deleteDoc(rebuttalRef);
    } catch (error) {
      console.error('Error deleting rebuttal:', error);
      throw error;
    }
  }
};

// Default categories to initialize the collection
const DEFAULT_CATEGORIES = [
  { name: 'Not Interested', icon: '❌' },
  { name: 'Spouse Consultation', icon: '💑' },
  { name: 'One Legger', icon: '👤' },
  { name: 'Not Ready', icon: '⏳' },
  { name: 'Curious', icon: '🤔' },
  { name: 'Time Concern', icon: '⏰' },
  { name: 'Can\'t Afford', icon: '💰' },
  { name: 'Spouse', icon: '👫' },
  { name: 'Price Phone', icon: '📞' },
  { name: 'Repair', icon: '🔧' },
  { name: 'Government Grants', icon: '🏛️' },
  { name: 'Reset Appointment', icon: '🔄' },
  { name: 'No Request', icon: '🚫' },
  { name: 'Bad Reviews', icon: '⭐' }
];

// Initialize default categories if none exist
const initializeDefaultCategories = async () => {
  try {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);
    
    if (snapshot.empty) {
      console.log('Initializing default categories...');
      const user = auth.currentUser;
      
      for (const category of DEFAULT_CATEGORIES) {
        await addDoc(categoriesRef, {
          name: category.name,
          icon: category.icon,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('Default categories initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing default categories:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    checkFirebaseConnection();
    console.log('Fetching categories...');
    
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to access categories');
    }
    
    // Initialize default categories if none exist
    await initializeDefaultCategories();
    
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);
    
    if (snapshot.empty) {
      console.log('No categories found');
      return [];
    }
    
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Successfully fetched ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    if (error.code) {
      console.error('Firebase error code:', error.code);
    }
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
};

export const addCategory = async (category) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to add categories');
    }
    
    const categoriesRef = collection(db, 'categories');
    const docRef = await addDoc(categoriesRef, {
      name: category.name,
      icon: category.icon,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...category };
  } catch (error) {
    console.error('Error adding category:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to add categories. Please make sure you are logged in as an admin.');
    }
    throw error;
  }
};

export const updateCategory = async (categoryId, category) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update categories');
    }
    
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, {
      name: category.name,
      icon: category.icon,
      updatedBy: user.uid,
      updatedAt: new Date().toISOString()
    });
    return { id: categoryId, ...category };
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update categories. Please make sure you are logged in as an admin.');
    }
    throw error;
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to delete categories');
    }
    
    // First, check if category is in use
    const rebuttalsRef = collection(db, 'rebuttals');
    const q = query(rebuttalsRef, where('category', '==', categoryId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error('Cannot delete category that is in use by rebuttals');
    }

    // If not in use, proceed with deletion
    const categoryRef = doc(db, 'categories', categoryId);
    await deleteDoc(categoryRef);
    return categoryId;
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to delete categories. Please make sure you are logged in as an admin.');
    }
    throw error;
  }
};

export default rebuttalsService; 