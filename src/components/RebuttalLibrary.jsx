import React, { useState, useEffect, useCallback } from 'react';
import { callCenterRebuttals } from '../data/rebuttals';
import '../styles/RebuttalLibrary.css';

const RebuttalLibrary = ({ onNavigate, searchQuery }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRebuttal, setSelectedRebuttal] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [showModal, setShowModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [urgentRebuttal, setUrgentRebuttal] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [allRebuttals, setAllRebuttals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (showModal) {
      const scrollY = document.documentElement.scrollTop || document.body.scrollTop;
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showModal]);

  useEffect(() => {
    // Load static data
    setAllRebuttals(callCenterRebuttals);
    setLoading(false);
  }, []);

  const categories = [
    { id: 'all', name: 'All Categories', icon: '📋', color: 'gray' },
    { id: 'not-interested', name: 'I\'m Not Interested', icon: '❌', color: 'red' },
    { id: 'spouse-consultation', name: 'I Need to Talk to My Spouse', icon: '💑', color: 'pink' },
    { id: 'one-legger', name: 'One Decision Maker', icon: '👤', color: 'blue' },
    { id: 'not-ready', name: 'Not Ready to Start', icon: '⏳', color: 'yellow' },
    { id: 'curious', name: 'I Was Just Curious', icon: '🤔', color: 'purple' },
    { id: 'time-concern', name: 'Time Concerns (60-90 Min)', icon: '⏰', color: 'orange' },
    { id: 'cant-afford', name: 'Can\'t Afford Right Now', icon: '💰', color: 'green' },
    { id: 'spouse', name: 'Spouse Attendance Issues', icon: '👫', color: 'teal' },
    { id: 'price-phone', name: 'Price Over Phone Request', icon: '📞', color: 'indigo' },
    { id: 'repair', name: 'Repair Only Request', icon: '🔧', color: 'brown' },
    { id: 'government-grants', name: 'Government Grants', icon: '🏛️', color: 'cyan' },
    { id: 'reset-appt', name: 'Reset Appointment', icon: '🔄', color: 'lime' },
    { id: 'no-request', name: 'Did Not Request Info', icon: '🚫', color: 'amber' },
    { id: 'bad-reviews', name: 'Negative Reviews Concern', icon: '⭐', color: 'rose' }
  ];
  
  // Define most common objections
  const commonObjectionCategories = [
    'not-interested',
    'spouse-consultation', 
    'price-phone',
    'time-concern',
    'cant-afford'
  ];

  const urgentRebuttalTopics = [
    {
      id: 'urgent-1',
      topic: 'rebuttals',
      title: 'Urgent Rebuttal: Price Concern',
      description: 'Quick response for customer price concerns',
      steps: [
        'Acknowledge the concern',
        'Highlight value proposition',
        'Offer flexible payment options',
        'Provide immediate discount if applicable'
      ],
      tips: [
        'Stay calm and professional',
        'Focus on value, not just price',
        'Be ready to negotiate'
      ],
      keywords: ['price', 'expensive', 'cost', 'budget', 'afford'],
      isUrgent: true
    },
    {
      id: 'urgent-2',
      topic: 'rebuttals',
      title: 'Urgent Rebuttal: Scheduling Conflict',
      description: 'Handle immediate scheduling conflicts',
      steps: [
        'Verify current appointment time',
        'Check alternative slots',
        'Offer priority rescheduling',
        'Confirm new time immediately'
      ],
      tips: [
        'Be flexible with timing',
        'Offer multiple options',
        'Ensure quick confirmation'
      ],
      keywords: ['schedule', 'time', 'conflict', 'reschedule', 'urgent'],
      isUrgent: true
    },
    {
      id: 'urgent-3',
      topic: 'rebuttals',
      title: 'Urgent Rebuttal: Service Quality',
      description: 'Address immediate service quality concerns',
      steps: [
        'Listen to the concern',
        'Apologize if necessary',
        'Offer immediate solution',
        'Follow up with supervisor'
      ],
      tips: [
        'Show empathy',
        'Take immediate action',
        'Document the issue'
      ],
      keywords: ['quality', 'service', 'issue', 'problem', 'concern'],
      isUrgent: true
    }
  ];

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
  const performIntelligentSearch = (query) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = [];
    const searchTerms = query.toLowerCase().split(' ');

    allRebuttals.forEach(rebuttal => {
      const titleScore = getSemanticScore(query, rebuttal.title);
      const summaryScore = getSemanticScore(query, rebuttal.summary);
      const tagsScore = rebuttal.tags.reduce((score, tag) => 
        score + getSemanticScore(query, tag), 0) / rebuttal.tags.length;
      
      const contentScore = rebuttal.content.pt1 ? 
        getSemanticScore(query, rebuttal.content.pt1) : 0;
      const content2Score = rebuttal.content.pt2 ? 
        getSemanticScore(query, rebuttal.content.pt2) : 0;

      const relevanceScore = Math.max(
        titleScore * 2, // Title matches are more important
        summaryScore,
        tagsScore,
        contentScore,
        content2Score
      );

      if (relevanceScore > 0.3) {
        suggestions.push({
          ...rebuttal,
          relevanceScore
        });
      }
    });

    // Sort by relevance score
    suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
    setSearchSuggestions(suggestions);
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
    setSearchTerm(suggestion.title);
    setShowSuggestions(false);
    setSelectedRebuttal(suggestion);
    setShowModal(true);
  };

  const filteredRebuttals = allRebuttals.filter(rebuttal => {
    const matchesCategory = selectedCategory === 'all' || rebuttal.category === selectedCategory;
    
    // Special handling for "common objections" search
    if (searchTerm.toLowerCase() === 'common objections') {
      return commonObjectionCategories.includes(rebuttal.category);
    }
    
    const matchesSearch = searchTerm === '' || 
      rebuttal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rebuttal.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rebuttal.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rebuttal.content.pt1 && rebuttal.content.pt1.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rebuttal.content.pt2 && rebuttal.content.pt2.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const openModal = (rebuttal) => {
    setSelectedRebuttal(rebuttal);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRebuttal(null);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleQuickAction = (action) => {
    setShowQuickActions(false);
    setSearchTerm('');
    setUrgentRebuttal(action);
    setShowModal(true);
  };

  const renderRebuttalContent = (content) => {
    if (typeof content === 'string') {
      return <p className="modal-content-text">{content}</p>;
    }
    
    return (
      <div className="rebuttal-content-sections">
        {content.pt1 && (
          <div className="rebuttal-section">
            <h4 className="rebuttal-section-title">🎯 Initial Response (Use First)</h4>
            <p className="modal-content-text">{content.pt1}</p>
          </div>
        )}
        
        {content.pt2 && (
          <div className="rebuttal-section">
            <h4 className="rebuttal-section-title">🔄 Follow-up Response (If Still Objecting)</h4>
            <p className="modal-content-text">{content.pt2}</p>
          </div>
        )}
      </div>
    );
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const foundCategory = categories.find(cat => cat.id === category);
    return foundCategory ? foundCategory.icon : '📋';
  };

  return (
    <div className="library-container">
      <div className="library-content">
        {loading ? (
          <div className="library-loading">
            <div className="loading-spinner"></div>
            <p>Loading rebuttals...</p>
          </div>
        ) : (
          <>
            <div className="library-header">
              <h1 className="library-title">Call Center Rebuttals</h1>
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
                      <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 3H15V5H9V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Lead Disposition
                  </button>
                  <button
                    onClick={() => onNavigate('customerService')}
                    className={`nav-button ${window.location.pathname.includes('customerService') ? 'active' : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01M16 18H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Customer Service
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="search-container">
              <div className="search-input-wrapper">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search rebuttals by title, content, or tags..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  className="search-input"
                  aria-label="Search rebuttals"
                  aria-expanded={showSuggestions}
                  aria-controls="search-suggestions"
                  aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
                />
                <button 
                  className="quick-actions-button"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  aria-label="Quick actions"
                >
                  ⚡
                </button>
                {searchTerm && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setShowSuggestions(false);
                    }} 
                    className="clear-search-button"
                    aria-label="Clear search"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions-dropdown" id="search-suggestions">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      id={`suggestion-${index}`}
                      className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      <span className="suggestion-icon">
                        {getCategoryIcon(suggestion.category)}
                      </span>
                      <div className="suggestion-content">
                        <h4>{suggestion.title}</h4>
                        <p>{suggestion.summary}</p>
                        <div className="suggestion-tags">
                          {suggestion.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="relevance-badge">
                        {suggestion.relevanceScore > 0.8 ? 'High' : 
                         suggestion.relevanceScore > 0.5 ? 'Medium' : 'Low'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchTerm && (
                <div className="search-results-count">
                  {filteredRebuttals.length} result{filteredRebuttals.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>

            <div className="library-layout">
              {/* Sidebar */}
              <div className="library-sidebar">
                <h2 className="library-sidebar-title">Categories</h2>
                <div className="library-categories">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`library-category-button ${selectedCategory === category.id ? 'active' : ''} ${category.color}`}
                    >
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Main Content */}
              <div className="library-main">
                {/* Common Objections Header */}
                {searchTerm.toLowerCase() === 'common objections' && (
                  <div className="common-objections-header">
                    <h2 className="common-objections-title">Most Common Objections & Smart Tips</h2>
                    <div className="smart-tips-container">
                      <div className="smart-tip">
                        <span className="tip-icon">💡</span>
                        <strong>Pro Tip:</strong> Always acknowledge the customer's concern before presenting your rebuttal
                      </div>
                      <div className="smart-tip">
                        <span className="tip-icon">🎯</span>
                        <strong>Script Strategy:</strong> Use Part 1 first, then escalate to Part 2 if needed
                      </div>
                      <div className="smart-tip">
                        <span className="tip-icon">⚡</span>
                        <strong>Quick Response:</strong> These 5 objections cover 80% of customer concerns
                      </div>
                    </div>
                  </div>
                )}
                
                {filteredRebuttals.map(rebuttal => (
                  <div 
                    key={rebuttal.id} 
                    className="library-rebuttal-card"
                    onClick={() => openModal(rebuttal)}
                  >
                    <div className="library-rebuttal-content">
                      <div className="library-rebuttal-info">
                        <h3 className="library-rebuttal-title">{rebuttal.title}</h3>
                        <p className="library-rebuttal-summary">{rebuttal.summary}</p>
                        <div className="library-rebuttal-tags">
                          {rebuttal.tags.map(tag => (
                            <span key={tag} className="library-rebuttal-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedRebuttal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2 className="modal-title">{selectedRebuttal.title}</h2>
                <div className="modal-id">ID: {selectedRebuttal.id}</div>
              </div>
              <button onClick={closeModal} className="modal-close-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-tags">
                {selectedRebuttal.tags.map(tag => (
                  <span key={tag} className="modal-tag">
                    #{tag}
                  </span>
                ))}
              </div>
              
              <div className="modal-summary">
                <div className="modal-section-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3>Situation Overview</h3>
                </div>
                <p className="modal-summary-text">{selectedRebuttal.summary}</p>
              </div>
              
              <div className="modal-rebuttal-content">
                <div className="modal-section-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3>Rebuttal Strategy</h3>
                </div>
                {renderRebuttalContent(selectedRebuttal.content)}
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="modal-footer-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                💡 Pro Tip: Start with the Initial Response. If customer still objects, use the Follow-up Response
              </div>
              <button onClick={closeModal} className="modal-close-footer-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RebuttalLibrary;