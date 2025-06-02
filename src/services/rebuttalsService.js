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
  enableNetwork,
  disableNetwork,
  onSnapshotsInSync,
  getFirestore,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { auth } from '../firebase';

const REBUTTALS_COLLECTION = 'rebuttals';

// Helper function to check if Firebase is properly initialized
const checkFirebaseConnection = () => {
  if (!db) {
    throw new Error('Firebase is not properly initialized. Please check your Firebase configuration.');
  }
};

class RebuttalsService {
  constructor() {
    this.db = db || getFirestore();
    this.rebuttalsCollection = collection(this.db, REBUTTALS_COLLECTION);
    this.archivedCollection = collection(this.db, 'archived_rebuttals');
    this.categoriesCollection = collection(this.db, 'categories');
    this.isOnline = navigator.onLine;
    this.pendingOperations = [];
    this.setupConnectionListeners();
  }

  setupConnectionListeners() {
    // Listen for online/offline status
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for Firestore sync status
    onSnapshotsInSync(this.db, () => {
      this.processPendingOperations();
    });
  }

  handleOnline() {
    this.isOnline = true;
    this.processPendingOperations();
  }

  handleOffline() {
    this.isOnline = false;
  }

  async processPendingOperations() {
    if (!this.isOnline) return;

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'add':
            await this.addRebuttal(operation.data);
            break;
          case 'update':
            await this.updateRebuttal(operation.id, operation.data);
            break;
          case 'delete':
            await this.deleteRebuttal(operation.id);
            break;
          case 'archive':
            await this.archiveRebuttal(operation.id);
            break;
          case 'unarchive':
            await this.unarchiveRebuttal(operation.id);
            break;
          case 'addCategory':
            await this.addCategory(operation.data);
            break;
          case 'updateCategory':
            await this.updateCategory(operation.id, operation.data);
            break;
          case 'deleteCategory':
            await this.deleteCategory(operation.id);
            break;
        }
      } catch (error) {
        console.error('Error processing pending operation:', error);
        // Add failed operation back to pending
        this.pendingOperations.push(operation);
      }
    }
  }

  // Get all rebuttals
  async getAllRebuttals() {
    try {
      checkFirebaseConnection();
      console.log('Fetching all rebuttals...');
      
      const rebuttalsQuery = query(
        this.rebuttalsCollection,
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(rebuttalsQuery);
      const rebuttals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Log category distribution
      const categoryCount = rebuttals.reduce((acc, rebuttal) => {
        const category = rebuttal.category || 'uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      console.log('Rebuttals by category:', categoryCount);
      
      console.log(`Successfully fetched ${rebuttals.length} rebuttals`);
      return rebuttals;
    } catch (error) {
      console.error('Error fetching rebuttals:', error);
      if (error.code) {
        console.error('Firebase error code:', error.code);
      }
      throw new Error(`Failed to fetch rebuttals: ${error.message}`);
    }
  }

  // Get active rebuttals (not archived)
  async getActiveRebuttals() {
    try {
      checkFirebaseConnection();
      console.log('Fetching active rebuttals...');
      
      const rebuttalsQuery = query(
        this.rebuttalsCollection,
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
  }

  // Get archived rebuttals
  async getArchivedRebuttals() {
    try {
      checkFirebaseConnection();
      console.log('Fetching archived rebuttals...');
      
      const rebuttalsQuery = query(
        this.archivedCollection,
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
  }

  // Get rebuttals by category
  async getRebuttalsByCategory(category) {
    try {
      const rebuttalsQuery = query(
        this.rebuttalsCollection,
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
  }

  // Search rebuttals
  async searchRebuttals(searchTerm) {
    try {
      const rebuttalsQuery = query(
        this.rebuttalsCollection,
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
  }

  // Get all categories
  async getCategories() {
    try {
      checkFirebaseConnection();
      console.log('Fetching categories...');
      
      // First get all categories
      const categoriesQuery = query(
        this.categoriesCollection,
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(categoriesQuery);
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        icon: doc.data().icon || '📋',
        slug: doc.data().name.toLowerCase().replace(/\s+/g, '-')
      }));

      // Then get all rebuttals
      const rebuttalsQuery = query(this.rebuttalsCollection);
      const rebuttalsSnapshot = await getDocs(rebuttalsQuery);
      
      // Create mappings for category lookups
      const categorySlugToId = categories.reduce((acc, cat) => {
        acc[cat.slug] = cat.id;
        return acc;
      }, {});

      const categoryIdToName = categories.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {});

      // Initialize stats for each category
      const categoryStats = categories.reduce((acc, cat) => {
        acc[cat.id] = {
          rebuttalCount: 0,
          lastUpdated: null,
          tags: new Set(),
          rebuttals: []
        };
        return acc;
      }, {});

      // Process each rebuttal
      rebuttalsSnapshot.docs.forEach(doc => {
        const rebuttalData = doc.data();
        let categoryId = rebuttalData.category;

        // If category is a slug, convert to ID
        if (categoryId && !categoryId.match(/^[a-zA-Z0-9_-]{20}$/)) {
          categoryId = categorySlugToId[categoryId.toLowerCase().replace(/\s+/g, '-')];
        }

        // Only process if category exists
        if (categoryId && categoryStats[categoryId]) {
          // Increment rebuttal count
          categoryStats[categoryId].rebuttalCount++;

          // Add rebuttal to list
          categoryStats[categoryId].rebuttals.push({
            id: doc.id,
            title: rebuttalData.title
          });

          // Add tags
          if (rebuttalData.tags && Array.isArray(rebuttalData.tags)) {
            rebuttalData.tags.forEach(tag => categoryStats[categoryId].tags.add(tag));
          }

          // Update last updated
          if (rebuttalData.updatedAt) {
            const updatedDate = new Date(rebuttalData.updatedAt);
            if (!categoryStats[categoryId].lastUpdated || 
                updatedDate > new Date(categoryStats[categoryId].lastUpdated)) {
              categoryStats[categoryId].lastUpdated = rebuttalData.updatedAt;
            }
          }
        }
      });

      // Combine category data with stats
      const categoriesWithStats = categories.map(category => ({
        ...category,
        rebuttalCount: categoryStats[category.id].rebuttalCount,
        lastUpdated: categoryStats[category.id].lastUpdated,
        tags: Array.from(categoryStats[category.id].tags),
        rebuttals: categoryStats[category.id].rebuttals
      }));
      
      // Debug log
      console.log('Categories with stats:', {
        categories: categoriesWithStats.map(cat => ({
          id: cat.id,
          name: cat.name,
          rebuttalCount: cat.rebuttalCount,
          rebuttals: cat.rebuttals.map(r => r.title)
        }))
      });

      return categoriesWithStats;
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (error.code) {
        console.error('Firebase error code:', error.code);
      }
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  // Add a new rebuttal
  async addRebuttal(rebuttalData) {
    try {
      if (!this.isOnline) {
        this.pendingOperations.push({
          type: 'add',
          data: rebuttalData
        });
        return 'pending';
      }

      // Get all categories to validate
      const categoriesQuery = query(this.categoriesCollection);
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        slug: doc.data().name.toLowerCase().replace(/\s+/g, '-')
      }));

      // Create a mapping of category slugs to IDs
      const categorySlugToId = categories.reduce((acc, cat) => {
        acc[cat.slug] = cat.id;
        return acc;
      }, {});

      // Validate and convert category if needed
      if (rebuttalData.category) {
        let categoryId = rebuttalData.category;
        
        // If category is a slug, convert to ID
        if (!categoryId.match(/^[a-zA-Z0-9_-]{20}$/)) {
          categoryId = categorySlugToId[categoryId.toLowerCase().replace(/\s+/g, '-')];
          if (!categoryId) {
            throw new Error(`Category ${rebuttalData.category} does not exist`);
          }
        }

        // Verify category ID exists
        const categoryExists = categories.some(cat => cat.id === categoryId);
        if (!categoryExists) {
          throw new Error(`Category ID ${categoryId} does not exist`);
        }

        rebuttalData.category = categoryId;
      }

      const docRef = await addDoc(this.rebuttalsCollection, {
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
  }

  // Update a rebuttal
  async updateRebuttal(id, rebuttalData) {
    try {
      if (!this.isOnline) {
        this.pendingOperations.push({
          type: 'update',
          id,
          data: rebuttalData
        });
        return 'pending';
      }

      // Validate category exists if being updated
      if (rebuttalData.category) {
        const categoryRef = doc(this.categoriesCollection, rebuttalData.category);
        const categoryDoc = await getDocs(query(this.categoriesCollection, where('__name__', '==', rebuttalData.category)));
        if (categoryDoc.empty) {
          throw new Error(`Category ${rebuttalData.category} does not exist`);
        }
      }

      const rebuttalRef = doc(this.rebuttalsCollection, id);
      await updateDoc(rebuttalRef, {
        ...rebuttalData,
        updatedAt: new Date().toISOString()
      });
      return id;
    } catch (error) {
      console.error('Error updating rebuttal:', error);
      throw error;
    }
  }

  // Archive a rebuttal
  async archiveRebuttal(id) {
    try {
      if (!this.isOnline) {
        this.pendingOperations.push({
          type: 'archive',
          id
        });
        return 'pending';
      }

      const rebuttalRef = doc(this.rebuttalsCollection, id);
      const rebuttalDoc = await getDocs(query(this.rebuttalsCollection, where('__name__', '==', id)));
      
      if (!rebuttalDoc.empty) {
        const rebuttalData = rebuttalDoc.docs[0].data();
        await addDoc(this.archivedCollection, {
          ...rebuttalData,
          archivedAt: new Date().toISOString()
        });
        await deleteDoc(rebuttalRef);
      }
      return id;
    } catch (error) {
      console.error('Error archiving rebuttal:', error);
      throw error;
    }
  }

  // Unarchive a rebuttal
  async unarchiveRebuttal(id) {
    try {
      if (!this.isOnline) {
        this.pendingOperations.push({
          type: 'unarchive',
          id
        });
        return 'pending';
      }

      const archivedRef = doc(this.archivedCollection, id);
      const archivedDoc = await getDocs(query(this.archivedCollection, where('__name__', '==', id)));
      
      if (!archivedDoc.empty) {
        const archivedData = archivedDoc.docs[0].data();
        const { archivedAt, ...rebuttalData } = archivedData;
        await addDoc(this.rebuttalsCollection, {
          ...rebuttalData,
          updatedAt: new Date().toISOString()
        });
        await deleteDoc(archivedRef);
      }
      return id;
    } catch (error) {
      console.error('Error unarchiving rebuttal:', error);
      throw error;
    }
  }

  // Delete a rebuttal
  async deleteRebuttal(id) {
    try {
      if (!this.isOnline) {
        this.pendingOperations.push({
          type: 'delete',
          id
        });
        return 'pending';
      }

      const rebuttalRef = doc(this.rebuttalsCollection, id);
      await deleteDoc(rebuttalRef);
      return id;
    } catch (error) {
      console.error('Error deleting rebuttal:', error);
      throw error;
    }
  }

  async retryConnection() {
    try {
      await enableNetwork(this.db);
      return true;
    } catch (error) {
      console.error('Error retrying connection:', error);
      return false;
    }
  }

  cleanup() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  // Add a new category
  async addCategory(categoryData) {
    try {
      if (!this.isOnline) {
        this.pendingOperations.push({
          type: 'addCategory',
          data: categoryData
        });
        return 'pending';
      }

      const docRef = await addDoc(this.categoriesCollection, {
        ...categoryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...categoryData };
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  // Update a category
  async updateCategory(id, categoryData) {
    try {
      if (!this.isOnline) {
        this.pendingOperations.push({
          type: 'updateCategory',
          id,
          data: categoryData
        });
        return 'pending';
      }

      const categoryRef = doc(this.categoriesCollection, id);
      await updateDoc(categoryRef, {
        ...categoryData,
        updatedAt: new Date().toISOString()
      });
      return { id, ...categoryData };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Delete a category
  async deleteCategory(id) {
    try {
      if (!this.isOnline) {
        this.pendingOperations.push({
          type: 'deleteCategory',
          id
        });
        return 'pending';
      }

      // Check if category is in use
      const rebuttalsQuery = query(
        this.rebuttalsCollection,
        where('category', '==', id)
      );
      const rebuttalsSnapshot = await getDocs(rebuttalsQuery);
      
      if (!rebuttalsSnapshot.empty) {
        throw new Error('Cannot delete category that is in use by rebuttals');
      }

      const categoryRef = doc(this.categoriesCollection, id);
      await deleteDoc(categoryRef);
      return id;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  async resetAllRebuttals() {
    try {
      console.log('Starting to reset all rebuttals...');
      
      // First, ensure default categories exist
      const defaultCategories = [
        { name: "Can't Afford", icon: "💰", slug: "cant-afford" },
        { name: "Reset Appointment", icon: "🔄", slug: "reset-appt" },
        { name: "Not Interested", icon: "❌", slug: "not-interested" },
        { name: "Spouse Consultation", icon: "💑", slug: "spouse-consultation" },
        { name: "One Decision Maker", icon: "👤", slug: "one-legger" },
        { name: "Not Ready", icon: "⏳", slug: "not-ready" },
        { name: "Just Curious", icon: "🤔", slug: "curious" },
        { name: "Time Concern", icon: "⏰", slug: "time-concern" },
        { name: "Spouse Issues", icon: "👫", slug: "spouse" },
        { name: "Price Over Phone", icon: "📞", slug: "price-phone" },
        { name: "Repair Only", icon: "🔧", slug: "repair" },
        { name: "Government Grants", icon: "🏛️", slug: "government-grants" },
        { name: "No Request", icon: "🚫", slug: "no-request" },
        { name: "Bad Reviews", icon: "⭐", slug: "bad-reviews" }
      ];

      // Get existing categories
      const categoriesQuery = query(this.categoriesCollection);
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const existingCategories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Create a mapping of category slugs to IDs
      const categorySlugToId = existingCategories.reduce((acc, cat) => {
        const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
        acc[slug] = cat.id;
        return acc;
      }, {});

      // Create a batch for category operations
      const categoryBatch = writeBatch(this.db);

      // Add missing categories
      for (const defaultCat of defaultCategories) {
        const existingCat = existingCategories.find(cat => 
          cat.slug === defaultCat.slug || 
          cat.name.toLowerCase() === defaultCat.name.toLowerCase()
        );

        if (!existingCat) {
          const newCategoryRef = doc(collection(this.db, 'categories'));
          categoryBatch.set(newCategoryRef, {
            ...defaultCat,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          // Add to mapping for immediate use
          categorySlugToId[defaultCat.slug] = newCategoryRef.id;
        }
      }

      // Commit category changes
      await categoryBatch.commit();
      console.log('Categories updated successfully');

      // Get all existing rebuttals
      const existingRebuttals = await this.getAllRebuttals();
      console.log(`Found ${existingRebuttals.length} existing rebuttals to delete`);
      
      // Create a batch for rebuttal operations
      const rebuttalBatch = writeBatch(this.db);
      
      // Delete all existing rebuttals
      existingRebuttals.forEach(rebuttal => {
        const rebuttalRef = doc(this.db, 'rebuttals', rebuttal.id);
        rebuttalBatch.delete(rebuttalRef);
      });
      
      // Create new default rebuttals with proper category mapping
      for (const rebuttal of DEFAULT_REBUTTALS) {
        const categoryId = categorySlugToId[rebuttal.category];
        if (!categoryId) {
          console.warn(`Category ${rebuttal.category} not found in mapping, skipping rebuttal`);
          continue;
        }

        const rebuttalRef = doc(collection(this.db, 'rebuttals'));
        rebuttalBatch.set(rebuttalRef, {
          ...rebuttal,
          category: categoryId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          archived: false
        });
      }
      
      // Commit the rebuttal batch
      await rebuttalBatch.commit();
      console.log('Successfully reset all rebuttals');
      
      // Verify the reset
      const verifyRebuttals = await this.getAllRebuttals();
      console.log(`Verified ${verifyRebuttals.length} rebuttals after reset`);
      
      return true;
    } catch (error) {
      console.error('Error resetting rebuttals:', error);
      throw error;
    }
  }
}

// Create a single instance of the service
const rebuttalsService = new RebuttalsService();

export default rebuttalsService;

// Default categories to initialize the collection
const DEFAULT_REBUTTALS = [
  {
    title: "Can't Afford Right Now",
    category: "cant-afford",
    objection: "I can't afford this right now",
    response: {
      pt1: "I understand that cost is an important consideration. We actually have a special 12-month promotion that makes this more affordable than you might think. Would you like to hear about our current offer?",
      pt2: "Our current promotion includes flexible payment options and no obligation. Would you be available for a quick consultation to discuss how we can make this work for your budget?"
    },
    icon: "💰",
    color: "#9B59B6",
    tags: ["price", "budget", "payment", "affordability"],
    steps: ["Acknowledge concern", "Present value", "Mention promotion", "Ask for availability"],
    tips: ["Focus on value", "Emphasize flexibility", "Highlight current promotion"]
  },
  {
    title: "Need to Reset Appointment",
    category: "reset-appt",
    objection: "I need to reschedule my appointment",
    response: {
      pt1: "I understand that schedules can change. I'd be happy to help you find a new time that works better for you. What's a good time for you?",
      pt2: "We have several convenient time slots available. Would you prefer morning, afternoon, or evening? I can help you find the perfect time."
    },
    icon: "🔄",
    color: "#F1C40F",
    tags: ["schedule", "reschedule", "appointment", "timing"],
    steps: ["Acknowledge request", "Offer assistance", "Suggest alternatives", "Confirm new time"],
    tips: ["Be flexible", "Offer multiple options", "Confirm availability"]
  },
  {
    title: "Not Interested",
    category: "not-interested",
    objection: "I'm not interested",
    response: {
      pt1: "I understand. Before you go, I'd like to share a quick overview of what makes our service unique. Many of our customers were initially hesitant but found great value in our approach.",
      pt2: "Would you be open to hearing about our current promotion? It's a limited-time offer that many of our customers have found compelling."
    },
    icon: "❌",
    color: "#FF6B6B",
    tags: ["disinterest", "value", "promotion", "benefits"],
    steps: ["Acknowledge position", "Present value", "Mention promotion", "Ask for consideration"],
    tips: ["Stay positive", "Focus on benefits", "Respect decision"]
  },
  {
    title: "Need to Consult Spouse",
    category: "spouse-consultation",
    objection: "I need to talk to my spouse first",
    response: {
      pt1: "That's completely understandable. Making decisions together is important. Would it be helpful if I provided some information you could share with your spouse?",
      pt2: "I can also schedule a time when you're both available to discuss this together. What would work better for you?"
    },
    icon: "💑",
    color: "#4ECDC4",
    tags: ["spouse", "decision", "consultation", "family"],
    steps: ["Acknowledge concern", "Offer information", "Suggest joint meeting", "Find convenient time"],
    tips: ["Be supportive", "Provide materials", "Offer flexibility"]
  },
  {
    title: "One Decision Maker",
    category: "one-legger",
    objection: "I'm the only one making this decision",
    response: {
      pt1: "I understand you're the decision maker. That actually makes this process more straightforward. Would you like to hear about our current promotion?",
      pt2: "Since you're making the decision, I can focus on addressing your specific needs and concerns. What aspects are most important to you?"
    },
    icon: "👤",
    color: "#45B7D1",
    tags: ["decision", "authority", "promotion", "needs"],
    steps: ["Acknowledge authority", "Present value", "Focus on needs", "Ask for input"],
    tips: ["Respect authority", "Be direct", "Focus on benefits"]
  },
  {
    title: "Not Ready to Start",
    category: "not-ready",
    objection: "I'm not ready to start yet",
    response: {
      pt1: "I understand you want to take your time with this decision. That's completely reasonable. Would you like to learn more about our current promotion?",
      pt2: "Our promotion is time-sensitive, but I can help you understand what's involved so you can make an informed decision when you're ready."
    },
    icon: "⏳",
    color: "#96CEB4",
    tags: ["timing", "decision", "promotion", "information"],
    steps: ["Acknowledge position", "Present value", "Mention timing", "Offer information"],
    tips: ["Be patient", "Provide information", "Respect timeline"]
  },
  {
    title: "Just Curious",
    category: "curious",
    objection: "I was just curious",
    response: {
      pt1: "That's great! Curiosity often leads to great opportunities. Would you like to learn more about what makes our service unique?",
      pt2: "Many of our best customers started out just like you - curious about what we offer. I'd be happy to share more details about our current promotion."
    },
    icon: "🤔",
    color: "#FFEEAD",
    tags: ["interest", "information", "promotion", "opportunity"],
    steps: ["Acknowledge interest", "Present value", "Share information", "Suggest next steps"],
    tips: ["Be informative", "Highlight benefits", "Create interest"]
  },
  {
    title: "Time Concern",
    category: "time-concern",
    objection: "I don't have time for this",
    response: {
      pt1: "I understand time is valuable. Our process is actually quite efficient, and I can give you a quick overview of what's involved.",
      pt2: "Would you be open to a brief 15-minute consultation? I can help you understand if this is worth your time."
    },
    icon: "⏰",
    color: "#D4A5A5",
    tags: ["time", "efficiency", "consultation", "value"],
    steps: ["Acknowledge concern", "Present efficiency", "Offer quick overview", "Suggest brief meeting"],
    tips: ["Be concise", "Respect time", "Focus on value"]
  },
  {
    title: "Spouse Issues",
    category: "spouse",
    objection: "My spouse won't agree to this",
    response: {
      pt1: "I understand that getting your spouse's agreement is important. Would it help if I provided some information you could share with them?",
      pt2: "Many couples find our approach appealing because of its flexibility and benefits. I can explain how it might work for your specific situation."
    },
    icon: "👫",
    color: "#3498DB",
    tags: ["spouse", "agreement", "information", "benefits"],
    steps: ["Acknowledge concern", "Offer information", "Present benefits", "Suggest discussion"],
    tips: ["Be supportive", "Provide materials", "Focus on benefits"]
  },
  {
    title: "Price Over Phone",
    category: "price-phone",
    objection: "I need the price over the phone",
    response: {
      pt1: "I understand you want to know the price. To provide you with the most accurate quote, I need to understand your specific needs.",
      pt2: "Would you be open to a quick 15-minute consultation? This will help me give you the most accurate price for your situation."
    },
    icon: "📞",
    color: "#E67E22",
    tags: ["price", "quote", "consultation", "needs"],
    steps: ["Acknowledge request", "Explain process", "Offer consultation", "Emphasize accuracy"],
    tips: ["Be transparent", "Focus on value", "Request consultation"]
  },
  {
    title: "Repair Only",
    category: "repair",
    objection: "I only need repairs",
    response: {
      pt1: "I understand you're focused on repairs. We actually offer comprehensive solutions that can prevent future issues and save you money in the long run.",
      pt2: "Would you like to hear about how our approach can address both your immediate repair needs and prevent future problems?"
    },
    icon: "🔧",
    color: "#2ECC71",
    tags: ["repair", "prevention", "savings", "solution"],
    steps: ["Acknowledge need", "Present value", "Explain benefits", "Offer information"],
    tips: ["Focus on prevention", "Highlight savings", "Present value"]
  },
  {
    title: "Government Grants",
    category: "government-grants",
    objection: "I'm waiting for government grants",
    response: {
      pt1: "I understand you're interested in government grants. We can help you understand what's available and how our service can complement any grants you receive.",
      pt2: "Would you like to learn more about how our current promotion can work alongside government assistance programs?"
    },
    icon: "🏛️",
    color: "#34495E",
    tags: ["grants", "government", "assistance", "promotion"],
    steps: ["Acknowledge interest", "Present options", "Explain benefits", "Offer information"],
    tips: ["Be informative", "Focus on compatibility", "Highlight benefits"]
  },
  {
    title: "No Request",
    category: "no-request",
    objection: "I didn't request this information",
    response: {
      pt1: "I apologize if this contact was unexpected. I'm reaching out because we have a special promotion that might interest you.",
      pt2: "Would you like to hear about our current offer? If not, I'll be happy to remove you from our contact list."
    },
    icon: "🚫",
    color: "#E74C3C",
    tags: ["unexpected", "promotion", "respect", "choice"],
    steps: ["Apologize", "Present value", "Offer choice", "Respect decision"],
    tips: ["Be respectful", "Offer value", "Provide choice"]
  },
  {
    title: "Bad Reviews",
    category: "bad-reviews",
    objection: "I've heard bad reviews about your service",
    response: {
      pt1: "I appreciate you sharing that concern. We take feedback seriously and have made significant improvements based on customer input.",
      pt2: "Would you be open to hearing about our current standards and how we've addressed past concerns? Many of our recent customers have been very satisfied."
    },
    icon: "⭐",
    color: "#1ABC9C",
    tags: ["reviews", "improvement", "satisfaction", "standards"],
    steps: ["Acknowledge concern", "Present improvements", "Share recent feedback", "Offer information"],
    tips: ["Be honest", "Focus on improvements", "Share success stories"]
  },
  {
    title: "Competitor Comparison",
    category: "not-interested",
    objection: "I'm going with a competitor",
    response: {
      pt1: "I understand you're considering other options. Before you make your final decision, I'd like to share what makes our service unique and how we might better meet your needs.",
      pt2: "Would you be open to a quick comparison of our services? I can highlight the key differences that might make us a better choice for you."
    },
    icon: "🔄",
    color: "#FF6B6B",
    tags: ["competition", "comparison", "value", "benefits"],
    steps: ["Acknowledge choice", "Present value", "Offer comparison", "Highlight differences"],
    tips: ["Stay professional", "Focus on strengths", "Respect competition"]
  },
  {
    title: "Too Expensive",
    category: "cant-afford",
    objection: "Your service is too expensive",
    response: {
      pt1: "I understand your concern about the price. Let me explain how our service actually saves you money in the long run through efficiency and prevention.",
      pt2: "We also have flexible payment options and a current promotion that might make this more affordable than you think. Would you like to hear about these options?"
    },
    icon: "💰",
    color: "#9B59B6",
    tags: ["price", "value", "savings", "payment"],
    steps: ["Acknowledge concern", "Explain value", "Present options", "Offer promotion"],
    tips: ["Focus on long-term value", "Highlight savings", "Present payment options"]
  },
  {
    title: "Bad Experience",
    category: "bad-reviews",
    objection: "I had a bad experience before",
    response: {
      pt1: "I'm sorry to hear about your previous experience. We've made significant improvements to our service based on customer feedback.",
      pt2: "Would you be open to hearing about how we've addressed those issues? Many customers who had concerns in the past have been pleasantly surprised by our current service."
    },
    icon: "⭐",
    color: "#1ABC9C",
    tags: ["experience", "improvement", "service", "feedback"],
    steps: ["Acknowledge experience", "Present improvements", "Share success stories", "Offer information"],
    tips: ["Be empathetic", "Focus on improvements", "Share positive outcomes"]
  },
  {
    title: "Price Negotiation",
    category: "cant-afford",
    objection: "Can you lower the price?",
    response: {
      pt1: "I understand you're looking for the best value. While our prices are set to reflect the quality of our service, we do have a current promotion that offers significant savings.",
      pt2: "Would you like to hear about our current offer? It includes additional benefits that make it an even better value."
    },
    icon: "💰",
    color: "#9B59B6",
    tags: ["price", "negotiation", "value", "promotion"],
    steps: ["Acknowledge request", "Present value", "Mention promotion", "Highlight benefits"],
    tips: ["Stay firm on value", "Focus on benefits", "Present promotion"]
  },
  {
    title: "Need to Research",
    category: "not-ready",
    objection: "I need to do more research",
    response: {
      pt1: "That's a wise approach. I'd be happy to provide you with more information to help with your research. What specific aspects would you like to know more about?",
      pt2: "We also have customer testimonials and case studies that might be helpful. Would you like me to share those with you?"
    },
    icon: "📚",
    color: "#96CEB4",
    tags: ["research", "information", "education", "decision"],
    steps: ["Support decision", "Offer information", "Provide resources", "Suggest next steps"],
    tips: ["Be helpful", "Provide value", "Respect process"]
  },
  {
    title: "Too Busy",
    category: "time-concern",
    objection: "I'm too busy right now",
    response: {
      pt1: "I understand you're busy. Our process is designed to be efficient and convenient. I can give you a quick overview of what's involved.",
      pt2: "Would you be open to a brief 15-minute consultation? I can help you determine if this is worth your time."
    },
    icon: "⏰",
    color: "#D4A5A5",
    tags: ["time", "efficiency", "convenience", "value"],
    steps: ["Acknowledge concern", "Present efficiency", "Offer quick overview", "Suggest brief meeting"],
    tips: ["Be concise", "Respect time", "Focus on value"]
  },
  {
    title: "Need to Compare",
    category: "not-ready",
    objection: "I need to compare options",
    response: {
      pt1: "That's a smart approach. I'd be happy to provide you with a detailed comparison of our services versus other options.",
      pt2: "Would you like me to share our comparison guide? It highlights the key differences and benefits of our approach."
    },
    icon: "📊",
    color: "#96CEB4",
    tags: ["comparison", "information", "education", "decision"],
    steps: ["Support decision", "Offer comparison", "Provide information", "Suggest next steps"],
    tips: ["Be informative", "Focus on strengths", "Provide value"]
  },
  {
    title: "Not Priority",
    category: "not-ready",
    objection: "This isn't a priority right now",
    response: {
      pt1: "I understand this might not be your top priority. However, addressing this now could prevent more urgent issues in the future.",
      pt2: "Would you like to hear about how our service can help you avoid potential problems down the line?"
    },
    icon: "⏳",
    color: "#96CEB4",
    tags: ["priority", "prevention", "value", "timing"],
    steps: ["Acknowledge position", "Present value", "Explain benefits", "Offer information"],
    tips: ["Focus on prevention", "Highlight urgency", "Present value"]
  },
  {
    title: "Need to Budget",
    category: "cant-afford",
    objection: "I need to budget for this",
    response: {
      pt1: "I understand the importance of budgeting. We offer flexible payment options that can help you plan your expenses.",
      pt2: "Would you like to hear about our current promotion and payment plans? They're designed to make this more manageable for your budget."
    },
    icon: "💰",
    color: "#9B59B6",
    tags: ["budget", "payment", "planning", "options"],
    steps: ["Acknowledge concern", "Present options", "Explain benefits", "Offer information"],
    tips: ["Be flexible", "Focus on planning", "Present options"]
  },
  {
    title: "Need to Save",
    category: "cant-afford",
    objection: "I need to save up for this",
    response: {
      pt1: "I understand you want to save up. We actually have a special promotion that can help you get started sooner while still being budget-friendly.",
      pt2: "Would you like to hear about our current offer? It includes flexible payment options that might work better for your savings plan."
    },
    icon: "💰",
    color: "#9B59B6",
    tags: ["savings", "budget", "payment", "promotion"],
    steps: ["Acknowledge concern", "Present value", "Mention promotion", "Offer options"],
    tips: ["Be flexible", "Focus on savings", "Present options"]
  },
  {
    title: "Need More Information",
    category: "curious",
    objection: "I need more information before deciding",
    response: {
      pt1: "I'd be happy to provide you with more detailed information. What specific aspects would you like to know more about?",
      pt2: "We have comprehensive guides and case studies that might help you make an informed decision. Would you like me to share those with you?"
    },
    icon: "📚",
    color: "#FFEEAD",
    tags: ["information", "education", "decision", "details"],
    steps: ["Acknowledge need", "Offer information", "Ask for specifics", "Provide resources"],
    tips: ["Be informative", "Focus on details", "Provide value"]
  },
  {
    title: "Want to Learn More",
    category: "curious",
    objection: "I want to learn more about your service",
    response: {
      pt1: "I'd be happy to walk you through our service in detail. What aspects are you most interested in learning about?",
      pt2: "We have a special presentation that highlights our unique approach and benefits. Would you like me to share that with you?"
    },
    icon: "🎓",
    color: "#FFEEAD",
    tags: ["education", "information", "benefits", "details"],
    steps: ["Acknowledge interest", "Offer details", "Present value", "Suggest next steps"],
    tips: ["Be thorough", "Focus on benefits", "Create interest"]
  },
  {
    title: "Need to Check Schedule",
    category: "reset-appt",
    objection: "I need to check my schedule first",
    response: {
      pt1: "I understand you need to check your availability. I can hold a few time slots for you while you check your schedule.",
      pt2: "What time of day typically works best for you? I can help you find a convenient time that fits your schedule."
    },
    icon: "📅",
    color: "#F1C40F",
    tags: ["schedule", "availability", "timing", "convenience"],
    steps: ["Acknowledge need", "Offer flexibility", "Suggest times", "Confirm availability"],
    tips: ["Be flexible", "Offer options", "Respect schedule"]
  },
  {
    title: "Need to Check Calendar",
    category: "reset-appt",
    objection: "I need to check my calendar",
    response: {
      pt1: "I understand you need to check your calendar. I can help you find a time that works with your schedule.",
      pt2: "Would you prefer morning, afternoon, or evening appointments? I can hold some slots for you while you check."
    },
    icon: "📆",
    color: "#F1C40F",
    tags: ["calendar", "scheduling", "availability", "convenience"],
    steps: ["Acknowledge need", "Offer options", "Suggest times", "Confirm preference"],
    tips: ["Be flexible", "Offer choices", "Respect schedule"]
  },
  {
    title: "Need to Check with Team",
    category: "one-legger",
    objection: "I need to check with my team first",
    response: {
      pt1: "I understand you need to consult with your team. Would it be helpful if I provided some information you could share with them?",
      pt2: "I can also schedule a time when your team can be present to discuss this together. What would work better for you?"
    },
    icon: "👥",
    color: "#45B7D1",
    tags: ["team", "consultation", "decision", "meeting"],
    steps: ["Acknowledge need", "Offer information", "Suggest meeting", "Find convenient time"],
    tips: ["Be supportive", "Provide materials", "Offer flexibility"]
  },
  {
    title: "Need Team Approval",
    category: "one-legger",
    objection: "I need team approval for this",
    response: {
      pt1: "I understand you need team approval. I can provide you with a comprehensive proposal that addresses all the key points your team will need to consider.",
      pt2: "Would you like me to prepare a presentation that you can share with your team? It includes all the benefits and ROI calculations they'll need."
    },
    icon: "✅",
    color: "#45B7D1",
    tags: ["approval", "team", "proposal", "benefits"],
    steps: ["Acknowledge need", "Offer proposal", "Present benefits", "Suggest next steps"],
    tips: ["Be thorough", "Focus on ROI", "Provide materials"]
  },
  {
    title: "Need to Check Budget",
    category: "cant-afford",
    objection: "I need to check my budget first",
    response: {
      pt1: "I understand you need to review your budget. We offer flexible payment options that can work with various budget constraints.",
      pt2: "Would you like to hear about our current promotion? It includes payment plans designed to fit different budget situations."
    },
    icon: "💰",
    color: "#9B59B6",
    tags: ["budget", "payment", "options", "promotion"],
    steps: ["Acknowledge need", "Present options", "Mention promotion", "Offer flexibility"],
    tips: ["Be flexible", "Focus on options", "Present value"]
  },
  {
    title: "Need to Check Finances",
    category: "cant-afford",
    objection: "I need to check my finances",
    response: {
      pt1: "I understand you need to review your finances. We have several payment options that can accommodate different financial situations.",
      pt2: "Would you like to hear about our current promotion? It includes flexible payment terms that might work better for your financial situation."
    },
    icon: "💳",
    color: "#9B59B6",
    tags: ["finances", "payment", "options", "promotion"],
    steps: ["Acknowledge need", "Present options", "Mention promotion", "Offer flexibility"],
    tips: ["Be flexible", "Focus on options", "Present value"]
  },
  {
    title: "Need to Check Reviews",
    category: "bad-reviews",
    objection: "I need to check your reviews first",
    response: {
      pt1: "I understand you want to check our reviews. We're proud of our recent customer feedback and would be happy to share some recent testimonials.",
      pt2: "Would you like to hear about some recent success stories? Many of our customers have shared their positive experiences."
    },
    icon: "⭐",
    color: "#1ABC9C",
    tags: ["reviews", "testimonials", "feedback", "success"],
    steps: ["Acknowledge need", "Share testimonials", "Present success stories", "Offer information"],
    tips: ["Be honest", "Share recent feedback", "Focus on improvements"]
  },
  {
    title: "Need to Check References",
    category: "bad-reviews",
    objection: "I need to check your references",
    response: {
      pt1: "I understand you want to check our references. We have several satisfied customers who would be happy to share their experiences.",
      pt2: "Would you like me to connect you with some of our recent customers? They can provide firsthand feedback about our service."
    },
    icon: "📞",
    color: "#1ABC9C",
    tags: ["references", "testimonials", "feedback", "success"],
    steps: ["Acknowledge need", "Offer references", "Share success stories", "Connect with customers"],
    tips: ["Be transparent", "Share references", "Focus on satisfaction"]
  }
];

// Initialize default rebuttals if none exist
const initializeDefaultRebuttals = async () => {
  try {
    const rebuttalsRef = collection(this.db, 'rebuttals');
    const snapshot = await getDocs(rebuttalsRef);
    
    if (snapshot.empty) {
      console.log('Initializing default rebuttals...');
      const user = auth.currentUser;
      
      for (const rebuttal of DEFAULT_REBUTTALS) {
        await addDoc(rebuttalsRef, {
          title: rebuttal.title,
          category: rebuttal.category,
          objection: rebuttal.objection,
          response: rebuttal.response,
          icon: rebuttal.icon,
          color: rebuttal.color,
          tags: rebuttal.tags,
          steps: rebuttal.steps,
          tips: rebuttal.tips,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      console.log('Default rebuttals initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing default rebuttals:', error);
    throw error;
  }
};

export const getRebuttals = async () => {
  try {
    checkFirebaseConnection();
    console.log('Fetching rebuttals...');
    
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to access rebuttals');
    }
    
    // Initialize default rebuttals if none exist
    await initializeDefaultRebuttals();
    
    const rebuttalsRef = collection(this.db, 'rebuttals');
    const snapshot = await getDocs(rebuttalsRef);
    
    if (snapshot.empty) {
      console.log('No rebuttals found');
      return [];
    }
    
    const rebuttals = snapshot.docs.map(doc => ({
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
};

export const addRebuttal = async (rebuttal) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to add rebuttals');
    }
    
    const rebuttalsRef = collection(this.db, 'rebuttals');
    const docRef = await addDoc(rebuttalsRef, {
      title: rebuttal.title,
      category: rebuttal.category,
      objection: rebuttal.objection,
      response: rebuttal.response,
      icon: rebuttal.icon,
      color: rebuttal.color,
      tags: rebuttal.tags,
      steps: rebuttal.steps,
      tips: rebuttal.tips,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...rebuttal };
  } catch (error) {
    console.error('Error adding rebuttal:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to add rebuttals. Please make sure you are logged in as an admin.');
    }
    throw error;
  }
};

export const updateRebuttal = async (rebuttalId, rebuttal) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update rebuttals');
    }
    
    const rebuttalRef = doc(this.db, 'rebuttals', rebuttalId);
    await updateDoc(rebuttalRef, {
      title: rebuttal.title,
      category: rebuttal.category,
      objection: rebuttal.objection,
      response: rebuttal.response,
      icon: rebuttal.icon,
      color: rebuttal.color,
      tags: rebuttal.tags,
      steps: rebuttal.steps,
      tips: rebuttal.tips,
      updatedBy: user.uid,
      updatedAt: new Date().toISOString()
    });
    return { id: rebuttalId, ...rebuttal };
  } catch (error) {
    console.error('Error updating rebuttal:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update rebuttals. Please make sure you are logged in as an admin.');
    }
    throw error;
  }
};

export const deleteRebuttal = async (rebuttalId) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to delete rebuttals');
    }
    
    const rebuttalRef = doc(this.db, 'rebuttals', rebuttalId);
    await deleteDoc(rebuttalRef);
    return rebuttalId;
  } catch (error) {
    console.error('Error deleting rebuttal:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to delete rebuttals. Please make sure you are logged in as an admin.');
    }
    throw error;
  }
}; 