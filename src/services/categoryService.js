import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  writeBatch,
  getDoc
} from 'firebase/firestore';

const CATEGORIES_COLLECTION = 'categories';
const REBUTTALS_COLLECTION = 'rebuttals';
const ARCHIVED_REBUTTALS_COLLECTION = 'archived_rebuttals';

// Default categories to initialize if none exist
const DEFAULT_CATEGORIES = [
  { name: 'Not Interested', icon: '❌', color: '#FF6B6B' },
  { name: 'Spouse Consultation', icon: '💑', color: '#4ECDC4' },
  { name: 'One Legger', icon: '👤', color: '#45B7D1' },
  { name: 'Not Ready', icon: '⏳', color: '#96CEB4' },
  { name: 'Curious', icon: '🤔', color: '#FFEEAD' },
  { name: 'Time Concern', icon: '⏰', color: '#D4A5A5' },
  { name: 'Can\'t Afford', icon: '💰', color: '#9B59B6' },
  { name: 'Spouse', icon: '👫', color: '#3498DB' },
  { name: 'Price Phone', icon: '📞', color: '#E67E22' },
  { name: 'Repair', icon: '🔧', color: '#2ECC71' },
  { name: 'Government Grants', icon: '🏛️', color: '#34495E' },
  { name: 'Reset Appointment', icon: '🔄', color: '#F1C40F' },
  { name: 'No Request', icon: '🚫', color: '#E74C3C' },
  { name: 'Bad Reviews', icon: '⭐', color: '#F39C12' }
];

// Default rebuttals to initialize
const DEFAULT_REBUTTALS = [
  {
    title: "Can't Afford",
    category: "Can't Afford",
    objection: "I can't afford this right now",
    response: {
      pt1: "I completely understand your concern about the cost. Many of our customers felt the same way initially, but they found that our solution actually saves them money in the long run. Let me explain how...",
      pt2: "If cost is still a concern, we have several flexible payment options and financing solutions that might work better for your budget. Would you like to hear about those?"
    },
    icon: "💰",
    color: "#9B59B6",
    tags: ["cost", "budget", "payment"]
  },
  {
    title: "Reset Appointment",
    category: "Reset Appointment",
    objection: "I need to reschedule my appointment",
    response: {
      pt1: "I understand that things come up and schedules need to change. I'd be happy to help you find a new time that works better for you.",
      pt2: "What days and times would work better for your schedule? I'll make sure to find a slot that's convenient for you."
    },
    icon: "🔄",
    color: "#F1C40F",
    tags: ["schedule", "reschedule", "appointment"]
  }
  // Add more default rebuttals as needed
];

class CategoryService {
  constructor() {
    this.categoriesCollection = collection(db, CATEGORIES_COLLECTION);
    this.rebuttalsCollection = collection(db, REBUTTALS_COLLECTION);
    this.archivedRebuttalsCollection = collection(db, ARCHIVED_REBUTTALS_COLLECTION);
  }

  // Initialize default categories if none exist
  async initializeDefaultCategories() {
    try {
      // Get existing categories
      const categoriesQuery = query(this.categoriesCollection);
      const querySnapshot = await getDocs(categoriesQuery);
      
      // If we already have categories, don't create new ones
      if (!querySnapshot.empty) {
        console.log('Categories already exist, skipping initialization');
        return;
      }
      
      // Create default categories
      console.log('Creating default categories...');
      for (const category of DEFAULT_CATEGORIES) {
        await this.addCategory(category);
      }
      console.log('Default categories created successfully');
    } catch (error) {
      console.error('Error initializing default categories:', error);
      throw error;
    }
  }

