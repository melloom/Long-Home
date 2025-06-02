import { db } from './firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { checkFirebaseConnection } from './firebase/config';

const SERVICE_TOPICS_COLLECTION = 'serviceTopics';
const CATEGORIES_COLLECTION = 'customerServiceCategories';

// Default service topics to initialize the collection
const DEFAULT_SERVICE_TOPICS = [
  // Appointment Management Topics
  {
    topic: 'appointments',
    title: 'Appointment Management',
    description: 'Handle all appointment-related inquiries and requests',
    steps: [
      'Verify customer information',
      'Check availability',
      'Confirm details',
      'Send confirmation'
    ],
    tips: [
      'Be flexible with timing',
      'Offer alternatives',
      'Document all changes'
    ],
    keywords: ['appointments', 'scheduling', 'management'],
    isUrgent: false
  },
  {
    topic: 'appointments',
    title: 'Appointment Verification',
    description: 'Verify and validate appointment details',
    steps: [
      'Check appointment date and time',
      'Verify customer contact information',
      'Confirm service requirements',
      'Review special instructions'
    ],
    tips: [
      'Double-check all details',
      'Note any special requirements',
      'Update customer records'
    ],
    keywords: ['verification', 'validation', 'details'],
    isUrgent: false
  },
  {
    topic: 'appointments',
    title: 'Appointment Updates',
    description: 'Handle appointment modifications and updates',
    steps: [
      'Review requested changes',
      'Check new availability',
      'Update appointment details',
      'Notify relevant parties'
    ],
    tips: [
      'Be prompt with updates',
      'Maintain clear communication',
      'Document all changes'
    ],
    keywords: ['updates', 'modifications', 'changes'],
    isUrgent: false
  },

  // Scheduling Topics
  {
    topic: 'scheduling',
    title: 'New Appointment Scheduling',
    description: 'Process for scheduling new customer appointments',
    steps: [
      'Collect customer contact information',
      'Determine service requirements',
      'Find optimal time slot',
      'Confirm appointment details'
    ],
    tips: [
      'Offer multiple time options',
      'Consider customer preferences',
      'Check technician availability'
    ],
    keywords: ['new appointment', 'schedule', 'booking'],
    isUrgent: false
  },
  {
    topic: 'scheduling',
    title: 'Bulk Scheduling',
    description: 'Handle multiple appointment scheduling requests',
    steps: [
      'Review all scheduling requests',
      'Group similar appointments',
      'Optimize schedule',
      'Send batch confirmations'
    ],
    tips: [
      'Prioritize urgent requests',
      'Maintain schedule balance',
      'Consider travel time'
    ],
    keywords: ['bulk', 'multiple', 'group scheduling'],
    isUrgent: false
  },
  {
    topic: 'scheduling',
    title: 'Priority Scheduling',
    description: 'Handle urgent and priority scheduling requests',
    steps: [
      'Assess urgency level',
      'Check immediate availability',
      'Coordinate with team',
      'Confirm priority booking'
    ],
    tips: [
      'Respond quickly',
      'Maintain clear communication',
      'Follow up promptly'
    ],
    keywords: ['priority', 'urgent', 'immediate'],
    isUrgent: true
  },

  // Confirmation Topics
  {
    topic: 'confirmation',
    title: 'Appointment Confirmation',
    description: 'Send and manage appointment confirmations',
    steps: [
      'Prepare confirmation details',
      'Send confirmation message',
      'Request acknowledgment',
      'Follow up if needed'
    ],
    tips: [
      'Include all necessary details',
      'Use clear formatting',
      'Provide contact information'
    ],
    keywords: ['confirmation', 'verify', 'acknowledge'],
    isUrgent: false
  },
  {
    topic: 'confirmation',
    title: 'Reminder Notifications',
    description: 'Send appointment reminders to customers',
    steps: [
      'Schedule reminder timing',
      'Prepare reminder message',
      'Send notification',
      'Track delivery status'
    ],
    tips: [
      'Send reminders in advance',
      'Use multiple channels',
      'Include cancellation policy'
    ],
    keywords: ['reminder', 'notification', 'alert'],
    isUrgent: false
  },

  // Cancellation Topics
  {
    topic: 'cancellation',
    title: 'Appointment Cancellation',
    description: 'Process appointment cancellations',
    steps: [
      'Record cancellation reason',
      'Update schedule',
      'Notify relevant parties',
      'Offer rescheduling options'
    ],
    tips: [
      'Be understanding',
      'Document cancellation reason',
      'Maintain professional tone'
    ],
    keywords: ['cancellation', 'cancel', 'terminate'],
    isUrgent: false
  },
  {
    topic: 'cancellation',
    title: 'Rescheduling Process',
    description: 'Handle appointment rescheduling requests',
    steps: [
      'Review rescheduling request',
      'Check new availability',
      'Update appointment details',
      'Send new confirmation'
    ],
    tips: [
      'Be flexible with timing',
      'Offer multiple options',
      'Maintain clear communication'
    ],
    keywords: ['reschedule', 'rescheduling', 'change time'],
    isUrgent: false
  },

  // Follow-up Topics
  {
    topic: 'followup',
    title: 'Service Follow-up',
    description: 'Conduct post-service follow-ups',
    steps: [
      'Review service details',
      'Contact customer',
      'Gather feedback',
      'Address any concerns'
    ],
    tips: [
      'Follow up promptly',
      'Be attentive to feedback',
      'Document all interactions'
    ],
    keywords: ['follow-up', 'feedback', 'service review'],
    isUrgent: false
  },
  {
    topic: 'followup',
    title: 'Customer Satisfaction',
    description: 'Measure and improve customer satisfaction',
    steps: [
      'Send satisfaction survey',
      'Analyze responses',
      'Identify areas for improvement',
      'Implement changes'
    ],
    tips: [
      'Make surveys concise',
      'Act on feedback',
      'Follow up on concerns'
    ],
    keywords: ['satisfaction', 'feedback', 'survey'],
    isUrgent: false
  },
  {
    topic: 'followup',
    title: 'Issue Resolution',
    description: 'Handle post-service issues and complaints',
    steps: [
      'Listen to concerns',
      'Investigate issue',
      'Propose solution',
      'Follow up on resolution'
    ],
    tips: [
      'Respond quickly',
      'Be empathetic',
      'Document all actions'
    ],
    keywords: ['issue', 'complaint', 'resolution'],
    isUrgent: false
  }
];

