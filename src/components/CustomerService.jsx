import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { getServiceTopics, getServiceTopicsByCategory, getUrgentServiceTopics, getCategories } from '../services/customerServiceService';
import '../styles/CustomerService.css';
import Header from './Header';

// Fuzzy search helper function
const fuzzySearch = (str, pattern) => {
  pattern = pattern.toLowerCase();
  str = str.toLowerCase();
  let patternIdx = 0;
  let strIdx = 0;
  let matches = 0;
  let lastMatch = -1;

  while (strIdx < str.length && patternIdx < pattern.length) {
    if (pattern[patternIdx] === str[strIdx]) {
      matches++;
      lastMatch = strIdx;
      patternIdx++;
    }
    strIdx++;
  }

  return patternIdx === pattern.length ? matches / pattern.length : 0;
};

// Enhanced common misspellings mapping
const commonMisspellings = {
  'appointment': ['apointment', 'appoinment', 'appoitment', 'apointmnt'],
  'schedule': ['scedule', 'scedual', 'schedual', 'scedul'],
  'cancel': ['cancell', 'cancle', 'cancell', 'cancle'],
  'reschedule': ['rescedule', 'rescedual', 'reschedual', 'rescedul'],
  'confirm': ['confrim', 'conferm', 'confurm', 'confrm'],
  'follow': ['follw', 'folow', 'foll', 'folow'],
  'up': ['up', 'up', 'up', 'up'],
  'management': ['managment', 'mangement', 'managment', 'mangmnt'],
  'service': ['servise', 'servis', 'servic', 'servis'],
  'customer': ['custumer', 'custmer', 'custmor', 'custmr'],
  'help': ['helpp', 'helpe', 'hel', 'helpe'],
  'search': ['searcgh', 'serch', 'searh', 'serach'],
  'find': ['fid', 'findd', 'fnd', 'find'],
  'looking': ['lookin', 'lookng', 'lookig', 'lookn'],
  'assist': ['asist', 'assistt', 'asst', 'asist'],
  'home': ['hom', 'hoem', 'hme', 'hom'],
  'correct': ['corrcet', 'corret', 'corrct', 'corret'],
  'spell': ['spel', 'spelll', 'spl', 'spel'],
  'word': ['wrd', 'wor', 'wod', 'wrd'],
  'make': ['mak', 'maek', 'mke', 'mak'],
  'way': ['wai', 'wae', 'wayy', 'wai'],
  'more': ['moer', 'mor', 'mre', 'moer'],
  'helpful': ['helpfull', 'helpfu', 'helful', 'helpfl'],
  'something': ['somehting', 'somthing', 'somethng', 'somethig'],
  'wrong': ['wron', 'wrog', 'wong', 'wronng'],
  'will': ['wil', 'wll', 'wil', 'wll'],
  'try': ['try', 'tri', 'tryy', 'try'],
  'auto': ['auto', 'aut', 'autoo', 'auto'],
  'options': ['aoptiinoin', 'optins', 'optons', 'opions'],
  'bar': ['bar', 'br', 'bar', 'br']
};

// Common search patterns
const searchPatterns = {
  'how to': ['how do i', 'how can i', 'how do you', 'how to'],
  'when can': ['when can i', 'when is', 'when will', 'when should'],
  'where to': ['where can i', 'where do i', 'where is', 'where to'],
  'what is': ['whats', 'what is', 'what are', 'what do'],
  'why do': ['why does', 'why is', 'why are', 'why do'],
  'can i': ['can you', 'is it possible', 'is there a way', 'can i'],
  'need to': ['want to', 'have to', 'should i', 'need to'],
  'looking for': ['searching for', 'trying to find', 'want to find', 'looking for']
};

