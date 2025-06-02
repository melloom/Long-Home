import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addRebuttal, getRebuttal, updateRebuttal } from '../../services/firebase/rebuttals';
import './RebuttalForm.css';

// Pre-made tags for common rebuttal categories
const PREMADE_TAGS = [
  'Price Concern',
  'Time Constraint',
  'Spouse Decision',
  'Budget Issues',
  'Not Ready',
  'Competitor Comparison',
  'Quality Concerns',
  'Installation Time',
  'Warranty Questions',
  'Financing Options',
  'Custom Design',
  'Material Selection',
  'Maintenance',
  'Rescheduling',
  'Emergency Service'
];

const RebuttalForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: { pt1: '', pt2: '' },
    tags: [],
    category: '',
    situationOverview: '',
    rebuttalStrategy: '',
    tips: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      loadRebuttal();
    }
  }, [id]);

  const loadRebuttal = async () => {
    try {
      const rebuttal = await getRebuttal(id);
      if (rebuttal) {
        setFormData({
          title: rebuttal.title || '',
          summary: rebuttal.summary || '',
          content: {
            pt1: typeof rebuttal.content === 'object' ? rebuttal.content.pt1 : rebuttal.content || '',
            pt2: typeof rebuttal.content === 'object' ? rebuttal.content.pt2 : ''
          },
          tags: rebuttal.tags || [],
          category: rebuttal.category || '',
          situationOverview: rebuttal.situationOverview || '',
          rebuttalStrategy: rebuttal.rebuttalStrategy || '',
          tips: rebuttal.tips || []
        });
      }
    } catch (error) {
      console.error('Error loading rebuttal:', error);
      setError('Error loading rebuttal');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (part, value) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [part]: value
      }
    }));
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setNewTag(value);
    
    // Filter pre-made tags based on input
    if (value.trim()) {
      const filtered = PREMADE_TAGS.filter(tag => 
        tag.toLowerCase().includes(value.toLowerCase()) &&
        !formData.tags.includes(tag)
      );
      setFilteredTags(filtered);
      setShowTagDropdown(true);
    } else {
      setFilteredTags([]);
      setShowTagDropdown(false);
    }
  };

  const handleAddTag = (tag) => {
    const tagToAdd = tag || newTag.trim();
    if (tagToAdd && !formData.tags.includes(tagToAdd)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagToAdd]
      }));
      setNewTag('');
      setShowTagDropdown(false);
      setFilteredTags([]);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddTip = () => {
    if (newTag.trim() && !formData.tips.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tips: [...prev.tips, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTip = (tipToRemove) => {
    setFormData(prev => ({
      ...prev,
      tips: prev.tips.filter(tip => tip !== tipToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const rebuttalData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (isEditing) {
        await updateRebuttal(id, rebuttalData);
      } else {
        rebuttalData.createdAt = new Date().toISOString();
        await addRebuttal(rebuttalData);
      }

      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error saving rebuttal:', error);
      setError('Error saving rebuttal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rebuttal-form-container">
      <div className="rebuttal-form-box">
        <h1>{isEditing ? 'Edit Rebuttal' : 'Add New Rebuttal'}</h1>
        {error && <div className="error-message">{error}</div>}
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
              placeholder="Enter rebuttal title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              placeholder="Enter category"
            />
          </div>

          <div className="form-group">
            <label htmlFor="summary">Summary</label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              required
              rows="3"
              placeholder="Enter a brief summary of the rebuttal"
            />
          </div>

          <div className="form-group">
            <label htmlFor="situationOverview">Situation Overview</label>
            <textarea
              id="situationOverview"
              name="situationOverview"
              value={formData.situationOverview}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Describe the situation or objection being addressed"
            />
          </div>

          <div className="form-group">
            <label htmlFor="rebuttalStrategy">Rebuttal Strategy</label>
            <textarea
              id="rebuttalStrategy"
              name="rebuttalStrategy"
              value={formData.rebuttalStrategy}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Describe the overall strategy for this rebuttal"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content-pt1">Initial Response (Part 1)</label>
            <textarea
              id="content-pt1"
              value={formData.content.pt1}
              onChange={(e) => handleContentChange('pt1', e.target.value)}
              required
              rows="6"
              placeholder="Enter the initial response to the objection..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="content-pt2">Follow-up Response (Part 2)</label>
            <textarea
              id="content-pt2"
              value={formData.content.pt2}
              onChange={(e) => handleContentChange('pt2', e.target.value)}
              rows="6"
              placeholder="Enter the follow-up response if the initial response doesn't work..."
            />
          </div>

          <div className="form-group">
            <label>Tips</label>
            <div className="tags-input-container">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tip (e.g., 'Stay calm and professional')"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTip();
                  }
                }}
              />
              <button type="button" onClick={handleAddTip} className="add-tag-btn">
                Add Tip
              </button>
            </div>
            <div className="tags-container">
              {formData.tips.map((tip, index) => (
                <span key={index} className="tag">
                  💡 {tip}
                  <button
                    type="button"
                    onClick={() => handleRemoveTip(tip)}
                    className="remove-tag-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input-container">
              <div className="tags-input-wrapper">
                <input
                  type="text"
                  value={newTag}
                  onChange={handleTagInputChange}
                  placeholder="Add a tag or select from suggestions"
                  className="tags-input"
                />
                {showTagDropdown && filteredTags.length > 0 && (
                  <div className="tags-dropdown">
                    {filteredTags.map((tag, index) => (
                      <div
                        key={index}
                        className="tag-suggestion"
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="add-tag-btn"
                disabled={!newTag.trim()}
              >
                Add Tag
              </button>
            </div>
            <div className="tags-container">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="remove-tag-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="premade-tags">
              <h4>Common Tags:</h4>
              <div className="premade-tags-list">
                {PREMADE_TAGS.map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="premade-tag"
                    disabled={formData.tags.includes(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RebuttalForm; 