  // Get all categories
  async getAllCategories() {
    try {
      // First ensure default categories exist
      await this.initializeDefaultCategories();
      
      const categoriesQuery = query(
        this.categoriesCollection,
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(categoriesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Add a new category
  async addCategory(categoryData) {
    try {
      const docRef = await addDoc(this.categoriesCollection, {
        name: categoryData.name,
        icon: categoryData.icon || '📋',
        color: categoryData.color || '#808080',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  // Update a category
  async updateCategory(id, categoryData) {
    try {
      const categoryRef = doc(this.categoriesCollection, id);
      await updateDoc(categoryRef, {
        ...categoryData,
        updatedAt: new Date().toISOString()
      });
      return id;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Delete a category and handle its rebuttals
  async deleteCategory(id) {
    try {
      // Start a batch write
      const batch = writeBatch(db);
      
      // Get the category to be deleted
      const categoryRef = doc(this.categoriesCollection, id);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        throw new Error('Category not found');
      }

      const categoryData = categoryDoc.data();
      
      // Find all rebuttals in this category
      const rebuttalsQuery = query(
        this.rebuttalsCollection, 
        where('category', '==', categoryData.name)
      );
      const rebuttalsSnapshot = await getDocs(rebuttalsQuery);
      
      // Archive each rebuttal
      rebuttalsSnapshot.forEach(rebuttalDoc => {
        const rebuttalData = rebuttalDoc.data();
        const archivedRebuttalRef = doc(this.archivedRebuttalsCollection);
        
        // Add to archived rebuttals with original category info
        batch.set(archivedRebuttalRef, {
          ...rebuttalData,
          originalCategory: categoryData.name,
          archivedAt: new Date().toISOString(),
          archivedReason: 'Category deleted',
          originalId: rebuttalDoc.id // Keep track of original ID
        });
        
        // Delete from active rebuttals
        batch.delete(doc(this.rebuttalsCollection, rebuttalDoc.id));
      });

      // Delete the category
      batch.delete(categoryRef);
      
      // Commit all changes
      await batch.commit();
      
      return {
        categoryId: id,
        archivedRebuttalsCount: rebuttalsSnapshot.size
      };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Restore archived rebuttals to a new category
  async restoreArchivedRebuttals(newCategoryName) {
    try {
      const batch = writeBatch(db);
      
      // Find all archived rebuttals that were archived due to category deletion
      const archivedQuery = query(
        this.archivedRebuttalsCollection,
        where('archivedReason', '==', 'Category deleted')
      );
      const archivedSnapshot = await getDocs(archivedQuery);
      
      // Restore each rebuttal to the new category
      archivedSnapshot.forEach(archivedDoc => {
        const rebuttalData = archivedDoc.data();
        const newRebuttalRef = doc(this.rebuttalsCollection);
        
        // Add back to active rebuttals with new category
        batch.set(newRebuttalRef, {
          ...rebuttalData,
          category: newCategoryName,
          archivedAt: null,
          archivedReason: null,
          originalCategory: null,
          updatedAt: new Date().toISOString()
        });
        
        // Delete from archived rebuttals
        batch.delete(doc(this.archivedRebuttalsCollection, archivedDoc.id));
      });
      
      // Commit all changes
      await batch.commit();
      
      return {
        restoredCount: archivedSnapshot.size
      };
    } catch (error) {
      console.error('Error restoring archived rebuttals:', error);
      throw error;
    }
  }

  // Get archived rebuttals
  async getArchivedRebuttals() {
    try {
      const querySnapshot = await getDocs(this.archivedRebuttalsCollection);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching archived rebuttals:', error);
      throw error;
    }
  }

  // Update a rebuttal's category
  async updateRebuttalCategory(rebuttalId, newCategory) {
    try {
      const rebuttalRef = doc(this.rebuttalsCollection, rebuttalId);
      await updateDoc(rebuttalRef, {
        category: newCategory,
        updatedAt: new Date().toISOString()
      });
      return rebuttalId;
    } catch (error) {
      console.error('Error updating rebuttal category:', error);
      throw error;
    }
  }

  // Reset all rebuttals to default state
  async resetAllRebuttals() {
    try {
      // Delete all existing rebuttals
      const rebuttalsQuery = query(this.rebuttalsCollection);
      const querySnapshot = await getDocs(rebuttalsQuery);
      
      // Delete existing rebuttals
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      // Create default rebuttals
      console.log('Creating default rebuttals...');
      for (const rebuttal of DEFAULT_REBUTTALS) {
        await addDoc(this.rebuttalsCollection, {
          ...rebuttal,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        });
      }
      console.log('Default rebuttals created successfully');
    } catch (error) {
      console.error('Error resetting rebuttals:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const categoryService = new CategoryService();
export default categoryService; 