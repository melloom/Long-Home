import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import { getAuth } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import './UserManagement.css';

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [userError, setUserError] = useState('');

  useEffect(() => {
    console.log('UserManagement mounted, currentUser:', currentUser);
    if (currentUser) {
      console.log('Current user exists, fetching users...');
      fetchUsers();
    } else {
      console.log('No current user found');
      setError('You must be logged in to view users');
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      console.log('Starting fetchUsers...');
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        console.log('No current user in fetchUsers');
        setError('You must be logged in to view users');
        setLoading(false);
        return;
      }

      console.log('Calling userService.getAllUsers()...');
      const fetchedUsers = await userService.getAllUsers();
      console.log('Fetched users:', fetchedUsers);
      
      if (!fetchedUsers || fetchedUsers.length === 0) {
        console.log('No users found in response');
        setError('No users found. Try creating a new user.');
      } else {
        console.log(`Found ${fetchedUsers.length} users`);
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('must be logged in')) {
        setError('You must be logged in to view users');
      } else if (error.message.includes('permission-denied')) {
        setError('You do not have permission to view users. Please contact your administrator.');
      } else {
        setError(`Failed to fetch users: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setUserError('Please enter a valid email address');
      return;
    }

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
      setLoading(true);
      await userService.createUser(newUser.email, newUser.password, newUser.role);
      setShowAddModal(false);
      setNewUser({ email: '', password: '', confirmPassword: '', role: 'user' });
      await fetchUsers(); // Refresh the user list
      alert('User created successfully! They can now log in with their email and password.');
    } catch (error) {
      console.error('Error adding user:', error);
      if (error.message.includes('must be logged in')) {
        setUserError('You must be logged in to create users');
      } else if (error.message.includes('already registered')) {
        setUserError('This email is already registered');
      } else if (error.message.includes('Invalid email')) {
        setUserError('Please enter a valid email address');
      } else if (error.message.includes('Password should be')) {
        setUserError('Password must be at least 6 characters long');
      } else if (error.message.includes('permission-denied')) {
        setUserError('You do not have permission to create users');
      } else {
        setUserError(error.message || 'Failed to create user');
      }
    } finally {
      setLoading(false);
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

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
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

  const getRoleBadge = (role) => {
    return (
      <span className={`role-badge ${role.toLowerCase()}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
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
          <div className="error-actions">
            <button onClick={fetchUsers}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="header-left">
          <h2>User Management</h2>
        </div>
        <div className="header-right">
          <button 
            className="add-button"
            onClick={() => setShowAddModal(true)}
          >
            Add New User
          </button>
        </div>
      </div>

      <div className="users-list">
        {users.length === 0 ? (
          <div className="no-users">
            <div className="no-users-content">
              <h3>No Users Found</h3>
              <p>Get started by creating your first user account.</p>
              <button 
                className="add-button"
                onClick={() => setShowAddModal(true)}
              >
                Create First User
              </button>
            </div>
          </div>
        ) : (
          users.map(user => (
            <div key={user.id || user.uid} className="user-item">
              <div className="user-info">
                <div className="user-header">
                  <span className="user-email">{user.email}</span>
                  {getStatusBadge(user)}
                  {getRoleBadge(user.role || 'user')}
                </div>
                <div className="user-details">
                  <span className="user-created">
                    Created: {formatDate(user.createdAt)}
                  </span>
                  <span className="user-last-signin">
                    Last Sign In: {formatDate(user.lastSignIn)}
                  </span>
                </div>
              </div>
              <div className="user-actions">
                <select
                  value={user.role || 'user'}
                  onChange={(e) => handleRoleChange(user.id || user.uid, e.target.value)}
                  className="role-select"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
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
            {userError && (
              <div className="error-message">
                {userError}
              </div>
            )}
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter user's email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  placeholder="Confirm password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
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