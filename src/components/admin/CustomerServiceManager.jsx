import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import './CustomerServiceManager.css';

const CustomerServiceManager = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    keySteps: [''],
    quickTips: [''],
    tags: ['']
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesRef = collection(db, 'customerServiceCategories');
      const snapshot = await getDocs(categoriesRef);
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddCategory = async () => {
    try {
      const categoriesRef = collection(db, 'customerServiceCategories');
      await addDoc(categoriesRef, {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowAddModal(false);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleEditCategory = async () => {
    try {
      if (!selectedCategory) return;
      const categoryRef = doc(db, 'customerServiceCategories', selectedCategory.id);
      await updateDoc(categoryRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setShowEditModal(false);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const categoryRef = doc(db, 'customerServiceCategories', categoryId);
        await deleteDoc(categoryRef);
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: '',
      keySteps: [''],
      quickTips: [''],
      tags: ['']
    });
    setSelectedCategory(null);
  };

  const handleInputChange = (e, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleArrayInputChange = (index, value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (index, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="customer-service-manager">
      <div className="manager-header">
        <h1>Customer Service Content Manager</h1>
        <button 
          className="add-button"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          Add New Category
        </button>
      </div>

      <div className="categories-grid">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            <div className="category-header">
              <span className="category-icon">{category.icon}</span>
              <h3>{category.title}</h3>
            </div>
            <p className="category-description">{category.description}</p>
            <div className="category-actions">
              <button 
                onClick={() => {
                  setSelectedCategory(category);
                  setFormData(category);
                  setShowEditModal(true);
                }}
                className="edit-button"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDeleteCategory(category.id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Category</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddCategory();
            }}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange(e, 'title')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange(e, 'description')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Icon (emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleInputChange(e, 'icon')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Key Steps</label>
                {formData.keySteps.map((step, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'keySteps')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(index, 'keySteps')}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('keySteps')}
                  className="add-item-button"
                >
                  Add Step
                </button>
              </div>
              <div className="form-group">
                <label>Quick Tips</label>
                {formData.quickTips.map((tip, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'quickTips')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(index, 'quickTips')}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('quickTips')}
                  className="add-item-button"
                >
                  Add Tip
                </button>
              </div>
              <div className="form-group">
                <label>Tags</label>
                {formData.tags.map((tag, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'tags')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(index, 'tags')}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  className="add-item-button"
                >
                  Add Tag
                </button>
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-button">Save</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Category</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditCategory();
            }}>
              {/* Same form fields as Add Modal */}
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange(e, 'title')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange(e, 'description')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Icon (emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleInputChange(e, 'icon')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Key Steps</label>
                {formData.keySteps.map((step, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'keySteps')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(index, 'keySteps')}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('keySteps')}
                  className="add-item-button"
                >
                  Add Step
                </button>
              </div>
              <div className="form-group">
                <label>Quick Tips</label>
                {formData.quickTips.map((tip, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'quickTips')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(index, 'quickTips')}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('quickTips')}
                  className="add-item-button"
                >
                  Add Tip
                </button>
              </div>
              <div className="form-group">
                <label>Tags</label>
                {formData.tags.map((tag, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'tags')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(index, 'tags')}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  className="add-item-button"
                >
                  Add Tag
                </button>
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-button">Save Changes</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="cancel-button"
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

export default CustomerServiceManager; 