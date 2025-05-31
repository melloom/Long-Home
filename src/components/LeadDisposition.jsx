import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leadDispositionService } from '../services/leadDispositionService';
import '../styles/LeadDisposition.css';

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

  const dispositionCategories = [
    { id: 'all', name: 'All Dispositions', icon: '📋', color: 'gray' },
    { id: 'follow-up', name: 'Follow-Up Required', icon: '📞', color: 'blue' },
    { id: 'not-qualified', name: 'Not Qualified', icon: '❌', color: 'red' },
    { id: 'technical', name: 'Technical Issues', icon: '⚙️', color: 'orange' },
    { id: 'external', name: 'External Factors', icon: '🏠', color: 'purple' }
  ];

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

  // Fetch dispositions from Firebase
  useEffect(() => {
    const fetchDispositions = async () => {
      try {
        setLoading(true);
        const fetchedDispositions = await leadDispositionService.getAllDispositions();
        setDispositions(fetchedDispositions);
        setFilteredDispositions(fetchedDispositions);
        setError(null);
      } catch (err) {
        console.error('Error fetching dispositions:', err);
        setError('Failed to load dispositions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDispositions();
  }, []);

  useEffect(() => {
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
    <div className="disposition-container">
      <div className="disposition-content">
        <div className="disposition-header">
          <h1 className="disposition-title">Lead Disposition Library</h1>
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
            <div key={disposition.id} className={`disposition-card ${disposition.color}`}>
              <div className="card-header">
                <span className="card-icon">{disposition.icon}</span>
                <h2 className="card-title">{disposition.name}</h2>
              </div>
              <p className="card-description">{disposition.description}</p>
              <div className="card-next-steps">
                <h4>Next Steps:</h4>
                <p>{disposition.nextSteps}</p>
              </div>
              <div className="card-tips">
                <h4>Tips:</h4>
                <ul>
                  {disposition.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
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
  );
};

export default LeadDisposition;