// Default categories to initialize the collection
const DEFAULT_CATEGORIES = [
  {
    title: 'Appointment Management',
    description: 'Manage and handle appointment-related inquiries',
    icon: '📅',
    keySteps: ['Verify appointment details', 'Check availability', 'Confirm changes'],
    quickTips: ['Be proactive with scheduling', 'Offer alternatives when needed'],
    tags: ['appointments', 'scheduling', 'management']
  },
  {
    title: 'Scheduling',
    description: 'Handle new appointment scheduling requests',
    icon: '⏰',
    keySteps: ['Collect customer information', 'Find suitable time slots', 'Confirm booking'],
    quickTips: ['Offer multiple options', 'Consider customer preferences'],
    tags: ['scheduling', 'booking', 'appointments']
  },
  {
    title: 'Cancellation',
    description: 'Process appointment cancellations and rescheduling',
    icon: '❌',
    keySteps: ['Verify cancellation reason', 'Process cancellation', 'Offer alternatives'],
    quickTips: ['Be understanding', 'Offer rescheduling options'],
    tags: ['cancellation', 'rescheduling', 'appointments']
  },
  {
    title: 'Confirmation',
    description: 'Handle appointment confirmations and reminders',
    icon: '✅',
    keySteps: ['Send confirmation details', 'Verify contact information', 'Set reminders'],
    quickTips: ['Send reminders in advance', 'Include all necessary details'],
    tags: ['confirmation', 'reminders', 'appointments']
  },
  {
    title: 'Follow-up',
    description: 'Manage post-appointment follow-ups',
    icon: '📞',
    keySteps: ['Check service satisfaction', 'Address any concerns', 'Schedule follow-up if needed'],
    quickTips: ['Be prompt with follow-ups', 'Address issues proactively'],
    tags: ['follow-up', 'feedback', 'service']
  }
];

