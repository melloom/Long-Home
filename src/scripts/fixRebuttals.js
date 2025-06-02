import { db } from '../firebase';
import { collection, getDocs, deleteDoc, addDoc, doc } from 'firebase/firestore';

const REBUTTALS_COLLECTION = 'rebuttals';
const ARCHIVED_COLLECTION = 'archived_rebuttals';

export const fixRebuttalsData = async () => {
  try {
    console.log('Starting rebuttals data fix...');

    // Get all existing rebuttals
    const rebuttalsRef = collection(db, REBUTTALS_COLLECTION);
    const archivedRef = collection(db, ARCHIVED_COLLECTION);
    
    const existingRebuttals = await getDocs(rebuttalsRef);
    const existingArchived = await getDocs(archivedRef);

    // Delete all existing rebuttals and archived rebuttals
    console.log('Clearing existing rebuttals...');
    for (const doc of existingRebuttals.docs) {
      await deleteDoc(doc.ref);
    }
    for (const doc of existingArchived.docs) {
      await deleteDoc(doc.ref);
    }

    // Add all rebuttals from static data
    console.log('Adding rebuttals from static data...');
    for (const rebuttal of callCenterRebuttals) {
      const rebuttalData = {
        title: rebuttal.title,
        category: rebuttal.category,
        objection: rebuttal.summary,
        response: rebuttal.content,
        tags: rebuttal.tags || [],
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(rebuttalsRef, rebuttalData);
    }

    console.log('Rebuttals data fix completed successfully');
    return true;
  } catch (error) {
    console.error('Error fixing rebuttals data:', error);
    throw error;
  }
}; 