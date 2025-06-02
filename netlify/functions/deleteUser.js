import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { uid } = JSON.parse(event.body);
    
    if (!uid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    await admin.auth().deleteUser(uid);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User deleted successfully' })
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete user' })
    };
  }
}; 