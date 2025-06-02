import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import leadDispositionService from '../services/leadDispositionService';
import '../styles/LeadDisposition.css';
import Header from './Header';

const DispositionModal = ({ disposition, onClose }) => {
  if (!disposition) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">{disposition.icon}</span>
            <h2>{disposition.name}</h2>
            <span className="modal-category">{disposition.category}</span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-section description-section">
            <h3>Description</h3>
            <p className="expanded-description">{disposition.description}</p>
          </div>

          <div className="modal-section situations-section">
            <h3>When to Use This Disposition</h3>
            <div className="situations-grid">
              {disposition.situations ? (
                disposition.situations.map((situation, index) => (
                  <div key={index} className="situation-card">
                    <div className="situation-header">
                      <span className="situation-icon">🎯</span>
                      <span className="situation-title">Situation {index + 1}</span>
                    </div>
                    <p className="situation-text">{situation}</p>
                  </div>
                ))
              ) : (
                <div className="situation-card">
                  <div className="situation-header">
                    <span className="situation-icon">🎯</span>
                    <span className="situation-title">Common Situations</span>
                  </div>
                  <p className="situation-text">
                    {disposition.name === 'Set Lead' && 'Use when a lead has been successfully scheduled for a consultation or appointment.'}
                    {disposition.name === 'Busy' && 'Use when the lead is currently busy and requests a callback at a later time.'}
                    {disposition.name === 'Not Set' && 'Use when unable to reach the lead or when the lead is not ready to schedule.'}
                    {disposition.name === 'Wrong Number' && 'Use when the contact information provided is incorrect or invalid.'}
                    {disposition.name === 'Not Interested' && 'Use when the lead explicitly states they are not interested in the service.'}
                    {disposition.name === 'Follow Up' && 'Use when the lead needs more time to consider or requires additional information.'}
                    {disposition.name === 'Rescheduled' && 'Use when an existing appointment has been moved to a different time.'}
                    {disposition.name === 'Cancelled' && 'Use when the lead cancels their appointment or consultation.'}
                    {disposition.name === 'Completed' && 'Use when the service has been successfully delivered to the lead.'}
                    {disposition.name === 'No Answer' && 'Use when the lead does not answer the call after multiple attempts.'}
                    {disposition.name === 'Voicemail' && 'Use when the call goes to voicemail and a message is left.'}
                    {disposition.name === 'Callback Requested' && 'Use when the lead specifically requests a callback at a later time.'}
                    {disposition.name === 'Qualified' && 'Use when the lead meets all the criteria for the service and is ready to proceed.'}
                    {disposition.name === 'Not Qualified' && 'Use when the lead does not meet the necessary criteria for the service.'}
                    {disposition.name === 'Technical Issues' && 'Use when there are technical problems preventing proper communication.'}
                    {disposition.name === 'External Factors' && 'Use when external circumstances affect the lead\'s ability to proceed.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="modal-section next-steps-section">
            <h3>Next Steps</h3>
            <p>{disposition.nextSteps}</p>
          </div>

          {disposition.tips && disposition.tips.length > 0 && (
            <div className="modal-section tips-section">
              <h3>Tips & Best Practices</h3>
              <ul className="enhanced-tips">
                {disposition.tips.map((tip, index) => (
                  <li key={index}>
                    <span className="tip-icon">💡</span>
                    <span className="tip-text">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {disposition.examples && disposition.examples.length > 0 && (
            <div className="modal-section examples-section">
              <h3>Common Examples</h3>
              <div className="examples-grid">
                {disposition.examples.map((example, index) => (
                  <div key={index} className="example-card">
                    <div className="example-header">
                      <span className="example-icon">📋</span>
                      <span className="example-number">Example {index + 1}</span>
                    </div>
                    <p className="example-text">{example}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {disposition.subcategories && disposition.subcategories.length > 0 && (
            <div className="modal-section subcategories-section">
              <h3>Subcategories</h3>
              <div className="subcategories-grid">
                {disposition.subcategories.map((subcategory, index) => (
                  <div key={index} className="subcategory-card">
                    <span className="subcategory-icon">🔹</span>
                    <span className="subcategory-name">{subcategory}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LeadDisposition = ({ onNavigate, searchQuery }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDisposition, setSelectedDisposition] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [showModal, setShowModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dispositions, setDispositions] = useState([]);
  const [filteredDispositions, setFilteredDispositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dispositionCategories, setDispositionCategories] = useState([]);

  // Get category icon
  const getCategoryIcon = (category) => {
    const foundCategory = dispositionCategories.find(cat => cat.id === category);
    return foundCategory ? foundCategory.icon : '📋';
  };

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Get semantic score for search relevance
  const getSemanticScore = (query, text) => {
    if (!text) return 0;
    const queryWords = query.toLowerCase().split(' ');
    const textWords = text.toLowerCase().split(' ');
    let score = 0;

    queryWords.forEach(word => {
      textWords.forEach(textWord => {
        if (textWord.includes(word) || word.includes(textWord)) {
          score += 1;
        }
      });
    });

    return score / queryWords.length;
  };

  // Perform intelligent search
  const performIntelligentSearch = async (query) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const searchResults = await leadDispositionService.searchDispositions(query);
      setSearchSuggestions(searchResults);
    } catch (err) {
      console.error('Error searching dispositions:', err);
      setError('Failed to search dispositions. Please try again.');
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      performIntelligentSearch(query);
    }, 300),
    []
  );

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    debouncedSearch(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchSuggestions.length) {
          handleSuggestionClick(searchSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.name);
    setShowSuggestions(false);
    setSelectedDisposition(suggestion);
    setShowModal(true);
  };

  const handleQuickAction = (action) => {
    setShowQuickActions(false);
    setSearchTerm('');
    setSelectedDisposition(action);
    setShowModal(true);
  };

  const handleReinitializeDispositions = async () => {
    try {
      setLoading(true);
      setError(null);
      await leadDispositionService.forceReinitializeDispositions();
      const fetchedDispositions = await leadDispositionService.getAllDispositions();
      setDispositions(fetchedDispositions);
      setFilteredDispositions(fetchedDispositions);
    } catch (err) {
      console.error('Error reinitializing dispositions:', err);
      setError('Failed to reinitialize dispositions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dispositions and categories from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both dispositions and categories
        const [fetchedDispositions, fetchedCategories] = await Promise.all([
          leadDispositionService.getAllDispositions(),
          leadDispositionService.getDispositionCategories()
        ]);
        
        setDispositions(fetchedDispositions);
        setFilteredDispositions(fetchedDispositions);
        setDispositionCategories(fetchedCategories);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update filtered dispositions when category or search changes
  useEffect(() => {
    if (!dispositions) return; // Guard against uninitialized dispositions

    let filtered = dispositions;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchLower) ||
        d.description.toLowerCase().includes(searchLower) ||
        d.nextSteps.toLowerCase().includes(searchLower) ||
        (Array.isArray(d.tips) && d.tips.some(tip => tip.toLowerCase().includes(searchLower)))
      );
    }

    setFilteredDispositions(filtered);
  }, [dispositions, searchTerm, selectedCategory]);

  // Reset to all dispositions when component mounts or when returning to the page
  useEffect(() => {
    setSelectedCategory('all');
    setSearchTerm('');
  }, []);

  const handleDispositionClick = (disposition) => {
    setSelectedDisposition(disposition);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading dispositions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <Header 
        title="Lead Disposition"
        subtitle="Track and manage your lead dispositions"
      />
      <div className="disposition-container">
        <div className="disposition-content">
          <div className="disposition-header">
            <h1 className="disposition-title">Lead Disposition Library</h1>
            <div className="header-actions">
              <button 
                onClick={handleReinitializeDispositions}
                className="reinitialize-button"
                disabled={loading}
              >
                {loading ? 'Reinitializing...' : 'Reinitialize Dispositions'}
              </button>
            </div>
            <div className="header-navigation">
              <div className="quick-nav">
                <button
                  onClick={() => onNavigate('home')}
                  className="nav-button home-button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Home
                </button>
                <button
                  onClick={() => onNavigate('rebuttals')}
                  className={`nav-button ${window.location.pathname.includes('rebuttals') ? 'active' : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 9H17M7 13H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Rebuttals
                </button>
                <button
                  onClick={() => onNavigate('disposition')}
                  className={`nav-button ${window.location.pathname.includes('disposition') ? 'active' : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Disposition
                </button>
              </div>
            </div>
          </div>

          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search dispositions..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="search-input"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="suggestion-icon">{suggestion.icon}</span>
                      <div className="suggestion-content">
                        <div className="suggestion-title">{suggestion.name}</div>
                        <div className="suggestion-category">{suggestion.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dispositions-grid">
            {filteredDispositions.map(disposition => (
              <div 
                key={disposition.id} 
                className={`disposition-card ${disposition.color}`}
                onClick={() => handleDispositionClick(disposition)}
              >
                <div className="card-header">
                  <span className="card-icon">{disposition.icon}</span>
                  <div className="card-title-container">
                    <h2 className="card-title">{disposition.name}</h2>
                    <span className="card-category">{disposition.category}</span>
                  </div>
                </div>
                <div className="card-content">
                  <p className="card-description">{disposition.description}</p>
                  <div className="card-preview">
                    <div className="preview-section">
                      <h4>Next Steps</h4>
                      <p>{disposition.nextSteps}</p>
                    </div>
                    {disposition.tips && disposition.tips.length > 0 && (
                      <div className="preview-section">
                        <h4>Key Tips</h4>
                        <ul>
                          {disposition.tips.slice(0, 2).map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                          {disposition.tips.length > 2 && (
                            <li className="more-tips">+{disposition.tips.length - 2} more tips</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    <span className="click-hint">Click to view full details</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDispositions.length === 0 && (
            <div className="no-results">
              No dispositions found matching your search criteria.
            </div>
          )}
        </div>
      </div>

      {selectedDisposition && (
        <DispositionModal 
          disposition={selectedDisposition} 
          onClose={() => setSelectedDisposition(null)} 
        />
      )}
    </div>
  );
};

export default LeadDisposition;