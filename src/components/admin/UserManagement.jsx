import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [userError, setUserError] = useState('');

  useEffect(() => {
    const currentUser = userService.getCurrentUser();
    if (!currentUser) {
      setError('You must be logged in to view users');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.message.includes('must be logged in')) {
        setError('You must be logged in to view users');
      } else if (error.message.includes('permission-denied')) {
        setError('You do not have permission to view users. Please contact your administrator.');
      } else {
        setError('Failed to fetch users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserError('');

    // Validate passwords match
    if (newUser.password !== newUser.confirmPassword) {
      setUserError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (newUser.password.length < 6) {
      setUserError('Password must be at least 6 characters long');
      return;
    }

    try {
      await userService.createUser(newUser.email, newUser.password);
      setShowAddModal(false);
      setNewUser({ email: '', password: '', confirmPassword: '' });
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error adding user:', error);
      if (error.message.includes('must be logged in')) {
        setUserError('You must be logged in to create users');
      } else if (error.message.includes('email-already-in-use')) {
        setUserError('This email is already registered');
      } else if (error.message.includes('permission-denied')) {
        setUserError('You do not have permission to create users');
      } else {
        setUserError(error.message || 'Failed to create user');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        fetchUsers(); // Refresh the user list
      } catch (error) {
        console.error('Error deleting user:', error);
        if (error.message.includes('must be logged in')) {
          alert('You must be logged in to delete users');
        } else if (error.message.includes('permission-denied')) {
          alert('You do not have permission to delete users');
        } else {
          alert('Failed to delete user. Please try again.');
        }
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (user) => {
    if (!user.isActive) return <span className="status-badge inactive">Inactive</span>;
    if (!user.emailVerified) return <span className="status-badge unverified">Unverified</span>;
    return <span className="status-badge active">Active</span>;
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management">
        <div className="error-message">
          {error}
          <button onClick={fetchUsers}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <button 
          className="add-button"
          onClick={() => setShowAddModal(true)}
        >
          Add New User
        </button>
      </div>

      <div className="users-list">
        {users.length === 0 ? (
          <div className="no-users">
            <p>No users found.</p>
          </div>
        ) : (
          users.map(user => (
            <div key={user.id || user.uid} className="user-item">
              <div className="user-info">
                <div className="user-header">
                  <span className="user-email">{user.email}</span>
                  {getStatusBadge(user)}
                </div>
                <div className="user-details">
                  <span className="user-role">{user.role || 'User'}</span>
                  <span className="user-created">
                    Created: {formatDate(user.createdAt)}
                  </span>
                  <span className="user-last-signin">
                    Last Sign In: {formatDate(user.lastSignIn)}
                  </span>
                </div>
              </div>
              <div className="user-actions">
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteUser(user.id || user.uid)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label className="required">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter user's email"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Confirm Password</label>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  placeholder="Confirm password"
                  required
                />
              </div>
              {userError && (
                <div className="error-message">{userError}</div>
              )}
              <div className="modal-actions">
                <button type="submit" className="submit-button">Create User</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser({ email: '', password: '', confirmPassword: '' });
                    setUserError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 