import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase/config.js';

const addToAdmins = async () => {
  try {
    // First sign in to get the user
    const userCredential = await signInWithEmailAndPassword(auth, 'tgibbs@longhome.com', '123456');
    const user = userCredential.user;
    console.log('Successfully signed in user:', user.email);

    // Add user to admins collection
    const adminRef = doc(db, 'admins', user.uid);
    await setDoc(adminRef, {
      email: user.email,
      role: 'admin',
      displayName: user.displayName || '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }, { merge: true });

    console.log('Successfully added user to admins collection');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'auth/invalid-credential') {
      console.error('Invalid email or password');
    } else if (error.code === 'permission-denied') {
      console.error('Permission denied. Please check Firestore rules');
    }
  }
};

addToAdmins(); 