import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInUser } from '../../services/firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const verifyAdminStatus = async (user) => {
    try {
      // Check if user exists in admins collection
      const adminRef = doc(db, 'admins', user.uid);
      const adminDoc = await getDoc(adminRef);

      if (!adminDoc.exists()) {
        // If admin document doesn't exist, create it
        await setDoc(adminRef, {
          email: user.email,
          role: 'admin',
          displayName: user.displayName || '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        return true;
      }

      const adminData = adminDoc.data();
      if (!adminData?.role || adminData.role !== 'admin') {
        // If role is not admin, update it
        await setDoc(adminRef, {
          role: 'admin',
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }

      return true;
    } catch (error) {
      console.error('Error verifying admin status:', error);
      throw error;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await signInUser(email, password);
      await verifyAdminStatus(user);
      
      // Store user data with role
      localStorage.setItem('adminUser', JSON.stringify({
        ...user,
        role: 'admin'
      }));
      
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <button 
          className="back-button" 
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>
        
        <div className="admin-login-header">
          <h1>Admin Login</h1>
          <p>Sign in to access the admin dashboard</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>Protected admin area. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
 