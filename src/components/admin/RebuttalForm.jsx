import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addRebuttal, getRebuttal, updateRebuttal } from '../../services/firebase/rebuttals';
import './RebuttalForm.css';

const RebuttalForm = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
        setTitle(rebuttal.title);
        setContent(rebuttal.content);
      }
    } catch (error) {
      console.error('Error loading rebuttal:', error);
      setError('Error loading rebuttal');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const rebuttalData = {
        title,
        content,
      };

      if (isEditing) {
        await updateRebuttal(id, rebuttalData);
      } else {
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows="10"
            />
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