const CustomerService = ({ onNavigate, searchQuery }) => {
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [urgentRebuttal, setUrgentRebuttal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceTopics, setServiceTopics] = useState([]);
  const [urgentTopics, setUrgentTopics] = useState([]);

  const topics = [
    { 
      id: 'appointments', 
      name: 'Appointment Management', 
      icon: '📅', 
      color: 'blue',
      features: [
        'Calendar Integration',
        'Automated Reminders',
        'Conflict Resolution',
        'Appointment History',
        'Rescheduling Options'
      ],
      description: 'Manage your appointments efficiently with our comprehensive scheduling system'
    },
    { 
      id: 'scheduling', 
      name: 'Scheduling', 
      icon: '⏰', 
      color: 'green',
      features: [
        'Real-time Availability',
        'Multiple Time Zones',
        'Recurring Appointments',
        'Buffer Time Settings'
      ],
      description: 'Schedule appointments with ease using our flexible booking system'
    },
    { 
      id: 'confirmation', 
      name: 'Confirmation', 
      icon: '✅', 
      color: 'yellow',
      features: [
        'Email Confirmations',
        'SMS Notifications',
        'Calendar Invites',
        'Reminder Settings'
      ],
      description: 'Keep track of your appointments with automated confirmations'
    },
    { 
      id: 'cancellation', 
      name: 'Cancellation', 
      icon: '❌', 
      color: 'red',
      features: [
        'Cancellation Policy',
        'Rescheduling Options',
        'Waitlist Management',
        'No-show Prevention'
      ],
      description: 'Handle appointment cancellations and rescheduling efficiently'
    },
    { 
      id: 'followup', 
      name: 'Follow-up', 
      icon: '📞', 
      color: 'purple',
      features: [
        'Post-appointment Surveys',
        'Feedback Collection',
        'Follow-up Scheduling',
        'Communication History'
      ],
      description: 'Maintain relationships with automated follow-up systems'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading customer service data...');

      // Load categories
      const categoriesData = await getCategories();
      console.log('Loaded categories:', categoriesData);
      setCategories(categoriesData);

      // Load service topics
      const topicsData = await getServiceTopics();
      console.log('Loaded service topics:', topicsData);
      setServiceTopics(topicsData);

      // Load urgent topics
      const urgentData = await getUrgentServiceTopics();
      console.log('Loaded urgent topics:', urgentData);
      setUrgentTopics(urgentData);

      // Debug log for all topics
      console.log('All topics combined:', [...topicsData, ...urgentData]);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const allServiceTopics = [...serviceTopics, ...urgentTopics].map((topic, index) => ({
    ...topic,
    uniqueId: `${topic.id}-${index}`
  }));

  const correctSpelling = (word) => {
    const lowerWord = word.toLowerCase();
    for (const [correct, misspellings] of Object.entries(commonMisspellings)) {
      if (misspellings.includes(lowerWord)) {
        return correct;
      }
    }
    return word;
  };

  const normalizeSearchQuery = (query) => {
    let normalized = query.toLowerCase();
    
    // Replace common patterns
    for (const [pattern, variations] of Object.entries(searchPatterns)) {
      for (const variation of variations) {
        if (normalized.includes(variation)) {
          normalized = normalized.replace(variation, pattern);
        }
      }
    }

    // Correct spelling
    return normalized.split(' ').map(word => correctSpelling(word)).join(' ');
  };

  const getSearchSuggestions = (term) => {
    if (!term.trim()) {
      return [];
    }

    const normalizedTerm = normalizeSearchQuery(term);
    const suggestions = [];

    // Search through all service topics
    allServiceTopics.forEach(topic => {
      const titleScore = fuzzySearch(topic.title, normalizedTerm);
      const descScore = fuzzySearch(topic.description, normalizedTerm);
      const keywordScores = topic.keywords.map(keyword => fuzzySearch(keyword, normalizedTerm));
      const maxKeywordScore = Math.max(...keywordScores);

      const relevanceScore = Math.max(titleScore, descScore, maxKeywordScore);

      if (relevanceScore > 0.3) {
        suggestions.push({
          ...topic,
          relevanceScore
        });
      }
    });

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const handleSearch = (term) => {
    const correctedTerm = normalizeSearchQuery(term);
    setSearchTerm(correctedTerm);
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

    allServiceTopics.forEach(topic => {
      const titleScore = getSemanticScore(query, topic.title);
      const descriptionScore = getSemanticScore(query, topic.description);
      const categoryScore = getSemanticScore(query, topic.topic);
      const stepsScore = topic.steps.reduce((score, step) => 
        score + getSemanticScore(query, step), 0) / topic.steps.length;
      const tipsScore = topic.tips.reduce((score, tip) => 
        score + getSemanticScore(query, tip), 0) / topic.tips.length;

      const relevanceScore = Math.max(
        titleScore * 2, // Title matches are more important
        descriptionScore,
        categoryScore,
        stepsScore,
        tipsScore
      );

      if (relevanceScore > 0.3) {
        suggestions.push({
          ...topic,
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
    setSelectedService(suggestion);
    setShowModal(true);
  };

  const filteredTopics = useMemo(() => {
    return allServiceTopics.filter(topic => {
      const matchesCategory = selectedTopic === 'all' || topic.topic === selectedTopic;
      const matchesSearch = !searchTerm || 
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (topic.steps && topic.steps.some(step => step.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (topic.tips && topic.tips.some(tip => tip.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (topic.keywords && topic.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase())));
      
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      // Sort by title
      return a.title.localeCompare(b.title);
    });
  }, [allServiceTopics, selectedTopic, searchTerm]);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedService(null);
  };

  const handleQuickAction = (action) => {
    setShowQuickActions(false);
    setSearchTerm('');
    setUrgentRebuttal(action);
    setShowModal(true);
  };

  // Add appointment management specific functions
  const handleAppointmentAction = (action, appointmentId) => {
    switch (action) {
      case 'schedule':
        // Handle scheduling logic
        break;
      case 'reschedule':
        // Handle rescheduling logic
        break;
      case 'cancel':
        // Handle cancellation logic
        break;
      case 'confirm':
        // Handle confirmation logic
        break;
      default:
        break;
    }
  };

  // Add appointment management specific UI components
  const renderAppointmentManagement = () => {
    if (selectedTopic === 'appointments') {
      return (
        <div className="appointment-management">
          <div className="appointment-actions">
            <button onClick={() => handleAppointmentAction('schedule')}>Schedule New</button>
            <button onClick={() => handleAppointmentAction('reschedule')}>Reschedule</button>
            <button onClick={() => handleAppointmentAction('cancel')}>Cancel</button>
            <button onClick={() => handleAppointmentAction('confirm')}>Confirm</button>
          </div>
          <div className="appointment-calendar">
            {/* Calendar component will be added here */}
          </div>
          <div className="appointment-list">
            {/* Appointment list will be added here */}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="customer-service-container">
      <Header 
        title="Customer Service"
        subtitle="Manage customer service interactions and support"
      />
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading customer service data...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
          <button className="retry-button" onClick={loadData}>
            Retry
          </button>
        </div>
      ) : (
        <div className="customer-service-content">
          <div className="customer-service-header">
            <h1 className="customer-service-title">Customer Service</h1>
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

          {/* Enhanced Search Bar with Quick Actions */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search service topics by title, category, or steps..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                className="search-input"
                aria-label="Search service topics"
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
            
            {/* Quick Actions Dropdown */}
            {showQuickActions && (
              <div className="quick-actions-dropdown">
                <div className="quick-actions-header">
                  <h3>Quick Actions</h3>
                  <p>Select an urgent rebuttal to handle immediately</p>
                </div>
                {urgentTopics.map(topic => (
                  <div
                    key={topic.id}
                    className="quick-action-item"
                    onClick={() => handleQuickAction(topic)}
                  >
                    <span className="quick-action-icon">⚡</span>
                    <div className="quick-action-content">
                      <h4>{topic.title}</h4>
                      <p>{topic.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="search-suggestions-dropdown" id="search-suggestions">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.uniqueId}
                    id={`suggestion-${index}`}
                    className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    role="option"
                    aria-selected={index === selectedIndex}
                  >
                    <span className="suggestion-icon">
                      {topics.find(t => t.id === suggestion.topic)?.icon}
                    </span>
                    <div className="suggestion-content">
                      <h4>{suggestion.title}</h4>
                      <p>{suggestion.description}</p>
                      <div className="suggestion-tags">
                        <span className="tag">{suggestion.topic}</span>
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
                {filteredTopics.length} result{filteredTopics.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          <div className="service-layout">
            <div className="service-sidebar">
              <h2 className="sidebar-title">Service Topics</h2>
              <div className="topic-buttons">
                <button
                  onClick={() => setSelectedTopic('all')}
                  className={`topic-button ${selectedTopic === 'all' ? 'active' : ''}`}
                >
                  <span className="topic-icon">📋</span>
                  <span className="topic-name">All Topics</span>
                </button>
                {topics.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`topic-button ${selectedTopic === topic.id ? 'active' : ''}`}
                  >
                    <span className="topic-icon">{topic.icon}</span>
                    <span className="topic-name">{topic.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="service-main">
              <div className="categories-grid">
                {filteredTopics.length === 0 ? (
                  <div className="no-data-message">
                    <p>No service topics found for the selected category.</p>
                  </div>
                ) : (
                  filteredTopics.map(topic => (
                    <div 
                      key={topic.uniqueId} 
                      className="category-card"
                      onClick={() => handleServiceClick(topic)}
                    >
                      <div className="category-header">
                        <span className="category-icon">
                          {topics.find(t => t.id === topic.topic)?.icon || '📋'}
                        </span>
                        <h3>{topic.title}</h3>
                      </div>
                      <p className="category-description">{topic.description}</p>
                      
                      <div className="category-details">
                        <div className="key-steps">
                          <h4>Key Steps</h4>
                          <ul>
                            {topic.steps.slice(0, 3).map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="quick-tips">
                          <h4>Quick Tips</h4>
                          <ul>
                            {topic.tips.slice(0, 2).map((tip, index) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="tags">
                          {topic.keywords.map((keyword, index) => (
                            <span key={index} className="tag">{keyword}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      {showModal && (selectedService || urgentRebuttal) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{(urgentRebuttal || selectedService).title}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <h3>Description</h3>
                <p>{(urgentRebuttal || selectedService).description}</p>
              </div>
              <div className="modal-section">
                <h3>Steps</h3>
                <ol>
                  {(urgentRebuttal || selectedService).steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
              <div className="modal-section">
                <h3>Tips</h3>
                <ul>
                  {(urgentRebuttal || selectedService).tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className="modal-section">
                <h3>Related Keywords</h3>
                <div className="keyword-tags">
                  {(urgentRebuttal || selectedService).keywords.map((keyword, index) => (
                    <span key={index} className="keyword-tag">{keyword}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderAppointmentManagement()}
    </div>
  );
};

export default CustomerService;