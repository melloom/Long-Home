import React, { useState, useEffect } from 'react';
import { getServiceTopics, addServiceTopic, updateServiceTopic, deleteServiceTopic, resetServiceTopics } from '../../services/customerServiceService';
import './CustomerServiceManagement.css';

const EMOJI_ICONS = {
  'Appointment Management': '📅',
  'Scheduling': '⏰',
  'Cancellation': '❌',
  'Confirmation': '✅',
  'Follow-up': '📞',
  'Rescheduling': '🔄',
  'Urgent': '⚠️',
  'General': '💬'
};

const CATEGORIES = [
  'appointments',
  'scheduling',
  'confirmation',
  'cancellation',
  'followup'
];

const CustomerServiceManagement = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    category: '',
    icon: '',
    steps: [''],
    tips: [''],
    keywords: [''],
    isUrgent: false
  });

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await getServiceTopics();
      setTopics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load service topics. Please try again.');
      console.error('Error loading topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await resetServiceTopics();
      await loadTopics();
      setError(null);
    } catch (err) {
      setError('Failed to reset service topics. Please try again.');
      console.error('Error resetting topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = () => {
    setFormData({
      title: '',
      description: '',
      topic: '',
      category: '',
      icon: '',
      steps: [''],
      tips: [''],
      keywords: [''],
      isUrgent: false
    });
    setShowAddModal(true);
  };

  const handleEditTopic = (topic) => {
    setSelectedTopic(topic);
    setFormData({
      title: topic.title,
      description: topic.description,
      topic: topic.topic,
      category: topic.category,
      icon: topic.icon,
      steps: topic.steps || [''],
      tips: topic.tips || [''],
      keywords: topic.keywords || [''],
      isUrgent: topic.isUrgent || false
    });
    setShowEditModal(true);
  };

  const handleDeleteTopic = (topic) => {
    setSelectedTopic(topic);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showAddModal) {
        await addServiceTopic(formData);
      } else {
        await updateServiceTopic(selectedTopic.id, formData);
      }
      await loadTopics();
      setShowAddModal(false);
      setShowEditModal(false);
      setError(null);
    } catch (err) {
      setError('Failed to save service topic. Please try again.');
      console.error('Error saving topic:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteServiceTopic(selectedTopic.id);
      await loadTopics();
      setShowDeleteModal(false);
      setError(null);
    } catch (err) {
      setError('Failed to delete service topic. Please try again.');
      console.error('Error deleting topic:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

  const handleIconSelect = (icon) => {
    setFormData(prev => ({ ...prev, icon }));
    setShowIconPicker(false);
  };

  const filteredAndSortedTopics = topics
    .filter(topic => 
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'urgent':
          return (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="service-topics-management">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="service-topics-management">
      <div className="customer-service-header">
        <h2>Customer Service Management</h2>
        <div className="header-actions">
          <button 
            className="add-button"
            onClick={handleAddTopic}
          >
            Add Topic
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="service-topics-controls">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="title">Sort by Title</option>
          <option value="category">Sort by Category</option>
          <option value="urgent">Sort by Urgency</option>
        </select>
      </div>

      <div className="service-topics-grid">
        {filteredAndSortedTopics.map(topic => (
          <div key={topic.id} className="topic-box">
            <div className="topic-box-header">
              <div className="topic-icon-wrapper">
                <span className="topic-icon">{topic.icon || EMOJI_ICONS[topic.category] || '💬'}</span>
              </div>
              <div className="topic-actions">
                <button className="edit-button" onClick={() => handleEditTopic(topic)}>✏️</button>
                <button className="delete-button" onClick={() => handleDeleteTopic(topic)}>🗑️</button>
              </div>
            </div>
            <div className="topic-box-content">
              <h3 className="topic-title">{topic.title}</h3>
              <p className="topic-description">{topic.description}</p>
              <div className="topic-category">
                <span className="category-icon">{EMOJI_ICONS[topic.category] || '💬'}</span>
                <span className="category-name">{topic.category}</span>
              </div>
              {topic.isUrgent && (
                <span className="urgent-badge">Urgent</span>
              )}
              <div className="topic-meta">
                <div className="meta-item">
                  <span className="meta-label">Steps</span>
                  <span className="meta-value">{topic.steps?.length || 0}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Tips</span>
                  <span className="meta-value">{topic.tips?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="topic-modal">
            <div className="topic-modal-header">
              <h2>{showAddModal ? 'Add New Topic' : 'Edit Topic'}</h2>
              <button className="close-modal" onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="topic">Topic</label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Icon</label>
                <div className="icon-input-container">
                  <input
                    type="text"
                    className="icon-input"
                    value={formData.icon}
                    onChange={handleInputChange}
                    name="icon"
                    onClick={() => setShowIconPicker(true)}
                    placeholder="Click to select an icon"
                    readOnly
                  />
                  <div className="icon-preview">
                    {formData.icon || EMOJI_ICONS[formData.category] || '💬'}
                  </div>
                </div>
                {showIconPicker && (
                  <div className="icon-picker">
                    <div className="icon-picker-grid">
                      {Object.values(EMOJI_ICONS).map((icon, index) => (
                        <button
                          key={index}
                          className="icon-picker-item"
                          onClick={() => handleIconSelect(icon)}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Steps</label>
                {formData.steps.map((step, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'steps')}
                      placeholder={`Step ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="remove-item-button"
                      onClick={() => removeArrayItem(index, 'steps')}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => addArrayItem('steps')}
                >
                  Add Step
                </button>
              </div>

              <div className="form-group">
                <label>Tips</label>
                {formData.tips.map((tip, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'tips')}
                      placeholder={`Tip ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="remove-item-button"
                      onClick={() => removeArrayItem(index, 'tips')}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => addArrayItem('tips')}
                >
                  Add Tip
                </button>
              </div>

              <div className="form-group">
                <label>Keywords</label>
                {formData.keywords.map((keyword, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'keywords')}
                      placeholder={`Keyword ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="remove-item-button"
                      onClick={() => removeArrayItem(index, 'keywords')}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-item-button"
                  onClick={() => addArrayItem('keywords')}
                >
                  Add Keyword
                </button>
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="isUrgent"
                    name="isUrgent"
                    checked={formData.isUrgent}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="isUrgent">Mark as Urgent</label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {showAddModal ? 'Add Topic' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="warning-modal">
            <div className="modal-content">
              <div className="warning-header">
                <div className="warning-icon">⚠️</div>
                <h2 className="warning-title">Delete Topic</h2>
              </div>
              <div className="warning-body">
                <p className="warning-message">
                  Are you sure you want to delete "{selectedTopic.title}"?
                </p>
                <p className="warning-submessage">
                  This action cannot be undone.
                </p>
              </div>
              <div className="warning-actions">
                <button
                  className="cancel-delete"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-delete"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerServiceManagement; 