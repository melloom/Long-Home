import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import app from './firebase/config';

const auth = getAuth(app);
const db = getFirestore(app);

const userService = {
  // Create a new user
  async createUser(email, password) {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to create users');
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Add user to Firestore
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        email: user.email,
        role: 'user',
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid,
        lastSignIn: null,
        isActive: true,
        emailVerified: false
      });

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Get all users
  async getAllUsers() {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to view users');
      }

      // Get users from Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Update last sign-in time for current user
      if (auth.currentUser) {
        const currentUserDoc = users.find(user => user.uid === auth.currentUser.uid);
        if (currentUserDoc) {
          await this.updateUserLastSignIn(currentUserDoc.id);
        }
      }

      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Update user's last sign-in time
  async updateUserLastSignIn(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastSignIn: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating last sign-in:', error);
    }
  },

  // Delete a user
  async deleteUser(userId) {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to delete users');
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Login user
  async loginUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last sign-in time in Firestore
      const usersSnapshot = await getDocs(query(collection(db, 'users'), where('uid', '==', userCredential.user.uid)));
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        await this.updateUserLastSignIn(userDoc.id);
      }

      return userCredential.user;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Logout user
  async logoutUser() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }
};

export default userService; 