// Initialize default service topics if none exist
const initializeDefaultServiceTopics = async () => {
  try {
    console.log('Checking if service topics need initialization...');
    const q = query(collection(db, SERVICE_TOPICS_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No service topics found. Initializing default topics...');
      const batch = writeBatch(db);
      
      // Add all new topics
      for (const topic of DEFAULT_SERVICE_TOPICS) {
        const docRef = doc(collection(db, SERVICE_TOPICS_COLLECTION));
        batch.set(docRef, {
          ...topic,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
      console.log('Default service topics initialized successfully');
    } else {
      console.log('Service topics already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing default service topics:', error);
    throw error;
  }
};

// Initialize default categories if none exist
const initializeDefaultCategories = async () => {
  try {
    console.log('Checking if categories need initialization...');
    const q = query(collection(db, CATEGORIES_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No categories found. Initializing default categories...');
      const batch = writeBatch(db);
      
      for (const category of DEFAULT_CATEGORIES) {
        const docRef = doc(collection(db, CATEGORIES_COLLECTION));
        batch.set(docRef, {
          ...category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
      console.log('Default categories initialized successfully');
    } else {
      console.log('Categories already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing default categories:', error);
    throw error;
  }
};

export const verifyAndReinitializeTopics = async () => {
  try {
    console.log('Verifying service topics in database...');
    const q = query(collection(db, SERVICE_TOPICS_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.docs.length} topics in database`);
    
    if (querySnapshot.empty) {
      console.log('No topics found, initializing default topics...');
      await initializeDefaultServiceTopics();
      
      // Fetch the newly initialized topics
      const newSnapshot = await getDocs(q);
      console.log(`Now have ${newSnapshot.docs.length} topics in database`);
      
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
    console.error('Error verifying service topics:', error);
    throw error;
  }
};

export const getServiceTopics = async () => {
  try {
    await checkFirebaseConnection();
    
    console.log('Fetching service topics...');
    const q = query(collection(db, SERVICE_TOPICS_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No topics found, initializing default topics...');
      await initializeDefaultServiceTopics();
      // Fetch the newly initialized topics
      const newSnapshot = await getDocs(q);
      const topics = newSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`Successfully fetched ${topics.length} service topics`);
      return topics;
    }

    const topics = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`Successfully fetched ${topics.length} service topics`);
    return topics;
  } catch (error) {
    console.error('Error fetching service topics:', error);
    throw new Error('Failed to fetch service topics. Please try again.');
  }
};

export const getServiceTopicsByCategory = async (category) => {
  try {
    await checkFirebaseConnection();
    
    console.log(`Fetching service topics for category: ${category}`);
    const q = query(
      collection(db, SERVICE_TOPICS_COLLECTION),
      where('topic', '==', category),
      orderBy('title')
    );
    const querySnapshot = await getDocs(q);
    
    const topics = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Successfully fetched ${topics.length} service topics for category ${category}`);
    return topics;
  } catch (error) {
    console.error('Error fetching service topics by category:', error);
    throw new Error('Failed to fetch service topics. Please try again.');
  }
};

export const getUrgentServiceTopics = async () => {
  try {
    await checkFirebaseConnection();
    
    console.log('Fetching urgent service topics...');
    const q = query(
      collection(db, SERVICE_TOPICS_COLLECTION),
      where('isUrgent', '==', true),
      orderBy('title')
    );
    const querySnapshot = await getDocs(q);
    
    const topics = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Successfully fetched ${topics.length} urgent service topics`);
    return topics;
  } catch (error) {
    console.error('Error fetching urgent service topics:', error);
    throw new Error('Failed to fetch urgent service topics. Please try again.');
  }
};

export const addServiceTopic = async (topicData) => {
  try {
    await checkFirebaseConnection();
    
    console.log('Adding new service topic...');
    const docRef = await addDoc(collection(db, SERVICE_TOPICS_COLLECTION), {
      ...topicData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('Service topic added successfully with ID:', docRef.id);
    return {
      id: docRef.id,
      ...topicData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error adding service topic:', error);
    throw new Error('Failed to add service topic. Please try again.');
  }
};

export const updateServiceTopic = async (topicId, topicData) => {
  try {
    await checkFirebaseConnection();
    
    console.log('Updating service topic:', topicId);
    const topicRef = doc(db, SERVICE_TOPICS_COLLECTION, topicId);
    await updateDoc(topicRef, {
      ...topicData,
      updatedAt: new Date().toISOString()
    });

    console.log('Service topic updated successfully');
    return {
      id: topicId,
      ...topicData,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating service topic:', error);
    throw new Error('Failed to update service topic. Please try again.');
  }
};

export const deleteServiceTopic = async (topicId) => {
  try {
    await checkFirebaseConnection();
    
    console.log('Deleting service topic:', topicId);
    const topicRef = doc(db, SERVICE_TOPICS_COLLECTION, topicId);
    await deleteDoc(topicRef);

    console.log('Service topic deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting service topic:', error);
    throw new Error('Failed to delete service topic. Please try again.');
  }
};

export const getCategories = async () => {
  try {
    await checkFirebaseConnection();
    console.log('Fetching service categories...');
    
    // Initialize default categories if needed
    await initializeDefaultCategories();
    
    const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('title'));
    const querySnapshot = await getDocs(q);
    
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Successfully fetched ${categories.length} categories:`, categories);
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories. Please try again.');
  }
};

export const resetServiceTopics = async () => {
  try {
    // Check Firebase connection
    await checkFirebaseConnection();

    // Get a reference to the service topics collection
    const topicsRef = collection(db, SERVICE_TOPICS_COLLECTION);
    
    // Get all existing topics
    const snapshot = await getDocs(topicsRef);
    
    // Create a batch write
    const batch = writeBatch(db);
    
    // Delete all existing topics
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Add all default topics
    DEFAULT_SERVICE_TOPICS.forEach((topic) => {
      const newTopicRef = doc(topicsRef);
      batch.set(newTopicRef, {
        ...topic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
    
    // Commit the batch
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error('Error resetting service topics:', error);
    throw error;
  }
}; 