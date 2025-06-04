import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import app from './firebase/config';

const auth = getAuth(app);
const db = getFirestore(app);

const userService = {
  // Create a new user
  async createUser(email, password, role = 'user') {
    try {
      console.log('createUser called with:', { email, role });
      if (!auth.currentUser) {
        console.log('No current user in auth');
        throw new Error('You must be logged in to create users');
      }
      console.log('Current user exists:', auth.currentUser.email);

      // Store admin credentials for later
      const adminEmail = auth.currentUser.email;
      const adminPassword = password; // This is the admin's password

      // Create user in Firebase Auth
      console.log('Creating user in Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created in Firebase Auth:', user.uid);

      // Create user document in Firestore with the same ID as the Auth user
      console.log('Creating user document in Firestore...');
      const userData = {
        uid: user.uid,
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid,
        lastSignIn: null,
        isActive: true,
        emailVerified: user.emailVerified || false,
        displayName: user.displayName || '',
        updatedAt: new Date().toISOString()
      };
      console.log('User data to be saved:', userData);
      
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('User document created in Firestore');

      // Sign out the newly created user
      console.log('Signing out newly created user...');
      await signOut(auth);
      
      // Sign back in as admin
      console.log('Signing back in as admin...');
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('Successfully signed back in as admin');

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters');
      }
      throw error;
    }
  },

  // Sync Firebase Auth users with Firestore
  async syncUsers() {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to sync users');
      }

      // Get all users from Firestore
      const firestoreUsers = await getDocs(collection(db, 'users'));
      const existingUserIds = new Set(firestoreUsers.docs.map(doc => doc.data().uid));

      // Get all users from Firestore users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // Create Firestore documents for users that don't exist
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        if (!existingUserIds.has(userData.uid)) {
          await setDoc(doc(db, 'users', userData.uid), {
            uid: userData.uid,
            email: userData.email,
            role: 'user', // Default role
            createdAt: new Date().toISOString(),
            lastSignIn: null,
            isActive: true,
            emailVerified: false
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing users:', error);
      throw error;
    }
  },

  // Get all users
  async getAllUsers() {
    try {
      console.log('getAllUsers called, checking current user...');
      if (!auth.currentUser) {
        console.log('No current user in auth');
        throw new Error('You must be logged in to view users');
      }
      console.log('Current user exists:', auth.currentUser.email);

      // Get users from Firestore
      console.log('Fetching users from Firestore...');
      const usersCollection = collection(db, 'users');
      console.log('Created users collection reference');
      
      const usersSnapshot = await getDocs(usersCollection);
      console.log('Firestore query completed, snapshot size:', usersSnapshot.size);
      
      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing user document:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data,
          // Ensure these fields exist
          role: data.role || 'user',
          isActive: data.isActive !== undefined ? data.isActive : true,
          emailVerified: data.emailVerified || false,
          lastSignIn: data.lastSignIn || null,
          createdAt: data.createdAt || new Date().toISOString()
        };
      });
      console.log('Processed users:', users);

      // If no users found in Firestore, try to sync
      if (users.length === 0) {
        console.log('No users found in Firestore, attempting to sync...');
        await this.syncUsers();
        // Fetch again after sync
        const newSnapshot = await getDocs(usersCollection);
        const newUsers = newSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          role: doc.data().role || 'user',
          isActive: doc.data().isActive !== undefined ? doc.data().isActive : true,
          emailVerified: doc.data().emailVerified || false,
          lastSignIn: doc.data().lastSignIn || null,
          createdAt: doc.data().createdAt || new Date().toISOString()
        }));
        console.log('Users after sync:', newUsers);
        return newUsers;
      }

      return users;
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to view users');
      } else if (error.code === 'unauthenticated') {
        throw new Error('You must be logged in to view users');
      }
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

  // Update user's role
  async updateUserRole(userId, newRole) {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to update user roles');
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
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
      
      // Call the Netlify function to delete from Firebase Auth
      const response = await fetch('/.netlify/functions/deleteUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete user from authentication');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Login user
  async loginUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user document exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      let needsDisplayName = false;
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        const userData = {
          uid: user.uid,
          email: user.email,
          role: 'user',
          createdAt: new Date().toISOString(),
          lastSignIn: new Date().toISOString(),
          isActive: true,
          emailVerified: user.emailVerified,
          displayName: '',
          updatedAt: new Date().toISOString(),
          needsDisplayName: true
        };
        await setDoc(userRef, userData);
        needsDisplayName = true;
      } else {
        const userData = userDoc.data();
        // Check if user needs to set display name
        needsDisplayName = !userData.displayName || userData.displayName.trim() === '';
        
        // Update last sign-in time and other fields
        await updateDoc(userRef, {
          lastSignIn: new Date().toISOString(),
          emailVerified: user.emailVerified,
          needsDisplayName: needsDisplayName,
          updatedAt: new Date().toISOString()
        });
      }

      return {
        user,
        needsDisplayName
      };
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
  },

  // Check if current user is admin
  async isCurrentUserAdmin() {
    try {
      if (!auth.currentUser) return false;

      const usersSnapshot = await getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)));
      if (usersSnapshot.empty) return false;

      const userData = usersSnapshot.docs[0].data();
      return userData.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  // Add new function to update display name
  async updateDisplayName(userId, displayName) {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to update display name');
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        displayName: displayName,
        needsDisplayName: false,
        updatedAt: new Date().toISOString()
      });

      // Also update the auth profile
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
    } catch (error) {
      console.error('Error updating display name:', error);
      throw error;
    }
  }
};

export default userService; 