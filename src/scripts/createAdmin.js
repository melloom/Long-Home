import { createAdminUser } from '../services/firebase/auth.js';

const createAdmin = async () => {
  try {
    const user = await createAdminUser('tgibbs@longhome.com', 'Welcome2024!');
    console.log('Admin user created successfully:', user.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

createAdmin(); 