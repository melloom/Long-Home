import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase/config.js';

const createManager = async () => {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, 'manager@longhome.com', '123456');
    const user = userCredential.user;
    console.log('Successfully created user:', user.email);

    // Add user to admins collection
    const adminRef = doc(db, 'admins', user.uid);
    await setDoc(adminRef, {
      email: user.email,
      role: 'admin',
      displayName: 'Manager',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });

    console.log('Successfully added user to admins collection');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.error('This email is already registered');
    } else if (error.code === 'permission-denied') {
      console.error('Permission denied. Please check Firestore rules');
    }
  }
};

createManager(); 