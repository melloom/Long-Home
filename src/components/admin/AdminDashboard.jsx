import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { callCenterRebuttals } from '../../data/rebuttals';
import rebuttalsService from '../../services/rebuttalsService';
import CategoryManagement from './CategoryManagement';
import CustomerServiceManagement from './CustomerServiceManagement';
import { leadDispositionService } from '../../services/leadDispositionService';
import UserManagement from './UserManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rebuttals, setRebuttals] = useState([]);
  const [archivedRebuttals, setArchivedRebuttals] = useState([]);
  const [newRebuttal, setNewRebuttal] = useState({
    title: '',
    category: '',
    objection: '',
    response: '',
    followUpResponse: '',
    tags: []
  });
  const [editingRebuttal, setEditingRebuttal] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [adminError, setAdminError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [stats, setStats] = useState({
    totalRebuttals: 0,
    totalArchived: 0,
    recentlyUpdated: 0,
    averageResponseLength: 0,
    topTags: [],
    activeCategories: 0,
    categoryGrowth: 0,
    mostUsedCategory: null,
    leastUsedCategory: null,
    categoryDistribution: []
  });
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [dispositions, setDispositions] = useState([]);
  const [error, setError] = useState(null);
  const [loadingDispositions, setLoadingDispositions] = useState(true);
  const [dispositionError, setDispositionError] = useState(null);
  const [showAddDispositionModal, setShowAddDispositionModal] = useState(false);
  const [showEditDispositionModal, setShowEditDispositionModal] = useState(false);
  const [editingDisposition, setEditingDisposition] = useState(null);
  const [newDisposition, setNewDisposition] = useState({
    name: '',
    category: '',
    description: '',
    icon: '',
    color: '',
    nextSteps: '',
    tips: []
  });
  const [showAllCategories, setShowAllCategories] = useState(false);

  const dispositionCategories = [
    { id: 'follow-up', name: 'Follow-Up Required' },
    { id: 'not-qualified', name: 'Not Qualified' },
    { id: 'technical', name: 'Technical Issues' },
    { id: 'external', name: 'External Factors' },
    { id: 'scheduled', name: 'Scheduled' },
    { id: 'completed', name: 'Completed' },
    { id: 'cancelled', name: 'Cancelled' },
    { id: 'rescheduled', name: 'Rescheduled' }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication state...');
        const user = JSON.parse(localStorage.getItem('adminUser'));
        if (!user) {
          console.log('No admin user found in localStorage');
          navigate('/admin/login');
          return;
        }
        console.log('Admin user found:', user);
        setAdminUser(user);
        loadData();
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        navigate('/admin/login');
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    console.log('Current activeTab:', activeTab);
    console.log('Current dispositions:', dispositions);
    console.log('Current loading state:', loading);
    console.log('Current error state:', error);
  }, [activeTab, dispositions, loading, error]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Starting to load data...');

      // Load active rebuttals from Firebase
      console.log('Loading active rebuttals...');
      const activeRebuttals = await rebuttalsService.getActiveRebuttals();
      console.log('Loading archived rebuttals...');
      const archivedRebuttals = await rebuttalsService.getArchivedRebuttals();
      
      // Always initialize with default rebuttals to ensure all are present
      console.log('Processing default rebuttals...');
      const defaultRebuttals = callCenterRebuttals.map(rebuttal => {
        // Map the category to ensure it matches our predefined categories
        const categoryMap = {
          'not-interested': 'not-interested',
          'spouse-consultation': 'spouse-consultation',
          'one-legger': 'one-legger',
          'not-ready': 'not-ready',
          'curious': 'curious',
          'time-concern': 'time-concern',
          'cant-afford': 'cant-afford',
          'spouse': 'spouse',
          'price-phone': 'price-phone',
          'repair': 'repair',
          'government-grants': 'government-grants',
          'reset-appt': 'reset-appt',
          'no-request': 'no-request',
          'bad-reviews': 'bad-reviews'
        };

        // Ensure the category is correctly mapped
        const mappedCategory = categoryMap[rebuttal.category] || rebuttal.category;

        return {
          title: rebuttal.title,
          category: mappedCategory,
          objection: rebuttal.summary,
          response: rebuttal.content,
          tags: rebuttal.tags || [],
          archived: false
        };
      });

      // Create a map of existing rebuttals by title for quick lookup
      const existingRebuttalsMap = new Map(
        [...activeRebuttals, ...archivedRebuttals].map(r => [r.title, r])
      );

      // Add only missing rebuttals to Firebase
      console.log('Checking for missing rebuttals...');
      let addedCount = 0;
      for (const rebuttal of defaultRebuttals) {
        if (!existingRebuttalsMap.has(rebuttal.title)) {
          console.log(`Adding missing rebuttal: ${rebuttal.title}`);
          await rebuttalsService.addRebuttal(rebuttal);
          addedCount++;
        }
      }
      console.log(`Added ${addedCount} missing rebuttals`);

      // Reload all rebuttals after adding any missing ones
      console.log('Reloading rebuttals...');
      const updatedActiveRebuttals = await rebuttalsService.getActiveRebuttals();
      const updatedArchivedRebuttals = await rebuttalsService.getArchivedRebuttals();
      
      setRebuttals(updatedActiveRebuttals);
      setArchivedRebuttals(updatedArchivedRebuttals);
      updateStats();
      
      console.log('Data loading completed successfully');
    } catch (error) {
      console.error('Error in loadData:', error);
      let errorMessage = 'Failed to load rebuttals. ';
      
      if (error.message.includes('Firebase is not properly initialized')) {
        errorMessage += 'Firebase configuration error. Please check your environment variables.';
      } else if (error.message.includes('permission-denied')) {
        errorMessage += 'Permission denied. Please check your Firebase security rules.';
      } else if (error.message.includes('not-found')) {
        errorMessage += 'Collection not found. Please check your Firebase configuration.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const stats = {
      totalRebuttals: rebuttals.length,
      totalArchived: archivedRebuttals.length,
      recentlyUpdated: 0,
      averageResponseLength: 0,
      topTags: [],
      activeCategories: 0,
      categoryGrowth: 0,
      mostUsedCategory: null,
      leastUsedCategory: null,
      categoryDistribution: []
    };

    // Calculate category statistics
    const categoryCounts = {};
    rebuttals.forEach(r => {
      if (r.category) {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      }
    });

    // Find most and least used categories
    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count
    }));

    if (categories.length > 0) {
      stats.mostUsedCategory = categories.reduce((a, b) => a.count > b.count ? a : b);
      stats.leastUsedCategory = categories.reduce((a, b) => a.count < b.count ? a : b);
      stats.activeCategories = categories.length;
    }

    // Calculate category distribution
    const totalRebuttals = rebuttals.length;
    stats.categoryDistribution = categories.map(category => ({
      ...category,
      percentage: Math.round((category.count / totalRebuttals) * 100) || 0,
      icon: getCategoryIcon(category.name)
    })).sort((a, b) => b.count - a.count);

    // Calculate category growth (placeholder - implement actual growth calculation)
    stats.categoryGrowth = 5; // Example growth percentage

    // Average response length
    const totalLength = rebuttals.reduce((sum, r) => sum + (r.response?.length || 0), 0);
    stats.averageResponseLength = Math.round(totalLength / rebuttals.length) || 0;

    // Top tags
    const tagCounts = {};
    rebuttals.forEach(r => {
      r.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    stats.topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    setStats(stats);
  };

  // Helper function to get category icon
  const getCategoryIcon = (categoryName) => {
    const categoryIcons = {
      'not-interested': '❌',
      'spouse-consultation': '💑',
      'one-legger': '👤',
      'not-ready': '⏳',
      'curious': '🤔',
      'time-concern': '⏰',
      'cant-afford': '💰',
      'spouse': '👫',
      'price-phone': '📞',
      'repair': '🔧',
      'government-grants': '🏛️',
      'reset-appt': '🔄',
      'no-request': '🚫',
      'bad-reviews': '⭐'
    };
    return categoryIcons[categoryName] || '📝';
  };

  // Update stats when archived rebuttals change
  useEffect(() => {
    if (rebuttals.length > 0) {
      updateStats(rebuttals);
    }
  }, [rebuttals, archivedRebuttals]);

  // Define fetchDispositions at the top level of the component
  const fetchDispositions = async () => {
    try {
      console.log('Starting to fetch dispositions...');
      setLoadingDispositions(true);
      setError(null);
      
      // First, try to get dispositions
      console.log('Calling getAllDispositions...');
      const fetchedDispositions = await leadDispositionService.getAllDispositions();
      console.log('Fetched dispositions:', fetchedDispositions);
      
      // If no dispositions exist or if there are fewer than expected, initialize defaults
      if (fetchedDispositions.length === 0 || fetchedDispositions.length < 22) {
        console.log(`Found ${fetchedDispositions.length} dispositions, initializing defaults...`);
        try {
          await leadDispositionService.initializeDefaultDispositions();
          // Fetch again after initialization
          const updatedDispositions = await leadDispositionService.getAllDispositions();
          console.log('Updated dispositions after initialization:', updatedDispositions);
          setDispositions(updatedDispositions);
        } catch (initError) {
          console.error('Error initializing dispositions:', initError);
          setError('Failed to initialize default dispositions. Please try again.');
        }
      } else {
        setDispositions(fetchedDispositions);
      }
    } catch (error) {
      console.error('Error fetching dispositions:', error);
      setError(error.message || 'Failed to fetch dispositions');
    } finally {
      setLoadingDispositions(false);
    }
  };

  // Update handleTabClick to use the defined fetchDispositions
  const handleTabClick = (tab) => {
    console.log('Tab clicked:', tab);
    setActiveTab(tab);
    if (tab === 'lead-disposition') {
      console.log('Lead disposition tab clicked, fetching data...');
      fetchDispositions();
    }
  };

  // Add useEffect for initial dispositions fetch
  useEffect(() => {
    if (activeTab === 'lead-disposition') {
      fetchDispositions();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleAddRebuttal = async (e) => {
    e.preventDefault();
    try {
      const newReb = {
        title: newRebuttal.title,
        category: newRebuttal.category,
        objection: newRebuttal.objection,
        response: {
          pt1: newRebuttal.response,
          pt2: newRebuttal.followUpResponse || ''
        },
        tags: newRebuttal.tags
      };

      // Add to Firebase
      const rebuttalId = await rebuttalsService.addRebuttal(newReb);
      const newRebWithId = { ...newReb, id: rebuttalId };

      // Update local state
      setRebuttals(prevRebuttals => [...prevRebuttals, newRebWithId]);
      setShowAddModal(false);
      setNewRebuttal({ title: '', category: '', objection: '', response: '', followUpResponse: '', tags: [] });
      updateStats();
    } catch (error) {
      console.error('Error adding rebuttal:', error);
      alert('Failed to add rebuttal. Please try again.');
    }
  };

  const handleEditRebuttal = async (e) => {
    e.preventDefault();
    try {
      const updatedRebuttal = {
        ...editingRebuttal,
        response: {
          pt1: typeof editingRebuttal.response === 'object' ? editingRebuttal.response.pt1 : editingRebuttal.response,
          pt2: typeof editingRebuttal.response === 'object' ? editingRebuttal.response.pt2 : editingRebuttal.followUpResponse || ''
        }
      };

      // Update in Firebase
      await rebuttalsService.updateRebuttal(editingRebuttal.id, updatedRebuttal);

      // Update local state
      setRebuttals(prevRebuttals => 
        prevRebuttals.map(r => r.id === editingRebuttal.id ? updatedRebuttal : r)
      );
      
      setShowEditModal(false);
      setEditingRebuttal(null);
      updateStats();
    } catch (error) {
      console.error('Error updating rebuttal:', error);
      alert('Failed to update rebuttal. Please try again.');
    }
  };

  const handleDeleteRebuttal = async (id) => {
    if (window.confirm('Are you sure you want to delete this rebuttal?')) {
      try {
        // Delete from Firebase
        await rebuttalsService.deleteRebuttal(id);

        // Update local state
        setRebuttals(prevRebuttals => prevRebuttals.filter(r => r.id !== id));
        updateStats();
      } catch (error) {
        console.error('Error deleting rebuttal:', error);
        alert('Failed to delete rebuttal. Please try again.');
      }
    }
  };

  const handleArchiveRebuttal = async (id) => {
    if (window.confirm('Are you sure you want to archive this rebuttal?')) {
      try {
        await rebuttalsService.archiveRebuttal(id);
        
        // Update local state
        const rebuttal = rebuttals.find(r => r.id === id);
        if (rebuttal) {
          setRebuttals(prevRebuttals => prevRebuttals.filter(r => r.id !== id));
          setArchivedRebuttals(prevArchived => [...prevArchived, { ...rebuttal, archived: true, archivedAt: new Date().toISOString() }]);
          updateStats();
        }
      } catch (error) {
        console.error('Error archiving rebuttal:', error);
        alert('Failed to archive rebuttal. Please try again.');
      }
    }
  };

  const handleUnarchiveRebuttal = async (id) => {
    try {
      await rebuttalsService.unarchiveRebuttal(id);
      
      // Update local state
      const rebuttal = archivedRebuttals.find(r => r.id === id);
      if (rebuttal) {
        setArchivedRebuttals(prevArchived => prevArchived.filter(r => r.id !== id));
        setRebuttals(prevRebuttals => [...prevRebuttals, { ...rebuttal, archived: false, archivedAt: null }]);
        updateStats();
      }
    } catch (error) {
      console.error('Error unarchiving rebuttal:', error);
      alert('Failed to unarchive rebuttal. Please try again.');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      // Implement the logic to add a new admin user
      console.log('Adding new admin user:', newAdmin);
      // ... (actual implementation needed)
    } catch (error) {
      console.error('Error adding admin user:', error);
      alert('Failed to add admin user. Please try again.');
    }
  };

  // Filter rebuttals based on category and search
  const filteredRebuttals = rebuttals.filter(rebuttal => {
    // Check for exact category match or 'all' category
    const matchesCategory = selectedCategory === 'all' || rebuttal.category === selectedCategory;
    
    // If no search term, just return category match
    if (!searchTerm) {
      return matchesCategory;
    }

    // Search in all relevant fields
    const searchLower = searchTerm.toLowerCase();
    const searchFields = [
      rebuttal.title,
      rebuttal.objection,
      typeof rebuttal.response === 'object' ? rebuttal.response.pt1 : rebuttal.response,
      typeof rebuttal.response === 'object' ? rebuttal.response.pt2 : '',
      ...(rebuttal.tags || [])
    ];

    const matchesSearch = searchFields.some(field => 
      field && field.toLowerCase().includes(searchLower)
    );
    
    return matchesCategory && matchesSearch;
  });

  // Handle disposition actions
  const handleAddDisposition = async (dispositionData) => {
    try {
      const id = await leadDispositionService.addDisposition(dispositionData);
      const newDisposition = { id, ...dispositionData };
      setDispositions(prev => [...prev, newDisposition]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding disposition:', error);
      alert('Failed to add disposition. Please try again.');
    }
  };

  const handleEditDisposition = async (id, updatedData) => {
    try {
      await leadDispositionService.updateDisposition(id, updatedData);
      setDispositions(prev => 
        prev.map(d => d.id === id ? { ...d, ...updatedData } : d)
      );
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating disposition:', error);
      alert('Failed to update disposition. Please try again.');
    }
  };

  const handleDeleteDisposition = async (id) => {
    if (window.confirm('Are you sure you want to delete this disposition?')) {
      try {
        await leadDispositionService.deleteDisposition(id);
        setDispositions(prev => prev.filter(d => d.id !== id));
      } catch (error) {
        console.error('Error deleting disposition:', error);
        alert('Failed to delete disposition. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <div className="nav-brand">
          <h1>Admin Dashboard</h1>
        </div>
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabClick('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === 'rebuttals' ? 'active' : ''}`}
            onClick={() => handleTabClick('rebuttals')}
          >
            Rebuttals
          </button>
          <button 
            className={`nav-tab ${activeTab === 'archived' ? 'active' : ''}`}
            onClick={() => handleTabClick('archived')}
          >
            Archived
          </button>
          <button 
            className={`nav-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleTabClick('categories')}
          >
            Categories
          </button>
          <button 
            className={`nav-tab ${activeTab === 'customer-service' ? 'active' : ''}`}
            onClick={() => handleTabClick('customer-service')}
          >
            Customer Service
          </button>
          <button 
            className={`nav-tab ${activeTab === 'lead-disposition' ? 'active' : ''}`}
            onClick={() => handleTabClick('lead-disposition')}
          >
            Lead Disposition
          </button>
          <button 
            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabClick('users')}
          >
            Users
          </button>
        </div>
        <div className="nav-user">
          <span>Welcome, {adminUser?.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            {/* Enhanced Quick Stats */}
            <div className="dashboard-card enhanced-stats" key="enhanced-stats">
              <h2>📈 Statistics</h2>
              <div className="enhanced-stats-grid">
                <div className="stat-card primary" key="total-rebuttals">
                  <div className="stat-icon">📚</div>
                  <div className="stat-content">
                    <h3>Total Rebuttals</h3>
                    <div className="stat-number">{stats.totalRebuttals}</div>
                  </div>
                </div>
                
                <div className="stat-card secondary" key="archived">
                  <div className="stat-icon">📦</div>
                  <div className="stat-content">
                    <h3>Archived</h3>
                    <div className="stat-number">{stats.totalArchived}</div>
                  </div>
                </div>

                <div className="stat-card tertiary" key="avg-response">
                  <div className="stat-icon">📏</div>
                  <div className="stat-content">
                    <h3>Avg. Response</h3>
                    <div className="stat-number">{stats.averageResponseLength}</div>
                    <div className="stat-subtitle">characters</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Performance */}
            <div className="dashboard-card category-performance" key="category-performance">
              <div className="category-header">
              <h2>🎯 Category Insights</h2>
                <div className="category-actions">
                  <button className="refresh-button" onClick={() => updateStats()}>
                    <span>🔄</span>
                  </button>
                </div>
              </div>
              <div className="performance-content">
                <div className="category-stats-grid">
                  <div className="category-stat-card" key="active-categories">
                    <div className="stat-header">
                      <span className="stat-icon">📊</span>
                      <h3>Active Categories</h3>
                    </div>
                    <div className="stat-value">{stats.activeCategories || 0}</div>
                    <div className="stat-trend positive">
                      <span>↑</span> {stats.categoryGrowth || 0}% growth
                    </div>
                  </div>
                  
                  <div className="category-stat-card" key="most-used">
                    <div className="stat-header">
                      <span className="stat-icon">📈</span>
                      <h3>Most Used</h3>
                    </div>
                    <div className="stat-value">{stats.mostUsedCategory?.name || 'N/A'}</div>
                    <div className="stat-subtext">
                      {stats.mostUsedCategory?.count || 0} rebuttals
                    </div>
                  </div>
                </div>

                <div className="category-distribution">
                  <div className="distribution-header">
                  <h3>Category Distribution</h3>
                    <div className="distribution-legend">
                      <span className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
                        Most Used
                      </span>
                      <span className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: '#FFC107' }}></span>
                        Average
                      </span>
                      <span className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: '#F44336' }}></span>
                        Least Used
                      </span>
                    </div>
                  </div>
                  <div className="category-bars">
                    {stats.categoryDistribution?.slice(0, 5).map((category, index) => (
                      <div key={`${category.name}-${index}`} className="category-bar-item">
                        <div className="category-bar-label">
                          <span className="category-icon">{category.icon}</span>
                          <span className="category-name">{category.name}</span>
                        </div>
                        <div className="category-bar-container">
                          <div 
                            className={`category-bar ${category.name === stats.mostUsedCategory?.name ? 'most-used' : 
                                                     category.name === stats.leastUsedCategory?.name ? 'least-used' : ''}`}
                            style={{ width: `${category.percentage}%` }}
                          >
                            <span className="bar-percentage">{category.percentage}%</span>
                          </div>
                        </div>
                        <span className="category-count">{category.count} rebuttals</span>
                      </div>
                    ))}
                    {stats.categoryDistribution?.length > 5 && (
                      <button className="view-more-button" onClick={() => setShowAllCategories(!showAllCategories)}>
                        {showAllCategories ? 'Show Less' : `Show ${stats.categoryDistribution.length - 5} More`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Actions */}
            <div className="dashboard-card quick-actions" key="quick-actions">
              <h2>⚡ Quick Actions</h2>
              <div className="action-buttons-enhanced">
                <button 
                  key="add-rebuttal"
                  className="action-button-enhanced primary"
                  onClick={() => {
                    setActiveTab('rebuttals');
                    setShowAddModal(true);
                  }}
                >
                  <div className="action-icon">➕</div>
                  <div className="action-content">
                    <strong>Add New Rebuttal</strong>
                    <p>Create fresh content</p>
                  </div>
                </button>
                
                <button 
                  key="manage-rebuttals"
                  className="action-button-enhanced secondary"
                  onClick={() => setActiveTab('rebuttals')}
                >
                  <div className="action-icon">📝</div>
                  <div className="action-content">
                    <strong>Manage Rebuttals</strong>
                    <p>Edit existing content</p>
                  </div>
                </button>
                
                <button 
                  key="manage-categories"
                  className="action-button-enhanced tertiary"
                  onClick={() => setActiveTab('categories')}
                >
                  <div className="action-icon">🏷️</div>
                  <div className="action-content">
                    <strong>Manage Categories</strong>
                    <p>Organize content types</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rebuttals' && (
          <div className="rebuttals-management">
            <div className="rebuttals-header">
              <h2>Manage Rebuttals</h2>
              <button 
                className="add-button"
                onClick={() => setShowAddModal(true)}
              >
                Add New Rebuttal
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="rebuttals-controls">
              <div className="search-filter-container">
                <input
                  type="text"
                  placeholder="Search rebuttals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-filter"
                >
                  {/* Add category options here */}
                </select>
              </div>
              <div className="filter-stats">
                <span>Showing {filteredRebuttals.length} of {rebuttals.length} rebuttals</span>
              </div>
            </div>

            <div className="rebuttals-list">
              {filteredRebuttals.length === 0 ? (
                <div className="no-results">
                  <p>No rebuttals found matching your criteria.</p>
                  {searchTerm && (
                    <p className="search-tip">Try adjusting your search terms or category filter.</p>
                  )}
                </div>
              ) : (
                filteredRebuttals.map(rebuttal => (
                  <div key={rebuttal.id} className="rebuttal-item">
                    <div className="rebuttal-info">
                      <span className="rebuttal-category">
                        {/* Add category icon here */}
                      </span>
                      <h3 className="rebuttal-objection">{rebuttal.title}</h3>
                      <p className="rebuttal-objection-summary">{rebuttal.objection}</p>
                      <div className="rebuttal-responses">
                        <div className="response-section">
                          <h4 className="response-label">Initial Response (Part 1)</h4>
                          <p className="rebuttal-response">
                            {typeof rebuttal.response === 'object' ? rebuttal.response.pt1 : rebuttal.response}
                          </p>
                        </div>
                        <div className="response-section">
                          <h4 className="response-label">Follow-up Response (Part 2)</h4>
                          <p className="rebuttal-response follow-up">
                            {typeof rebuttal.response === 'object' ? rebuttal.response.pt2 : rebuttal.followUpResponse}
                          </p>
                        </div>
                      </div>
                      {rebuttal.tags && rebuttal.tags.length > 0 && (
                        <div className="rebuttal-tags">
                          {rebuttal.tags.map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="rebuttal-actions">
                      <button 
                        className="edit-button"
                        onClick={() => {
                          setEditingRebuttal(rebuttal);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="archive-button"
                        onClick={() => handleArchiveRebuttal(rebuttal.id)}
                      >
                        Archive
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteRebuttal(rebuttal.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'archived' && (
          <div className="rebuttals-management">
            <div className="rebuttals-header">
              <h2>Archived Rebuttals</h2>
              <span className="archived-count">{archivedRebuttals.length} archived</span>
            </div>

            <div className="rebuttals-list">
              {archivedRebuttals.map(rebuttal => (
                <div key={rebuttal.id} className="rebuttal-item archived">
                  <div className="rebuttal-info">
                    <span className="rebuttal-category">
                      {/* Add category icon here */}
                    </span>
                    <span className="archived-badge">Archived {new Date(rebuttal.archivedAt).toLocaleDateString()}</span>
                    <h3 className="rebuttal-objection">{rebuttal.title}</h3>
                    <p className="rebuttal-objection-summary">{rebuttal.objection}</p>
                    <p className="rebuttal-response">{rebuttal.response}</p>
                    <div className="rebuttal-tags">
                      {rebuttal.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rebuttal-actions">
                    <button 
                      className="unarchive-button"
                      onClick={() => handleUnarchiveRebuttal(rebuttal.id)}
                    >
                      Unarchive
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to permanently delete this archived rebuttal?')) {
                          const updatedArchived = archivedRebuttals.filter(r => r.id !== rebuttal.id);
                          setArchivedRebuttals(updatedArchived);
                          // Delete from localStorage
                          localStorage.setItem('archivedRebuttals', JSON.stringify(updatedArchived));
                        }
                      }}
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              ))}
              
              {archivedRebuttals.length === 0 && (
                <div className="no-rebuttals">
                  <p>No archived rebuttals found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <CategoryManagement />
        )}

        {activeTab === 'customer-service' && (
          <CustomerServiceManagement />
        )}

        {activeTab === 'lead-disposition' && (
          <div className="lead-disposition-management">
            <div className="lead-disposition-header">
              <h2>Lead Disposition Scripts</h2>
              <button 
                className="add-button"
                onClick={() => setShowAddDispositionModal(true)}
              >
                Add New Disposition
              </button>
            </div>

            <div className="lead-disposition-container">
              {/* Category Sidebar */}
              <div className="category-sidebar">
                <h3>Categories</h3>
                <div className="category-list">
                  <button 
                    className={`category-button ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    <span className="category-icon">📋</span>
                    All Dispositions
                  </button>
                  <button 
                    className={`category-button ${selectedCategory === 'follow-up' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('follow-up')}
                  >
                    <span className="category-icon">⏰</span>
                    Follow-Up Required
                  </button>
                  <button 
                    className={`category-button ${selectedCategory === 'not-qualified' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('not-qualified')}
                  >
                    <span className="category-icon">❌</span>
                    Not Qualified
                  </button>
                  <button 
                    className={`category-button ${selectedCategory === 'technical' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('technical')}
                  >
                    <span className="category-icon">🔧</span>
                    Technical Issues
                  </button>
                  <button 
                    className={`category-button ${selectedCategory === 'external' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('external')}
                  >
                    <span className="category-icon">🌐</span>
                    External Factors
                  </button>
                  <button 
                    className={`category-button ${selectedCategory === 'scheduled' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('scheduled')}
                  >
                    <span className="category-icon">✅</span>
                    Scheduled
                  </button>
                  <button 
                    className={`category-button ${selectedCategory === 'completed' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('completed')}
                  >
                    <span className="category-icon">🎉</span>
                    Completed
                  </button>
                  <button 
                    className={`category-button ${selectedCategory === 'cancelled' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('cancelled')}
                  >
                    <span className="category-icon">🚫</span>
                    Cancelled
                  </button>
                  <button 
                    className={`category-button ${selectedCategory === 'rescheduled' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('rescheduled')}
                  >
                    <span className="category-icon">🔄</span>
                    Rescheduled
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="lead-disposition-content">
                {loadingDispositions ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading dispositions...</p>
                  </div>
                ) : error ? (
                  <div className="error">
                    <p>Error: {error}</p>
                    <button onClick={fetchDispositions}>Retry</button>
                  </div>
                ) : dispositions.length === 0 ? (
                  <div className="no-dispositions">
                    <p>No dispositions found. Would you like to initialize default dispositions?</p>
                    <button onClick={fetchDispositions}>Initialize Defaults</button>
                  </div>
                ) : (
                  <div className="lead-disposition-list">
                    {dispositions
                      .filter(disposition => selectedCategory === 'all' || disposition.category === selectedCategory)
                      .map(disposition => (
                        <div key={disposition.id} className="lead-disposition-item">
                          <div className="item-info">
                            <span 
                              className="item-category"
                              data-category={disposition.category}
                            >
                              {disposition.icon} {disposition.category}
                            </span>
                            <h3 className="item-title">{disposition.name}</h3>
                            <p className="item-description">{disposition.description}</p>
                            <div className="item-next-steps">
                              <h4>Next Steps</h4>
                              <p>{disposition.nextSteps}</p>
                            </div>
                            {disposition.tips && disposition.tips.length > 0 && (
                              <div className="item-tips">
                                <h4>Tips</h4>
                                <ul>
                                  {disposition.tips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="item-actions">
                            <button 
                              className="edit-button"
                              onClick={() => {
                                setEditingDisposition(disposition);
                                setShowEditDispositionModal(true);
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteDisposition(disposition.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <UserManagement />
        )}
      </div>

      {/* Add Rebuttal Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Rebuttal</h2>
            <form onSubmit={handleAddRebuttal}>
              <div className="form-group">
                <label className="required">Title</label>
                <input
                  type="text"
                  value={newRebuttal.title}
                  onChange={(e) => setNewRebuttal({...newRebuttal, title: e.target.value})}
                  placeholder="Enter a descriptive title"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Category</label>
                <select
                  value={newRebuttal.category}
                  onChange={(e) => setNewRebuttal({...newRebuttal, category: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  {/* Add category options here */}
                </select>
              </div>
              <div className="form-group">
                <label className="required">Objection</label>
                <input
                  type="text"
                  value={newRebuttal.objection}
                  onChange={(e) => setNewRebuttal({...newRebuttal, objection: e.target.value})}
                  placeholder="Enter the customer's objection"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Initial Response (Part 1)</label>
                <textarea
                  value={newRebuttal.response}
                  onChange={(e) => setNewRebuttal({...newRebuttal, response: e.target.value})}
                  rows={6}
                  required
                  placeholder="Enter the initial response to the objection..."
                />
                <div className="char-count">
                  {newRebuttal.response.length} characters
                </div>
              </div>
              <div className="form-group">
                <label>Follow-up Response (Part 2)</label>
                <textarea
                  value={newRebuttal.followUpResponse}
                  onChange={(e) => setNewRebuttal({...newRebuttal, followUpResponse: e.target.value})}
                  rows={6}
                  placeholder="Enter the follow-up response if the initial response doesn't work..."
                />
                <div className="char-count">
                  {newRebuttal.followUpResponse.length} characters
                </div>
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={newRebuttal.tags.join(', ')}
                  onChange={(e) => setNewRebuttal({
                    ...newRebuttal,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  placeholder="Enter tags separated by commas (e.g., price, urgency, follow-up)"
                />
                <div className="char-count">
                  {newRebuttal.tags.length} tags
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">
                  Add Rebuttal
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewRebuttal({ title: '', category: '', objection: '', response: '', followUpResponse: '', tags: [] });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rebuttal Modal */}
      {showEditModal && editingRebuttal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Rebuttal</h2>
            <form onSubmit={handleEditRebuttal}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editingRebuttal.title}
                  onChange={(e) => setEditingRebuttal({...editingRebuttal, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={editingRebuttal.category}
                  onChange={(e) => setEditingRebuttal({...editingRebuttal, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  {/* Add category options here */}
                </select>
              </div>
              <div className="form-group">
                <label>Objection</label>
                <input
                  type="text"
                  value={editingRebuttal.objection}
                  onChange={(e) => setEditingRebuttal({...editingRebuttal, objection: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Initial Response (Part 1)</label>
                <textarea
                  value={typeof editingRebuttal.response === 'object' ? editingRebuttal.response.pt1 : editingRebuttal.response}
                  onChange={(e) => setEditingRebuttal({
                    ...editingRebuttal,
                    response: typeof editingRebuttal.response === 'object' 
                      ? { ...editingRebuttal.response, pt1: e.target.value }
                      : e.target.value
                  })}
                  rows={6}
                  required
                  placeholder="Enter the initial response to the objection..."
                />
              </div>
              <div className="form-group">
                <label>Follow-up Response (Part 2)</label>
                <textarea
                  value={typeof editingRebuttal.response === 'object' ? editingRebuttal.response.pt2 : editingRebuttal.followUpResponse}
                  onChange={(e) => setEditingRebuttal({
                    ...editingRebuttal,
                    response: typeof editingRebuttal.response === 'object'
                      ? { ...editingRebuttal.response, pt2: e.target.value }
                      : { pt1: editingRebuttal.response, pt2: e.target.value }
                  })}
                  rows={6}
                  placeholder="Enter the follow-up response if the initial response doesn't work..."
                />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editingRebuttal.tags.join(', ')}
                  onChange={(e) => setEditingRebuttal({
                    ...editingRebuttal,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Save Changes</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Admin User</h2>
            <form onSubmit={handleAddAdmin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) => setNewAdmin({...newAdmin, confirmPassword: e.target.value})}
                  required
                />
              </div>
              {adminError && (
                <div className="error-message">{adminError}</div>
              )}
              <div className="modal-actions">
                <button type="submit" className="submit-button">Create Admin</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setAdminError('');
                    setNewAdmin({ email: '', password: '', confirmPassword: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Disposition Modal */}
      {showAddDispositionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Disposition</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddDisposition(newDisposition);
            }}>
              <div className="form-group">
                <label className="required">Name</label>
                <input
                  type="text"
                  value={newDisposition.name}
                  onChange={(e) => setNewDisposition({...newDisposition, name: e.target.value})}
                  placeholder="Enter disposition name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Category</label>
                <select
                  value={newDisposition.category}
                  onChange={(e) => setNewDisposition({...newDisposition, category: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  {dispositionCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="required">Description</label>
                <textarea
                  value={newDisposition.description}
                  onChange={(e) => setNewDisposition({...newDisposition, description: e.target.value})}
                  placeholder="Enter disposition description"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Icon</label>
                <input
                  type="text"
                  value={newDisposition.icon}
                  onChange={(e) => setNewDisposition({...newDisposition, icon: e.target.value})}
                  placeholder="Enter an emoji or icon"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Color</label>
                <select
                  value={newDisposition.color}
                  onChange={(e) => setNewDisposition({...newDisposition, color: e.target.value})}
                  required
                >
                  <option value="">Select a color</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="pink">Pink</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="cyan">Cyan</option>
                  <option value="indigo">Indigo</option>
                  <option value="brown">Brown</option>
                  <option value="gray">Gray</option>
                </select>
              </div>
              <div className="form-group">
                <label className="required">Next Steps</label>
                <textarea
                  value={newDisposition.nextSteps}
                  onChange={(e) => setNewDisposition({...newDisposition, nextSteps: e.target.value})}
                  placeholder="Enter next steps"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tips</label>
                <textarea
                  value={newDisposition.tips.join('\n')}
                  onChange={(e) => setNewDisposition({
                    ...newDisposition,
                    tips: e.target.value.split('\n').filter(tip => tip.trim())
                  })}
                  placeholder="Enter tips (one per line)"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Add Disposition</button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowAddDispositionModal(false);
                    setNewDisposition({
                      name: '',
                      category: '',
                      description: '',
                      icon: '',
                      color: '',
                      nextSteps: '',
                      tips: []
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Disposition Modal */}
      {showEditDispositionModal && editingDisposition && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Disposition</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditDisposition(editingDisposition.id, editingDisposition);
            }}>
              <div className="form-group">
                <label className="required">Name</label>
                <input
                  type="text"
                  value={editingDisposition.name}
                  onChange={(e) => setEditingDisposition({...editingDisposition, name: e.target.value})}
                  placeholder="Enter disposition name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Category</label>
                <select
                  value={editingDisposition.category}
                  onChange={(e) => setEditingDisposition({...editingDisposition, category: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  {dispositionCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="required">Description</label>
                <textarea
                  value={editingDisposition.description}
                  onChange={(e) => setEditingDisposition({...editingDisposition, description: e.target.value})}
                  placeholder="Enter disposition description"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Icon</label>
                <input
                  type="text"
                  value={editingDisposition.icon}
                  onChange={(e) => setEditingDisposition({...editingDisposition, icon: e.target.value})}
                  placeholder="Enter an emoji or icon"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Color</label>
                <select
                  value={editingDisposition.color}
                  onChange={(e) => setEditingDisposition({...editingDisposition, color: e.target.value})}
                  required
                >
                  <option value="">Select a color</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="pink">Pink</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="cyan">Cyan</option>
                  <option value="indigo">Indigo</option>
                  <option value="brown">Brown</option>
                  <option value="gray">Gray</option>
                </select>
              </div>
              <div className="form-group">
                <label className="required">Next Steps</label>
                <textarea
                  value={editingDisposition.nextSteps}
                  onChange={(e) => setEditingDisposition({...editingDisposition, nextSteps: e.target.value})}
                  placeholder="Enter next steps"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tips</label>
                <textarea
                  value={editingDisposition.tips.join('\n')}
                  onChange={(e) => setEditingDisposition({
                    ...editingDisposition,
                    tips: e.target.value.split('\n').filter(tip => tip.trim())
                  })}
                  placeholder="Enter tips (one per line)"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Save Changes</button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowEditDispositionModal(false);
                    setEditingDisposition(null);
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

export default AdminDashboard; 