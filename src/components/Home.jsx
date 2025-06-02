import React, { useState, useEffect, useCallback } from 'react';
import { quickActions } from '../data/quickActions';
import BackToTop from './BackToTop';
import '../styles/Home.css';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import categoryService from '../services/categoryService';
import rebuttalsService from '../services/rebuttalsService';

const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDisposition, setSelectedDisposition] = useState(null);
  const [showCommonObjectionsModal, setShowCommonObjectionsModal] = useState(false);
  const [showSmartTipsModal, setShowSmartTipsModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [urgentRebuttal, setUrgentRebuttal] = useState(null);
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [selectedSimpleModeItem, setSelectedSimpleModeItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [relatedRebuttals, setRelatedRebuttals] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simpleModeCategories, setSimpleModeCategories] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [rebuttals, setRebuttals] = useState([]);

  const navigationCards = [
    {
      id: 'rebuttals',
      title: 'Call Center Rebuttals',
      description: 'Access our comprehensive library of proven rebuttals for common customer objections and scenarios',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      features: [
        'Smart search functionality',
        'Category-based organization',
        'Quick access to common scenarios'
      ]
    },
    {
      id: 'disposition',
      title: 'Lead Disposition',
      description: 'Efficiently manage and categorize leads with our intelligent disposition system',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      features: [
        'Automated categorization',
        'Real-time status updates',
        'Detailed lead tracking'
      ]
    },
    {
      id: 'appointment',
      title: 'Customer Service',
      description: 'Manage customer service interactions and support',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      features: [
        'Calendar integration',
        'Automated reminders',
        'Conflict resolution'
      ],
      onClick: () => navigate('/customerService')
    }
  ];

  // Lead dispositions data for intelligent matching
  const leadDispositions = [
    { name: 'Busy', keywords: ['busy', 'time', 'rushed', 'quick'], category: 'time-concern' },
    { name: 'Call Back', keywords: ['call back', 'callback', 'later', 'another time'], category: 'callback' },
    { name: 'No Interest', keywords: ['not interested', 'no interest', 'dont want', 'not buying'], category: 'not-interested' },
    { name: 'Speak to Spouse', keywords: ['spouse', 'husband', 'wife', 'talk to', 'discuss'], category: 'spouse-consultation' },
    { name: 'Price Over Phone', keywords: ['price', 'cost', 'how much', 'ballpark', 'estimate'], category: 'price-phone' },
    { name: 'One Leg', keywords: ['one leg', 'decision maker', 'alone', 'by myself'], category: 'one-legger' },
    { name: 'Repair Only', keywords: ['repair', 'fix', 'liner', 'just repair'], category: 'repair' },
    { name: 'Gov/Free', keywords: ['government', 'free', 'grant', 'assistance'], category: 'government-grants' }
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

  // Add common misspellings mapping
  const commonMisspellings = {
    'hoem': 'home',
    'paeg': 'page',
    'alhte': 'all the',
    'serach': 'search',
    'ebveythgin': 'everything',
    'arch': 'search',
    'shoudl': 'should',
    'eveythung': 'everything',
    'do': 'to',
    'more': 'more',
    'rebuttals': 'rebuttals',
    'disposition': 'disposition',
    'customer': 'customer',
    'service': 'service',
    'price': 'price',
    'cost': 'cost',
    'schedule': 'schedule',
    'appointment': 'appointment',
    'cancel': 'cancel',
    'reschedule': 'reschedule',
    'urgent': 'urgent',
    'help': 'help',
    'support': 'support',
    'question': 'question',
    'answer': 'answer',
    'problem': 'problem',
    'issue': 'issue',
    'concern': 'concern',
    'complaint': 'complaint',
    'feedback': 'feedback',
    'review': 'review',
    'rating': 'rating',
    'quality': 'quality',
    'product': 'product',
    'installation': 'installation',
    'warranty': 'warranty',
    'guarantee': 'guarantee',
    'payment': 'payment',
    'financing': 'financing',
    'discount': 'discount',
    'offer': 'offer',
    'deal': 'deal',
    'promotion': 'promotion',
    'special': 'special',
    'limited': 'limited',
    'time': 'time',
    'date': 'date',
    'availability': 'availability',
    'location': 'location',
    'address': 'address',
    'contact': 'contact',
    'phone': 'phone',
    'email': 'email',
    'message': 'message',
    'chat': 'chat',
    'call': 'call',
    'text': 'text',
    'sms': 'sms',
    'voicemail': 'voicemail',
    'callback': 'callback',
    'followup': 'follow up',
    'follow-up': 'follow up',
    'reminder': 'reminder',
    'notification': 'notification',
    'alert': 'alert',
    'warning': 'warning',
    'error': 'error',
    'fix': 'fix',
    'repair': 'repair',
    'maintenance': 'maintenance',
    'upgrade': 'upgrade',
    'update': 'update',
    'change': 'change',
    'modify': 'modify',
    'postpone': 'postpone',
    'delay': 'delay',
    'late': 'late',
    'early': 'early',
    'on-time': 'on time',
    'ontime': 'on time'
  };

  // Add search patterns
  const searchPatterns = {
    'how to': ['how do i', 'how can i', 'how do you', 'how can you', 'how to', 'how do', 'how can'],
    'when can': ['when can i', 'when can you', 'when do i', 'when do you', 'when to', 'when will'],
    'what is': ['what is', 'what are', 'what does', 'what do', 'what will', 'what should'],
    'where to': ['where to', 'where can i', 'where do i', 'where is', 'where are'],
    'why is': ['why is', 'why are', 'why does', 'why do', 'why will', 'why should'],
    'can i': ['can i', 'can you', 'could i', 'could you', 'may i', 'would you'],
    'i need': ['i need', 'i want', 'i would like', 'i am looking for', 'i am trying to'],
    'help with': ['help with', 'help me', 'assist with', 'assist me', 'support with', 'support me'],
    'looking for': ['looking for', 'searching for', 'trying to find', 'want to find', 'need to find'],
    'about': ['about', 'regarding', 'concerning', 'related to', 'pertaining to']
  };

  // Add function to correct spelling
  const correctSpelling = (text) => {
    const words = text.toLowerCase().split(' ');
    return words.map(word => commonMisspellings[word] || word).join(' ');
  };

  // Add function to normalize search query
  const normalizeSearchQuery = (query) => {
    let normalized = query.toLowerCase();
    
    // Replace common patterns
    Object.entries(searchPatterns).forEach(([standard, variations]) => {
      variations.forEach(variation => {
        if (normalized.includes(variation)) {
          normalized = normalized.replace(variation, standard);
        }
      });
    });
    
    // Correct spelling
    normalized = correctSpelling(normalized);
    
    return normalized;
  };

  // Add these new utility functions after the imports
  const levenshteinDistance = (str1, str2) => {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }

    return track[str2.length][str1.length];
  };

  const getSimilarityScore = (str1, str2) => {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    return (1 - levenshteinDistance(str1, str2) / maxLength);
  };

  const extractKeywords = (text) => {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'of', 'from']);
    return words.filter(word => !stopWords.has(word) && word.length > 2);
  };

  const getSemanticScore = (query, text) => {
    const queryKeywords = extractKeywords(query);
    const textKeywords = extractKeywords(text);
    
    let score = 0;
    queryKeywords.forEach(qWord => {
      textKeywords.forEach(tWord => {
        const similarity = getSimilarityScore(qWord, tWord);
        if (similarity > 0.8) {
          score += similarity;
        }
      });
    });
    
    return score / Math.max(queryKeywords.length, 1);
  };

  // Update the performIntelligentSearch function
  const performIntelligentSearch = (query) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const normalizedQuery = normalizeSearchQuery(query);
    const suggestions = [];
    const seenTitles = new Set();

    // Check for question patterns
    const isQuestion = normalizedQuery.includes('what') || 
                      normalizedQuery.includes('how') || 
                      normalizedQuery.includes('why') ||
                      normalizedQuery.includes('when') ||
                      normalizedQuery.includes('where');

    // Special handling for callback-related searches
    const isCallbackSearch = normalizedQuery.includes('callback') || 
                            normalizedQuery.includes('call back') ||
                            normalizedQuery.includes('call me back') ||
                            normalizedQuery.includes('call later');

    // Search rebuttals with enhanced matching
    rebuttals.forEach(rebuttal => {
      if (seenTitles.has(rebuttal.title)) return;
      
      const titleMatch = rebuttal.title.toLowerCase().includes(normalizedQuery);
      const categoryMatch = rebuttal.category.toLowerCase().includes(normalizedQuery);
      
      // Enhanced content matching
      let contentMatch = false;
      let semanticScore = 0;
      
      if (typeof rebuttal.content === 'string') {
        contentMatch = rebuttal.content.toLowerCase().includes(normalizedQuery);
        semanticScore = getSemanticScore(normalizedQuery, rebuttal.content);
      } else if (rebuttal.content && typeof rebuttal.content === 'object') {
        contentMatch = 
          (rebuttal.content.pt1 && rebuttal.content.pt1.toLowerCase().includes(normalizedQuery)) ||
          (rebuttal.content.pt2 && rebuttal.content.pt2.toLowerCase().includes(normalizedQuery));
        
        semanticScore = Math.max(
          getSemanticScore(normalizedQuery, rebuttal.content.pt1 || ''),
          getSemanticScore(normalizedQuery, rebuttal.content.pt2 || '')
        );
      }
      
      const tagMatch = rebuttal.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery));
      const tagSemanticScore = rebuttal.tags?.reduce((max, tag) => 
        Math.max(max, getSemanticScore(normalizedQuery, tag)), 0) || 0;

      // Calculate overall relevance score
      const relevanceScore = 
        (titleMatch ? 1 : 0) * 0.4 +
        (categoryMatch ? 1 : 0) * 0.2 +
        (contentMatch ? 1 : 0) * 0.2 +
        (tagMatch ? 1 : 0) * 0.1 +
        semanticScore * 0.1 +
        tagSemanticScore * 0.1;

      // For callbacks, prioritize callback-related rebuttals
      if (isCallbackSearch && (rebuttal.category === 'callback' || rebuttal.title.toLowerCase().includes('callback'))) {
        suggestions.push({
          type: 'rebuttal',
          title: rebuttal.title,
          category: rebuttal.category,
          icon: '📞',
          relevance: 'high',
          score: relevanceScore + 0.5, // Boost callback-related items
          data: rebuttal
        });
        seenTitles.add(rebuttal.title);
      }
      // For questions, prioritize content matches
      else if (isQuestion && (contentMatch || semanticScore > 0.3)) {
        suggestions.push({
          type: 'modal',
          title: rebuttal.title,
          category: rebuttal.category,
          icon: getCategoryIcon(rebuttal.category),
          relevance: 'high',
          score: relevanceScore + 0.3, // Boost question-related items
          data: rebuttal
        });
        seenTitles.add(rebuttal.title);
      }
      // Regular matching with minimum relevance threshold
      else if (relevanceScore > 0.2) {
        suggestions.push({
          type: 'rebuttal',
          title: rebuttal.title,
          category: rebuttal.category,
          icon: getCategoryIcon(rebuttal.category),
          relevance: relevanceScore > 0.6 ? 'high' : relevanceScore > 0.4 ? 'medium' : 'low',
          score: relevanceScore,
          data: rebuttal
        });
        seenTitles.add(rebuttal.title);
      }
    });

    // Search dispositions with enhanced matching
    leadDispositions.forEach(disposition => {
      const nameMatch = disposition.name.toLowerCase().includes(normalizedQuery);
      const keywordMatch = disposition.keywords.some(keyword => 
        keyword.toLowerCase().includes(normalizedQuery)
      );
      
      const semanticScore = Math.max(
        getSemanticScore(normalizedQuery, disposition.name),
        ...disposition.keywords.map(keyword => getSemanticScore(normalizedQuery, keyword))
      );

      const relevanceScore = 
        (nameMatch ? 1 : 0) * 0.6 +
        (keywordMatch ? 1 : 0) * 0.3 +
        semanticScore * 0.1;

      if (relevanceScore > 0.2) {
        suggestions.push({
          type: 'disposition',
          title: disposition.name,
          category: disposition.category,
          icon: '📋',
          relevance: relevanceScore > 0.6 ? 'high' : relevanceScore > 0.4 ? 'medium' : 'low',
          score: relevanceScore,
          data: disposition
        });
      }
    });

    // Sort suggestions by relevance score
    suggestions.sort((a, b) => b.score - a.score);

    // Limit suggestions to top 10
    setSearchSuggestions(suggestions.slice(0, 10));
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
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
    return iconMap[category] || '📞';
  };

  // Debounce search function
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
    debouncedSearch(value);
    setShowSuggestions(value.length > 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchSuggestions[selectedIndex]) {
          handleSuggestionClick(searchSuggestions[selectedIndex]);
        } else {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setShowQuickActions(false);
        break;
      default:
        break;
    }
  };

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  useEffect(() => {
    performIntelligentSearch(searchTerm);
    setShowSuggestions(searchTerm.length > 0);
  }, [searchTerm]);

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      const normalizedQuery = normalizeSearchQuery(searchTerm);
      setSearchTerm(normalizedQuery);
      
      if (searchSuggestions.length > 0) {
        const topSuggestion = searchSuggestions[0];
        if (topSuggestion.type === 'rebuttal') {
          setSelectedSimpleModeItem(topSuggestion.data);
          setShowModal(true);
        } else if (topSuggestion.type === 'disposition') {
          navigate('disposition');
        }
      } else {
        // If no suggestions, try to find the best match
        const bestMatch = findBestMatch(normalizedQuery);
        if (bestMatch) {
          if (bestMatch.type === 'rebuttal') {
            setSelectedSimpleModeItem(bestMatch.data);
            setShowModal(true);
          } else if (bestMatch.type === 'disposition') {
            navigate('disposition');
          }
        }
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'rebuttal') {
      setSelectedSimpleModeItem(suggestion.data);
      setShowModal(true);
    } else if (suggestion.type === 'disposition') {
      setSelectedDisposition(suggestion.data);
      navigate('disposition');
    } else if (suggestion.type === 'modal') {
      setSelectedSimpleModeItem(suggestion.data);
      setShowModal(true);
    }
    setShowSuggestions(false);
  };
  const handleDispositionClick = (dispositionName) => {
    // Find relevant rebuttals for this disposition
    const relevantRebuttals = rebuttals.filter(rebuttal => {
      const disposition = leadDispositions.find(d => d.name === dispositionName);
      return disposition && rebuttal.category === disposition.category;
    });
    
    if (relevantRebuttals.length > 0) {
      navigate('rebuttals');
    } else {
      navigate('disposition');
    }
  };

  const handleQuickSearch = (term) => {
    setSearchTerm(term);
    
    // Find the matching disposition
    const matchingDisposition = leadDispositions.find(d => 
      d.name.toLowerCase() === term.toLowerCase() || 
      d.keywords.some(keyword => keyword.toLowerCase() === term.toLowerCase())
    );

    if (matchingDisposition) {
      // Find the corresponding category in simpleModeCategories
      const category = simpleModeCategories.find(cat => 
        cat.items.some(item => item.category === matchingDisposition.category)
      );

      if (category) {
        // Switch to simple mode
        setIsSimpleMode(true);
        
        // Find the specific item in the category
        const categoryItem = category.items.find(item => 
          item.category === matchingDisposition.category
        );

        if (categoryItem) {
          // Show the modal with the specific item
          setSelectedSimpleModeItem(categoryItem);
          setShowModal(true);
        }

        // Scroll to the category
        setTimeout(() => {
          const categoryElement = document.querySelector(`[data-category="${category.id}"]`);
          if (categoryElement) {
            categoryElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // If no matching category found, navigate to rebuttals
        navigate('rebuttals');
      }
    } else {
      // For other terms, navigate to rebuttals page
      navigate('rebuttals');
    }
  };
  const handleCommonObjections = () => {
    setShowCommonObjectionsModal(true);
  };

  const handleSmartTips = () => {
    setShowSmartTipsModal(true);
  };

  const handleMoreOptions = (rebuttal) => {
    // Find all rebuttals in the same category
    const allCategoryRebuttals = rebuttals.filter(r => 
      r.category === rebuttal.category && r.id !== rebuttal.id
    );
    
    // Find related rebuttals based on tags
    const relatedByTags = rebuttals.filter(r => 
      r.tags && rebuttal.tags && 
      r.tags.some(tag => rebuttal.tags.includes(tag)) && 
      r.id !== rebuttal.id &&
      r.category !== rebuttal.category
    ).slice(0, 3);

    // Combine and remove duplicates
    const related = [...allCategoryRebuttals, ...relatedByTags]
      .filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id)
      );
    
    setRelatedRebuttals(related);
    setShowMoreOptions(true);
  };

  const closeModal = () => {
    setShowCommonObjectionsModal(false);
    setShowSmartTipsModal(false);
    setShowModal(false);
    setSelectedSimpleModeItem(null);
    setShowMoreOptions(false);
    setRelatedRebuttals([]);
  };

  const quickSearchTerms = [
    { term: 'not interested', category: 'not-interested' },
    { term: 'price', category: 'price-phone' },
    { term: 'spouse', category: 'spouse-consultation' },
    { term: 'busy', category: 'time-concern' },
    { term: 'callback', category: 'callback' }
  ];

  const handleQuickAction = (action) => {
    setShowQuickActions(false);
    setSearchTerm('');
    setSelectedSimpleModeItem({
      title: action.title,
      description: action.description,
      type: 'rebuttal',
      category: action.category,
      content: action.content,
      steps: action.steps,
      tips: action.tips,
      keywords: action.keywords
    });
    setShowModal(true);
  };

  const handleSimpleModeItemClick = (item) => {
    // Find matching rebuttal in rebuttals
    const matchingRebuttal = rebuttals.find(rebuttal => 
      rebuttal.category === item.category && 
      rebuttal.title.toLowerCase() === item.title.toLowerCase()
    );

    // Default steps and tips based on category
    const defaultContent = {
      'spouse-consultation': {
        steps: [
          'Acknowledge the need for joint decision',
          'Offer to schedule a time when both can be present',
          'Provide information they can review together',
          'Follow up with both parties'
        ],
        tips: [
          'Be respectful of their decision-making process',
          'Offer to send materials they can review together',
          'Suggest a specific time for a joint call'
        ]
      },
      'one-legger': {
        steps: [
          'Confirm they are the decision maker',
          'Gather all necessary information',
          'Present clear options and benefits',
          'Ask for their decision'
        ],
        tips: [
          'Be direct and clear in your communication',
          'Focus on key benefits and value',
          'Ask open-ended questions to understand needs'
        ]
      },
      'time-concern': {
        steps: [
          'Acknowledge their time constraints',
          'Offer flexible scheduling options',
          'Highlight the value of the service',
          'Propose a quick solution'
        ],
        tips: [
          'Be concise and to the point',
          'Offer multiple time slots',
          'Emphasize efficiency of the process'
        ]
      },
      'callback': {
        steps: [
          'Confirm the best time for callback',
          'Get alternative contact methods',
          'Set specific callback time',
          'Confirm callback details',
          'Document the callback request',
          'Set a reminder for the callback',
          'Prepare callback materials',
          'Make the callback at scheduled time'
        ],
        tips: [
          'Always call at the agreed time',
          'Have all necessary information ready',
          'Be prepared to reschedule if needed',
          'Keep the conversation focused',
          'Follow up if no answer',
          'Document the callback outcome'
        ]
      },
      'price-phone': {
        steps: [
          'Acknowledge price concern',
          'Explain value proposition',
          'Present pricing options',
          'Offer to schedule consultation'
        ],
        tips: [
          'Focus on value, not just price',
          'Be prepared with pricing information',
          'Offer flexible payment options'
        ]
      },
      'not-interested': {
        steps: [
          'Listen to their concerns',
          'Address specific objections',
          'Present alternative solutions',
          'Ask for feedback'
        ],
        tips: [
          'Stay positive and professional',
          'Understand their perspective',
          'Leave door open for future contact'
        ]
      }
    };

    if (matchingRebuttal) {
      setSelectedSimpleModeItem({
        ...matchingRebuttal,
        content: matchingRebuttal.content || {
          pt1: 'Part 1 content will be displayed here.',
          pt2: 'Part 2 content will be displayed here.'
        },
        steps: matchingRebuttal.steps || defaultContent[matchingRebuttal.category]?.steps || [
          'Listen to customer concerns',
          'Address specific needs',
          'Present solution',
          'Follow up as needed'
        ],
        tips: matchingRebuttal.tips || defaultContent[matchingRebuttal.category]?.tips || [
          'Be professional and courteous',
          'Focus on customer needs',
          'Provide clear information'
        ]
      });
    } else {
      // Fallback to item data if no matching rebuttal found
      setSelectedSimpleModeItem({
        ...item,
        content: item.content || {
          pt1: 'Part 1 content will be displayed here.',
          pt2: 'Part 2 content will be displayed here.'
        },
        steps: item.steps || defaultContent[item.category]?.steps || [
          'Listen to customer concerns',
          'Address specific needs',
          'Present solution',
          'Follow up as needed'
        ],
        tips: item.tips || defaultContent[item.category]?.tips || [
          'Be professional and courteous',
          'Focus on customer needs',
          'Provide clear information'
        ]
      });
    }
    setShowModal(true);
  };

  const renderModal = () => {
    if (showCommonObjectionsModal) {
      return (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>Common Objections & Responses</h2>
              </div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="objection-list">
                {rebuttals
                  .filter(rebuttal => rebuttal.category === 'not-interested' || 
                                    rebuttal.category === 'price-phone' ||
                                    rebuttal.category === 'spouse-consultation')
                  .map((rebuttal, index) => (
                    <div key={index} className="objection-item">
                      <h3>{rebuttal.title}</h3>
                      <p>{typeof rebuttal.content === 'string' 
                        ? rebuttal.content 
                        : rebuttal.content.pt1 || rebuttal.response || 'No response available.'}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showSmartTipsModal) {
      return (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>Smart Tips for Success</h2>
              </div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="tips-list">
                <div className="tip-item">
                  <h3>🎯 Active Listening</h3>
                  <p>Always acknowledge the customer's concerns before presenting your rebuttal</p>
                </div>
                <div className="tip-item">
                  <h3>💡 Question-Based Approach</h3>
                  <p>Use open-ended questions to understand the customer's needs better</p>
                </div>
                <div className="tip-item">
                  <h3>⚡ Quick Response Strategy</h3>
                  <p>Start with Part 1 of the rebuttal, then escalate to Part 2 if needed</p>
                </div>
                <div className="tip-item">
                  <h3>🤝 Building Rapport</h3>
                  <p>Establish trust by showing empathy and understanding</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showModal && selectedSimpleModeItem) {
      return (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>{selectedSimpleModeItem.title}</h2>
              </div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {!showMoreOptions ? (
                <div className="objection-item">
                  <div className="objection-header">
                    <h3>{selectedSimpleModeItem.title}</h3>
                    <p className="objection-description">{selectedSimpleModeItem.description}</p>
                  </div>

                  <div className="rebuttal-content">
                    {selectedSimpleModeItem.content && (
                      <>
                        <div className="rebuttal-part">
                          <h4>Part 1: Initial Response</h4>
                          <p>{typeof selectedSimpleModeItem.content === 'string' 
                            ? selectedSimpleModeItem.content 
                            : selectedSimpleModeItem.content.pt1 || selectedSimpleModeItem.response || 'No initial response available.'}</p>
                        </div>
                        <div className="rebuttal-part">
                          <h4>Part 2: Follow-up</h4>
                          <p>{typeof selectedSimpleModeItem.content === 'string'
                            ? selectedSimpleModeItem.content
                            : selectedSimpleModeItem.content.pt2 || selectedSimpleModeItem.followUpResponse || 'No follow-up response available.'}</p>
                        </div>
                      </>
                    )}

                    {selectedSimpleModeItem.steps && selectedSimpleModeItem.steps.length > 0 && (
                      <div className="rebuttal-steps">
                        <h4>Steps to Handle:</h4>
                        <ul>
                          {selectedSimpleModeItem.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedSimpleModeItem.tips && selectedSimpleModeItem.tips.length > 0 && (
                      <div className="rebuttal-tips">
                        <h4>Tips:</h4>
                        <ul>
                          {selectedSimpleModeItem.tips.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="modal-footer">
                      <button 
                        className="more-options-button"
                        onClick={() => handleMoreOptions(selectedSimpleModeItem)}
                      >
                        More Options
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="more-options-view">
                  <div className="more-options-header">
                    <h3>More Options</h3>
                    <p>Related rebuttals and options for {selectedSimpleModeItem.category}</p>
                  </div>

                  <div className="category-navigation">
                    <button 
                      className="view-all-category-button"
                      onClick={() => {
                        const category = simpleModeCategories.find(cat => 
                          cat.items.some(item => item.category === selectedSimpleModeItem.category)
                        );
                        if (category) {
                          setIsSimpleMode(true);
                          setShowModal(false);
                          // Scroll to the category
                          const categoryElement = document.querySelector(`[data-category="${category.id}"]`);
                          if (categoryElement) {
                            categoryElement.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                    >
                      View All {selectedSimpleModeItem.category} Options
                    </button>
                  </div>

                  <div className="related-rebuttals">
                    <h4>Related Rebuttals:</h4>
                    <div className="related-rebuttals-list">
                      {relatedRebuttals.map((relatedRebuttal, index) => (
                        <div 
                          key={index} 
                          className="related-rebuttal-item"
                          onClick={() => {
                            setSelectedSimpleModeItem(relatedRebuttal);
                            setShowMoreOptions(false);
                          }}
                        >
                          <h5>{relatedRebuttal.title}</h5>
                          <p>{typeof relatedRebuttal.content === 'string' 
                            ? relatedRebuttal.content 
                            : relatedRebuttal.content.pt1 || relatedRebuttal.response || 'No response available.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button 
                      className="back-button"
                      onClick={() => setShowMoreOptions(false)}
                    >
                      Back to Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Add function to find best match
  const findBestMatch = (query) => {
    // Search in rebuttals
    const rebuttalMatch = rebuttals.find(rebuttal => 
      rebuttal.title.toLowerCase().includes(query) ||
      rebuttal.category.toLowerCase().includes(query) ||
      rebuttal.tags.some(tag => tag.toLowerCase().includes(query))
    );

    if (rebuttalMatch) {
      return {
        type: 'rebuttal',
        data: rebuttalMatch
      };
    }

    // Search in dispositions
    const dispositionMatch = leadDispositions.find(disposition =>
      disposition.name.toLowerCase().includes(query) ||
      disposition.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );

    if (dispositionMatch) {
      return {
        type: 'disposition',
        data: dispositionMatch
      };
    }

    return null;
  };

  // Add useEffect to load categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Starting to load data...');

        // Load categories
        const fetchedCategories = await categoryService.getAllCategories();
        console.log('Fetched categories:', fetchedCategories);
        
        // Set up real-time listener for rebuttals
        const rebuttalsQuery = query(
          collection(db, 'rebuttals'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(rebuttalsQuery, (snapshot) => {
          const rebuttals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Create a mapping of category IDs to names
          const categoryIdToName = fetchedCategories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
          }, {});

          // Transform categories for simple mode
          const transformedCategories = fetchedCategories.map(category => {
            // Get rebuttals for this category
            const categoryRebuttals = rebuttals.filter(rebuttal => {
              // Check if rebuttal's category matches the category ID
              return rebuttal.category === category.id;
            });

            console.log(`Category ${category.name} has ${categoryRebuttals.length} rebuttals`);
            
            return {
              id: category.id,
              title: category.name,
              icon: category.icon || '📋',
              color: category.color || '#808080',
              items: categoryRebuttals.map(rebuttal => ({
                id: rebuttal.id,
                title: rebuttal.title,
                description: rebuttal.description || rebuttal.objection || rebuttal.summary || '',
                category: category.id,
                content: rebuttal.content || rebuttal.response,
                steps: rebuttal.steps || [
                  'Listen to customer concerns',
                  'Address specific needs',
                  'Present solution',
                  'Follow up as needed'
                ],
                tips: rebuttal.tips || [
                  'Be professional and courteous',
                  'Focus on customer needs',
                  'Provide clear information'
                ]
              }))
            };
          });
          
          console.log('Transformed categories:', transformedCategories);
          setCategories(transformedCategories);
          setSimpleModeCategories(transformedCategories);
        });

        setLoading(false);

        // Cleanup subscription on unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update the simple mode rendering to handle potential undefined values
  const renderSimpleMode = () => (
    <div className="simple-mode-container">
      <div className="quick-navigation">
        <div className="quick-nav-header">
          <h2>Categories</h2>
        </div>
        {loading ? (
          <div className="loading-spinner" />
        ) : categories.length === 0 ? (
          <div className="no-categories">
            <p>No categories available. Please add some categories in the admin panel.</p>
          </div>
        ) : (
          <div className="quick-nav-grid">
            {simpleModeCategories.map(category => (
              <button
                key={category.id}
                className="quick-nav-card"
                onClick={() => {
                  const element = document.querySelector(`[data-category="${category.id}"]`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                style={{ 
                  '--category-color': category.color || '#808080',
                  '--category-gradient': `linear-gradient(135deg, ${category.color || '#808080'}, ${adjustColor(category.color || '#808080', -20)})`
                }}
              >
                <div className="quick-nav-card-content">
                  <div className="quick-nav-icon">{category.icon || '📋'}</div>
                  <div className="quick-nav-info">
                    <h3>{category.title || 'Untitled Category'}</h3>
                    <p className="quick-nav-description">
                      {category.items?.length || 0} rebuttals available
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="simple-mode-grid">
        {simpleModeCategories.map(category => (
          <div 
            key={category.id} 
            className="simple-mode-category"
            data-category={category.id}
          >
            <div className="category-header">
              <div className="category-icon">{category.icon || '📋'}</div>
              <h2 className="category-title">{category.title || 'Untitled Category'}</h2>
            </div>
            <div className="category-items">
              {category.items && category.items.length > 0 ? (
                category.items.map((item, index) => (
                  <button
                    key={index}
                    className="category-item"
                    onClick={() => handleSimpleModeItemClick(item)}
                  >
                    <h3 className="item-title">{item.title}</h3>
                    <p className="item-description">{item.description}</p>
                  </button>
                ))
              ) : (
                <p className="no-items">No rebuttals available in this category.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowQuickActions(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add this helper function at the top of the file, after the imports
  const adjustColor = (color, amount) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('adminUser'));
    setAdminUser(user);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    setAdminUser(null);
    navigate('/');
  };

  const handleAdminLogin = () => {
    navigate('/admin/login');
  };

  const handleAdminDashboard = () => {
    navigate('/admin/dashboard');
  };

  // Update the navigation card click handler in the render section
  const handleCardClick = (card) => {
    if (card.onClick) {
      card.onClick();
    } else {
      navigate(`/${card.id}`);
    }
  };

  useEffect(() => {
    const loadRebuttals = async () => {
      try {
        const fetchedRebuttals = await rebuttalsService.getAllRebuttals();
        setRebuttals(fetchedRebuttals);
      } catch (error) {
        console.error('Error loading rebuttals:', error);
      }
    };

    loadRebuttals();
  }, []);

  return (
    <div className="home-container">
      {adminUser ? (
        <div className="admin-controls">
          <button onClick={handleAdminDashboard} className="admin-dashboard-btn">
            Admin Dashboard
          </button>
          <button onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      ) : (
        <button onClick={handleAdminLogin} className="admin-login-btn">
          Admin Login
        </button>
      )}
      {renderModal()}
      <div className="home-content">
        {/* Hero Section */}
        <div className="home-hero">
          <div className="hero-content">
            <div className="hero-logo">
              <span className="logo-icon">🏠</span>
              <h1 className="hero-title">
                Long Home <span className="title-accent">Rebuttal Hub</span>
              </h1>
            </div>
            <p className="hero-subtitle">
              Your intelligent assistant for mastering appointment setting, objection handling, and customer service excellence
            </p>
            {/* Add Simple Mode Toggle */}
            <div className="mode-toggle">
              <button
                className={`mode-toggle-button ${isSimpleMode ? 'active' : ''}`}
                onClick={() => setIsSimpleMode(!isSimpleMode)}
              >
                {isSimpleMode ? 'Switch to Full Mode' : 'Switch to Simple Mode'}
              </button>
            </div>
          </div>

          {/* Only show search section when not in simple mode */}
          {!isSimpleMode && (
            <div className="search-section">
              <div className="search-container">
                <div className="search-input-wrapper">
                  <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search rebuttals, dispositions, or ask a question..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      setShowQuickActions(true);
                      if (searchTerm) setShowSuggestions(true);
                    }}
                    className="search-input"
                    aria-label="Search"
                    aria-expanded={showSuggestions}
                    aria-controls="search-suggestions"
                    role="combobox"
                    aria-autocomplete="list"
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

                {/* Combined Dropdown */}
                {(showQuickActions || showSuggestions) && (
                  <div className="search-dropdown">
                    {/* Quick Actions Section */}
                    {showQuickActions && (
                      <div className="quick-actions-section">
                        <div className="quick-actions-header">
                          <h3>Quick Actions</h3>
                        </div>
                        <div className="quick-actions-grid">
                          {quickActions.map(action => (
                            <div
                              key={action.id}
                              className="quick-action-item"
                              onClick={() => handleQuickAction(action)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  handleQuickAction(action);
                                }
                              }}
                            >
                              <span className="quick-action-icon">{action.icon}</span>
                              <div className="quick-action-content">
                                <h4>{action.title}</h4>
                                <p>{action.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Suggestions Section */}
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div 
                        className="search-suggestions-section"
                        id="search-suggestions"
                        role="listbox"
                      >
                        <div className="suggestions-header">
                          <span>Smart Suggestions</span>
                          <span className="suggestions-count">{searchSuggestions.length} results</span>
                        </div>
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                            role="option"
                            aria-selected={index === selectedIndex}
                          >
                            <span className="suggestion-icon">{suggestion.icon}</span>
                            <div className="suggestion-content">
                              <div className="suggestion-title">{suggestion.title}</div>
                              <div className="suggestion-meta">
                                {suggestion.category}
                                {suggestion.relevance === 'high' && (
                                  <span className="high-relevance">High Match</span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Search Buttons */}
                <div className="quick-searches">
                  <span className="quick-search-label">Quick searches:</span>
                  {quickSearchTerms.map((quickSearch, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(quickSearch.term)}
                      className="quick-search-btn"
                      aria-label={`Quick search: ${quickSearch.term}`}
                    >
                      {quickSearch.term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Simple Mode Content */}
        {isSimpleMode ? renderSimpleMode() : (
          // Original content
          <>
            {/* Navigation Section */}
            <div className="navigation-section">
              <div className="section-header">
                <div className="section-logo">
                  <span className="logo-icon">🏠</span>
                  <h2 className="section-title">Training Modules</h2>
                </div>
              </div>
              <div className="navigation-cards">
                {navigationCards.map((card, index) => (
                  <button
                    key={index}
                    onClick={() => handleCardClick(card)}
                    className="nav-card"
                  >
                    <div className="card-header">
                      <div className="card-icon">{card.icon}</div>
                      <div className="card-badge">{card.title}</div>
                    </div>
                    <div className="card-content">
                      <h3 className="card-title">{card.title}</h3>
                      <p className="card-description">
                        {card.description}
                      </p>
                      <div className="card-features">
                        {card.features.map((feature, index) => (
                          <span key={index}>{feature}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Access Section */}
            <div className="quick-access-section">
              <h2 className="section-title">Quick Access</h2>
              <div className="quick-access-cards">
                <div className="access-card urgent">
                  <div className="access-icon">🚨</div>
                  <h3>Common Objections</h3>
                  <p>Instant access to the most frequent customer objections and responses</p>
                  <button 
                    onClick={handleCommonObjections}
                    className="access-btn"
                  >
                    View Now
                  </button>
                </div>

                <div className="access-card helpful">
                  <div className="access-icon">💡</div>
                  <h3>Smart Tips</h3>
                  <p>AI-powered suggestions based on your search patterns and common needs</p>
                  <button 
                    onClick={handleSmartTips}
                    className="access-btn"
                  >
                    Get Tips
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <BackToTop isSimpleMode={isSimpleMode} />
    </div>
  );
};

export default Home;