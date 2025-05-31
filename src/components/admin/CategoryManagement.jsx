import React, { useState, useEffect } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../services/rebuttalsService';
import './CategoryManagement.css';

// Common emoji icons for categories
const EMOJI_ICONS = [
  '❌', '💑', '👤', '⏳', '🤔', '⏰', '💰', '👫', '📞', '🔧', '🏛️', '🔄', '🚫', '⭐',
  '📚', '🎯', '💡', '📊', '📈', '📉', '🎨', '🎭', '🎪', '🎯', '🎲', '🎮', '🎸', '🎹',
  '🎺', '🎻', '🎼', '🎧', '🎤', '🎬', '🎭', '🎪', '🎨', '🎯', '🎲', '🎮', '🎸', '🎹'
];

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      setError('Failed to load categories. Please try again.');
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      if (!newCategory.name.trim()) {
        throw new Error('Please enter a category name');
      }

      const category = {
        name: newCategory.name,
        icon: newCategory.icon || '📝'
      };

      const addedCategory = await addCategory(category);
      setCategories(prevCategories => [...prevCategories, addedCategory]);
      setShowCategoryModal(false);
      setNewCategory({ name: '', icon: '' });
    } catch (error) {
      setError(error.message || 'Failed to add category. Please try again.');
      console.error('Error adding category:', error);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      if (!editingCategory.name.trim()) {
        throw new Error('Please enter a category name');
      }

      const updatedCategory = await updateCategory(editingCategory.id, {
        name: editingCategory.name,
        icon: editingCategory.icon
      });

      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.id === editingCategory.id ? updatedCategory : cat
        )
      );
      setShowCategoryModal(false);
      setEditingCategory(null);
    } catch (error) {
      setError(error.message || 'Failed to update category. Please try again.');
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setError(null);
      await deleteCategory(categoryId);
      setCategories(prevCategories => prevCategories.filter(c => c.id !== categoryId));
      setShowWarningModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      setError(error.message || 'Failed to delete category. Please try again.');
      console.error('Error deleting category:', error);
    }
  };

  const filteredAndSortedCategories = categories
    .filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="categories-management">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="categories-management">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="categories-header">
        <div className="header-content">
          <h2>Category Management</h2>
          <p className="header-description">Manage your rebuttal categories and their icons</p>
        </div>
        <button 
          className="add-category-button"
          onClick={() => setShowCategoryModal(true)}
        >
          <span className="button-icon">➕</span>
          Add New Category
        </button>
      </div>

      <div className="categories-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="sort-container">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="categories-grid">
        {filteredAndSortedCategories.map(category => (
          <div key={category.id} className="category-box">
            <div className="category-box-header">
              <div className="category-icon-wrapper">
                <span className="category-icon">{category.icon}</span>
              </div>
              <div className="category-actions">
                <button 
                  className="edit-button"
                  onClick={() => {
                    setEditingCategory(category);
                    setShowCategoryModal(true);
                  }}
                  title="Edit Category"
                >
                  ✏️
                </button>
                <button 
                  className="delete-button"
                  onClick={() => {
                    setShowWarningModal(true);
                    setCategoryToDelete(category);
                  }}
                  title="Delete Category"
                >
                  <span className="delete-icon">×</span>
                </button>
              </div>
            </div>
            <div className="category-box-content">
              <h3 className="category-title">{category.name}</h3>
              <div className="category-meta">
                <div className="meta-item">
                  <span className="meta-label">Created</span>
                  <span className="meta-value">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Last Updated</span>
                  <span className="meta-value">
                    {new Date(category.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="category-modal">
            <div className="category-modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button 
                className="close-modal"
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory({ name: '', icon: '' });
                  setEditingCategory(null);
                  setShowIconPicker(false);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={editingCategory ? handleEditCategory : handleAddCategory}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={editingCategory ? editingCategory.name : newCategory.name}
                  onChange={(e) => editingCategory 
                    ? setEditingCategory({...editingCategory, name: e.target.value})
                    : setNewCategory({...newCategory, name: e.target.value})
                  }
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <div className="icon-input-container">
                  <input
                    type="text"
                    value={editingCategory ? editingCategory.icon : newCategory.icon}
                    onChange={(e) => editingCategory
                      ? setEditingCategory({...editingCategory, icon: e.target.value})
                      : setNewCategory({...newCategory, icon: e.target.value})
                    }
                    placeholder="Select an icon"
                    className="icon-input"
                    onClick={() => setShowIconPicker(true)}
                    readOnly
                  />
                  <div className="icon-preview">
                    {editingCategory ? editingCategory.icon : newCategory.icon || '📝'}
                  </div>
                </div>
                {showIconPicker && (
                  <div className="icon-picker">
                    <div className="icon-picker-grid">
                      {EMOJI_ICONS.map((icon, index) => (
                        <button
                          key={index}
                          type="button"
                          className="icon-picker-item"
                          onClick={() => {
                            if (editingCategory) {
                              setEditingCategory({...editingCategory, icon});
                            } else {
                              setNewCategory({...newCategory, icon});
                            }
                            setShowIconPicker(false);
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategory({ name: '', icon: '' });
                    setEditingCategory(null);
                    setShowIconPicker(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warning Modal for Category Deletion */}
      {showWarningModal && categoryToDelete && (
        <div className="modal-overlay warning-modal">
          <div className="modal-content">
            <div className="warning-header">
              <div className="warning-icon">⚠️</div>
              <h2 className="warning-title">Delete Category</h2>
            </div>
            <div className="warning-body">
              <p className="warning-message">
                Are you sure you want to delete the category "{categoryToDelete.name}"?
              </p>
              <p className="warning-submessage">
                This action cannot be undone and any rebuttals using this category will need to be updated.
              </p>
            </div>
            <div className="warning-actions">
              <button 
                className="cancel-delete"
                onClick={() => {
                  setShowWarningModal(false);
                  setCategoryToDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete"
                onClick={() => handleDeleteCategory(categoryToDelete.id)}
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement; 