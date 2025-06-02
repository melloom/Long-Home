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
import { dispositions as DEFAULT_DISPOSITIONS } from '../data/dispositions';

const DISPOSITIONS_COLLECTION = 'dispositions';

class DispositionService {
  constructor() {
    this.db = db;
    this.dispositionsCollection = collection(this.db, DISPOSITIONS_COLLECTION);
  }

  // Get all dispositions
  async getAllDispositions() {
    try {
      const dispositionsQuery = query(
        this.dispositionsCollection,
        orderBy('id', 'asc')
      );
      const querySnapshot = await getDocs(dispositionsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching dispositions:', error);
      throw error;
    }
  }

  // Add a new disposition
  async addDisposition(dispositionData) {
    try {
      const docRef = await addDoc(this.dispositionsCollection, {
        ...dispositionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, ...dispositionData };
    } catch (error) {
      console.error('Error adding disposition:', error);
      throw error;
    }
  }

  // Update a disposition
  async updateDisposition(id, dispositionData) {
    try {
      const dispositionRef = doc(this.dispositionsCollection, id);
      await updateDoc(dispositionRef, {
        ...dispositionData,
        updatedAt: serverTimestamp()
      });
      return { id, ...dispositionData };
    } catch (error) {
      console.error('Error updating disposition:', error);
      throw error;
    }
  }

  // Delete a disposition
  async deleteDisposition(id) {
    try {
      const dispositionRef = doc(this.dispositionsCollection, id);
      await deleteDoc(dispositionRef);
      return id;
    } catch (error) {
      console.error('Error deleting disposition:', error);
      throw error;
    }
  }

  // Reset all dispositions to default
  async resetAllDispositions() {
    try {
      // Get all existing dispositions
      const existingDispositions = await this.getAllDispositions();
      
      // Create a batch for operations
      const batch = writeBatch(this.db);
      
      // Delete all existing dispositions
      existingDispositions.forEach(disposition => {
        const dispositionRef = doc(this.db, DISPOSITIONS_COLLECTION, disposition.id);
        batch.delete(dispositionRef);
      });
      
      // Add all default dispositions
      DEFAULT_DISPOSITIONS.forEach(disposition => {
        const newDispositionRef = doc(collection(this.db, DISPOSITIONS_COLLECTION));
        batch.set(newDispositionRef, {
          ...disposition,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      // Commit the batch
      await batch.commit();
      console.log('Successfully reset all dispositions');
      
      return true;
    } catch (error) {
      console.error('Error resetting dispositions:', error);
      throw error;
    }
  }
}

// Create a single instance of the service
const dispositionService = new DispositionService();

export default dispositionService; 