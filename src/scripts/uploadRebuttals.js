import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: "AIzaSyDxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  authDomain: "longhome.firebaseapp.com",
  projectId: "longhome",
  storageBucket: "longhome.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:1234567890123456789012"
};

const resetAppointmentRebuttals = [
  {
    id: 12,
    title: "Professional response to reset appointment requests",
    category: "Reset Appointment",
    summary: "Customer requests to reset their appointment",
    content: {
      pt1: "I understand you'd like to reschedule your appointment. I'd be happy to help you with that. Could you please let me know what time would work better for you?",
      pt2: "While we're rescheduling, I want to make sure we have all the necessary information to provide you with the best service possible. Could you confirm if there are any specific concerns or requirements we should be aware of for the new appointment?"
    },
    tags: ["reschedule", "appointment", "professional"],
    createdAt: new Date().toISOString()
  },
  {
    id: 12.1,
    title: "Follow-up response for reset appointment requests",
    category: "Reset Appointment",
    summary: "Customer needs to reschedule due to time conflict",
    content: {
      pt1: "I see that the current time doesn't work for you. Let me check our available slots to find a more convenient time for your schedule.",
      pt2: "I've found some alternative times that might work better for you. Would you prefer a morning, afternoon, or evening appointment?"
    },
    tags: ["time conflict", "reschedule", "flexibility"],
    createdAt: new Date().toISOString()
  },
  {
    id: 12.2,
    title: "Confirmation response for reset appointment requests",
    category: "Reset Appointment",
    summary: "Customer confirms new appointment time",
    content: {
      pt1: "Great! I've noted your preferred time. Let me confirm the details of your rescheduled appointment to ensure everything is correct.",
      pt2: "Is there anything else you'd like me to know about your upcoming appointment? This will help us prepare better for your visit."
    },
    tags: ["confirmation", "details", "preparation"],
    createdAt: new Date().toISOString()
  },
  {
    id: 12.3,
    title: "Alternative options for reset appointment requests",
    category: "Reset Appointment",
    summary: "Customer needs alternative appointment options",
    content: {
      pt1: "I understand you need some flexibility with the appointment time. Let me present you with a few different options that might work better for your schedule.",
      pt2: "Would you like me to explain the benefits of each time slot to help you make the best choice for your needs?"
    },
    tags: ["alternatives", "flexibility", "options"],
    createdAt: new Date().toISOString()
  },
  {
    id: 12.4,
    title: "Response for urgent reset appointment requests",
    category: "Reset Appointment",
    summary: "Customer needs immediate rescheduling",
    content: {
      pt1: "I understand this is an urgent matter. Let me check our schedule right away to find the earliest possible time for you.",
      pt2: "While I look for the best available slot, could you please confirm if you have any specific time constraints or preferences for the rescheduled appointment?"
    },
    tags: ["urgent", "immediate", "priority"],
    createdAt: new Date().toISOString()
  }
];

const uploadRebuttals = async () => {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('Authenticating with Firebase...');
    await signInWithEmailAndPassword(auth, 'manager@longhome.com', '123456');
    console.log('Authentication successful!');

    console.log('Starting rebuttal upload...');
    for (const rebuttal of resetAppointmentRebuttals) {
      try {
        const docRef = await addDoc(collection(db, 'rebuttals'), rebuttal);
        console.log(`Successfully uploaded rebuttal: ${rebuttal.title} with ID: ${docRef.id}`);
      } catch (error) {
        console.error(`Error uploading rebuttal ${rebuttal.title}:`, error);
      }
    }
    console.log('Upload completed!');
  } catch (error) {
    console.error('Error:', error);
  }
};

uploadRebuttals(); 