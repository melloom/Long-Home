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
  const [selectedSimpleModeItem, setSelectedSimpleModeItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [relatedRebuttals, setRelatedRebuttals] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simpleModeCategories, setSimpleModeCategories] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [rebuttals, setRebuttals] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Add defaultContent object
  const defaultContent = {
    'not-interested': {
      steps: [
        'Listen to customer concerns',
        'Address specific needs',
        'Present solution',
        'Follow up as needed'
      ],
      tips: [
        'Be professional and courteous',
        'Focus on customer needs',
        'Provide clear information'
      ]
    },
    'price-phone': {
      steps: [
        'Acknowledge price concern',
        'Explain value proposition',
        'Offer flexible options',
        'Follow up with details'
      ],
      tips: [
        'Emphasize quality and value',
        'Be prepared with pricing options',
        'Highlight unique benefits'
      ]
    },
    'spouse-consultation': {
      steps: [
        'Acknowledge need for joint decision',
        'Offer to schedule joint meeting',
        'Prepare comprehensive information',
        'Follow up with both parties'
      ],
      tips: [
        'Respect decision-making process',
        'Offer flexible scheduling',
        'Provide detailed information'
      ]
    },
    'time-concern': {
      steps: [
        'Acknowledge time constraints',
        'Offer flexible scheduling',
        'Provide quick overview',
        'Schedule follow-up'
      ],
      tips: [
        'Be concise and clear',
        'Offer multiple time slots',
        'Respect their schedule'
      ]
    },
    'callback': {
      steps: [
        'Get preferred callback time',
        'Confirm contact information',
        'Note specific concerns',
        'Schedule callback'
      ],
      tips: [
        'Be punctual with callbacks',
        'Prepare relevant information',
        'Follow up as scheduled'
      ]
    }
  };

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

  // Enhanced search patterns for better matching
  const searchPatterns = {
    'how to': ['how do i', 'how can i', 'how do you', 'how to', 'how can', 'how should', 'how would'],
    'when can': ['when can i', 'when is', 'when will', 'when should', 'when do', 'when to', 'when are'],
    'where to': ['where can i', 'where do i', 'where is', 'where to', 'where are', 'where should'],
    'what is': ['whats', 'what is', 'what are', 'what do', 'what will', 'what should', 'what can'],
    'why do': ['why does', 'why is', 'why are', 'why do', 'why should', 'why would', 'why can'],
    'can i': ['can you', 'is it possible', 'is there a way', 'can i', 'could i', 'would you', 'may i'],
    'need to': ['want to', 'have to', 'should i', 'need to', 'looking to', 'trying to', 'planning to'],
    'looking for': ['searching for', 'trying to find', 'want to find', 'looking for', 'need to find', 'seeking']
  };

  // Enhanced common misspellings
  const commonMisspellings = {
    'hoem': 'home',
    'paeg': 'page',
    'serach': 'search',
    'ebveythgin': 'everything',
    'arch': 'search',
    'shoudl': 'should',
    'eveythung': 'everything',
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
    if (!text) return [];
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'of', 'from',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'shall', 'should', 'may', 'might', 'must', 'can', 'could', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
      'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs'
    ]);
    return words.filter(word => !stopWords.has(word) && word.length > 2);
  };

  const getSemanticScore = (query, text) => {
    if (!query || !text) return 0;
    
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

  // Enhanced search function with better matching
  const performIntelligentSearch = (query) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const normalizedQuery = normalizeSearchQuery(query);
    const suggestions = [];
    const seenTitles = new Set();

    // Check for question patterns with enhanced detection
    const isQuestion = /^(what|how|why|when|where|can|could|would|should|may|do|does|is|are|will)/i.test(normalizedQuery);

    // Enhanced callback detection
    const isCallbackSearch = /(call\s*back|callback|call\s*later|call\s*me\s*back|call\s*you\s*back)/i.test(normalizedQuery);

    // Search rebuttals with improved matching
    rebuttals.forEach(rebuttal => {
      if (seenTitles.has(rebuttal.title)) return;
      
      const titleMatch = rebuttal.title.toLowerCase().includes(normalizedQuery);
      const categoryMatch = rebuttal.category.toLowerCase().includes(normalizedQuery);
      
      // Enhanced content matching with semantic scoring
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
      
      // Enhanced tag matching
      const tagMatch = rebuttal.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery));
      const tagSemanticScore = rebuttal.tags?.reduce((max, tag) => 
        Math.max(max, getSemanticScore(normalizedQuery, tag)), 0) || 0;

      // Improved relevance scoring
      const relevanceScore = 
        (titleMatch ? 1 : 0) * 0.4 +
        (categoryMatch ? 1 : 0) * 0.2 +
        (contentMatch ? 1 : 0) * 0.2 +
        (tagMatch ? 1 : 0) * 0.1 +
        semanticScore * 0.1 +
        tagSemanticScore * 0.1;

      // Enhanced callback handling
      if (isCallbackSearch && (rebuttal.category === 'callback' || rebuttal.title.toLowerCase().includes('callback'))) {
        suggestions.push({
          type: 'rebuttal',
          title: rebuttal.title,
          category: rebuttal.category,
          icon: '📞',
          relevance: 'high',
          score: relevanceScore + 0.5,
          data: rebuttal
        });
        seenTitles.add(rebuttal.title);
      }
      // Enhanced question handling
      else if (isQuestion && (contentMatch || semanticScore > 0.3)) {
        suggestions.push({
          type: 'modal',
          title: rebuttal.title,
          category: rebuttal.category,
          icon: getCategoryIcon(rebuttal.category),
          relevance: 'high',
          score: relevanceScore + 0.3,
          data: rebuttal
        });
        seenTitles.add(rebuttal.title);
      }
      // Regular matching with improved threshold
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

    // Enhanced disposition search
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

    // Sort suggestions by relevance score and limit to top 10
    suggestions.sort((a, b) => b.score - a.score);
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
        setSelectedSimpleModeItem(category.items.find(item => 
          item.category === matchingDisposition.category
        ));
        setShowModal(true);

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

    if (matchingRebuttal) {
      // Ensure content is properly structured
      let content = {
        pt1: '',
        pt2: ''
      };

      // Handle different response formats
      if (typeof matchingRebuttal.response === 'string') {
        content.pt1 = matchingRebuttal.response;
      } else if (matchingRebuttal.response && typeof matchingRebuttal.response === 'object') {
        content = {
          pt1: matchingRebuttal.response.pt1 || matchingRebuttal.response.initial || matchingRebuttal.response.part1 || '',
          pt2: matchingRebuttal.response.pt2 || matchingRebuttal.response.followup || matchingRebuttal.response.part2 || ''
        };
      }

      // Fallback to objection if no response
      if (!content.pt1) {
        content.pt1 = matchingRebuttal.objection || '';
      }

      setSelectedSimpleModeItem({
        ...matchingRebuttal,
        content: content,
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
      let content = {
        pt1: '',
        pt2: ''
      };

      // Handle different response formats
      if (typeof item.response === 'string') {
        content.pt1 = item.response;
      } else if (item.response && typeof item.response === 'object') {
        content = {
          pt1: item.response.pt1 || item.response.initial || item.response.part1 || '',
          pt2: item.response.pt2 || item.response.followup || item.response.part2 || ''
        };
      }

      // Fallback to objection if no response
      if (!content.pt1) {
        content.pt1 = item.objection || '';
      }

      setSelectedSimpleModeItem({
        ...item,
        content: content,
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

  const handleNextItem = () => {
    if (selectedCategory && selectedCategory.items) {
      const nextIndex = (currentItemIndex + 1) % selectedCategory.items.length;
      setCurrentItemIndex(nextIndex);
      const nextItem = selectedCategory.items[nextIndex];
      handleItemClick(nextItem);
    }
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
              <div className="modal-header-buttons">
                <button 
                  className="modal-expand" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3V5C8 5.53043 7.78929 6.03914 7.41421 6.41421C7.03914 6.78929 6.53043 7 6 7H4M4 7H8M4 7V3M16 3V5C16 5.53043 16.2107 6.03914 16.5858 6.41421C16.9609 6.78929 17.4696 7 18 7H20M20 7H16M20 7V3M8 21V19C8 18.4696 7.78929 17.9609 7.41421 17.5858C7.03914 17.2107 6.53043 17 6 17H4M4 17H8M4 17V21M16 21V19C16 18.4696 16.2107 17.9609 16.5858 17.5858C16.9609 17.2107 17.4696 17 18 17H20M20 17H16M20 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 8V4M4 4H8M4 4L9 9M20 8V4M20 4H16M20 4L15 9M4 16V20M4 20H8M4 20L9 15M20 16V20M20 20H16M20 20L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
            </div>
            <div className={`modal-body ${isExpanded ? 'expanded' : ''}`}>
              <div className="objection-list">
                <div className="objection-item">
                  <h3>Need to Think About It</h3>
                  <p>"I need to think about it"</p>
                  <div className="response-section">
                    <h4>Initial Response:</h4>
                    <p>"That's completely understandable. Making home improvement decisions requires careful consideration. What specific aspects would you like to think about? I'd be happy to provide more information to help with your decision."</p>
                    <h4>Follow-up Response:</h4>
                    <p>"We're currently offering a special discount for customers who make a decision this week. Would you like to hear more about this limited-time offer?"</p>
                  </div>
                </div>

                <div className="objection-item">
                  <h3>Need to Consult Spouse</h3>
                  <p>"I need to talk to my spouse"</p>
                  <div className="response-section">
                    <h4>Initial Response:</h4>
                    <p>"That's a great point. It's important to make this decision together. Would it be helpful if I scheduled a time when both of you can be present to discuss the options?"</p>
                    <h4>Follow-up Response:</h4>
                    <p>"I can prepare a detailed proposal that you can review together. This will include all the information your spouse might need to make an informed decision."</p>
                  </div>
                </div>

                <div className="objection-item">
                  <h3>Not Ready to Buy</h3>
                  <p>"I'm not ready to buy right now"</p>
                  <div className="response-section">
                    <h4>Initial Response:</h4>
                    <p>"I understand. When are you planning to make this improvement? We can schedule a consultation for when you're ready to move forward."</p>
                    <h4>Follow-up Response:</h4>
                    <p>"We offer free consultations and estimates with no obligation. This can help you plan for when you're ready to proceed. Would you like to schedule one?"</p>
                  </div>
                </div>

                <div className="objection-item">
                  <h3>Looking for Cheaper Option</h3>
                  <p>"I can get it cheaper elsewhere"</p>
                  <div className="response-section">
                    <h4>Initial Response:</h4>
                    <p>"I appreciate you sharing that. While price is important, it's also crucial to consider the quality, warranty, and service that comes with your purchase. Our products come with a lifetime warranty and professional installation."</p>
                    <h4>Follow-up Response:</h4>
                    <p>"Let me show you a comparison of what's included in our price versus what you might be getting elsewhere. This will help you make a more informed decision."</p>
                  </div>
                </div>
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
          <div className={`modal-content ${isExpanded ? 'expanded' : ''}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>{selectedSimpleModeItem.title}</h2>
              </div>
              <div className="modal-header-buttons">
                <button 
                  className="modal-expand" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3V5C8 5.53043 7.78929 6.03914 7.41421 6.41421C7.03914 6.78929 6.53043 7 6 7H4M4 7H8M4 7V3M16 3V5C16 5.53043 16.2107 6.03914 16.5858 6.41421C16.9609 6.78929 17.4696 7 18 7H20M20 7H16M20 7V3M8 21V19C8 18.4696 7.78929 17.9609 7.41421 17.5858C7.03914 17.2107 6.53043 17 6 17H4M4 17H8M4 17V21M16 21V19C16 18.4696 16.2107 17.9609 16.5858 17.5858C16.9609 17.2107 17.4696 17 18 17H20M20 17H16M20 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 8V4M4 4H8M4 4L9 9M20 8V4M20 4H16M20 4L15 9M4 16V20M4 20H8M4 20L9 15M20 16V20M20 20H16M20 20L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <button 
                  className="modal-next" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextItem();
                  }}
                  disabled={!selectedCategory || !selectedCategory.items || selectedCategory.items.length <= 1}
                  title="Next Item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
            </div>
            <div className={`modal-body ${isExpanded ? 'expanded' : ''}`}>
              {!showMoreOptions ? (
                <div className="objection-item">
                  <div className="objection-header">
                    <h3>{selectedSimpleModeItem.title}</h3>
                    <p className="objection-description">{selectedSimpleModeItem.description}</p>
                  </div>

                  <div className="rebuttal-content">
                    <div className="modal-tags">
                      {selectedSimpleModeItem.tags && selectedSimpleModeItem.tags.map(tag => (
                        <span key={tag} className="modal-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="modal-rebuttal-content">
                    <div className="modal-section-header">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <h3>Rebuttal Responses</h3>
                    </div>
                    {selectedSimpleModeItem.content && (
                      <>
                        <div className="rebuttal-section">
                          <h4 className="rebuttal-section-title">Initial Response</h4>
                          <p className="modal-content-text">
                            {typeof selectedSimpleModeItem.content === 'string' 
                              ? selectedSimpleModeItem.content 
                              : selectedSimpleModeItem.content.pt1 || ''}
                          </p>
                        </div>
                        <div className="rebuttal-section">
                          <h4 className="rebuttal-section-title">Follow-up Response</h4>
                          <p className="modal-content-text">
                            {typeof selectedSimpleModeItem.content === 'string'
                              ? ''
                              : selectedSimpleModeItem.content.pt2 || ''}
                          </p>
                        </div>
                        <div className="rebuttal-actions">
                          <button 
                            className="next-button"
                            onClick={() => handleNextItem()}
                            disabled={!selectedCategory || !selectedCategory.items || selectedCategory.items.length <= 1}
                          >
                            Next Response
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedSimpleModeItem.tips && selectedSimpleModeItem.tips.length > 0 && (
                    <div className="modal-tips">
                      <div className="modal-section-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 16v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <h3>Tips</h3>
                      </div>
                      <div className="tips-list">
                        {selectedSimpleModeItem.tips.map((tip, index) => (
                          <div key={index} className="tip-item">
                            <div className="tip-icon">💡</div>
                            <p className="tip-text">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                          setSelectedSimpleModeItem(category.items.find(item => 
                            item.category === selectedSimpleModeItem.category
                          ));
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
                            setSelectedSimpleModeItem({
                              ...relatedRebuttal,
                              content: {
                                pt1: typeof relatedRebuttal.response === 'string' 
                                  ? relatedRebuttal.response 
                                  : relatedRebuttal.response?.pt1 || relatedRebuttal.objection || '',
                                pt2: typeof relatedRebuttal.response === 'string'
                                  ? ''
                                  : relatedRebuttal.response?.pt2 || relatedRebuttal.followUpResponse || ''
                              }
                            });
                            setShowMoreOptions(false);
                          }}
                        >
                          <h5>{relatedRebuttal.title}</h5>
                          <p>
                            {typeof relatedRebuttal.response === 'string'
                              ? relatedRebuttal.response
                              : relatedRebuttal.response?.pt1 || relatedRebuttal.objection || ''}
                          </p>
                        </div>
                      ))}
                    </div>
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
            
            // Get description based on category name
            let description = '';
            switch (category.name) {
              case 'Not Interested':
                description = 'Handle objections from customers who are not interested in the service';
                break;
              case 'Spouse Consultation':
                description = 'Manage situations where spouse approval is needed';
                break;
              case 'One Legger':
                description = 'Handle single decision-maker scenarios';
                break;
              case 'Not Ready':
                description = 'Address customers who need more time to decide';
                break;
              case 'Curious':
                description = 'Engage with customers who are interested but have questions';
                break;
              case 'Time Concern':
                description = 'Handle scheduling and timing-related objections';
                break;
              case 'Can\'t Afford':
                description = 'Address budget and pricing concerns';
                break;
              case 'Spouse':
                description = 'Manage situations requiring spouse involvement';
                break;
              case 'Price Phone':
                description = 'Handle price-related phone inquiries';
                break;
              case 'Repair':
                description = 'Address repair and maintenance concerns';
                break;
              case 'Government Grants':
                description = 'Information about government assistance programs';
                break;
              case 'Reset Appointment':
                description = 'Handle appointment rescheduling requests';
                break;
              case 'No Request':
                description = 'Manage situations with no specific request';
                break;
              case 'Bad Reviews':
                description = 'Address concerns about negative reviews';
                break;
              default:
                description = `Handle ${category.name.toLowerCase()} related inquiries`;
            }
            
            return {
              id: category.id,
              name: category.name,
              description: description,
              icon: category.icon || '📋',
              color: category.color || '#808080',
              items: categoryRebuttals.map(rebuttal => {
                // Ensure content is properly structured
                let content = {
                  pt1: '',
                  pt2: ''
                };

                // Handle different response formats
                if (typeof rebuttal.response === 'string') {
                  content.pt1 = rebuttal.response;
                } else if (rebuttal.response && typeof rebuttal.response === 'object') {
                  content = {
                    pt1: rebuttal.response.pt1 || rebuttal.response.initial || rebuttal.response.part1 || '',
                    pt2: rebuttal.response.pt2 || rebuttal.response.followup || rebuttal.response.part2 || ''
                  };
                }

                // Fallback to objection if no response
                if (!content.pt1) {
                  content.pt1 = rebuttal.objection || '';
                }

                return {
                  id: rebuttal.id,
                  title: rebuttal.title,
                  description: rebuttal.description || rebuttal.objection || rebuttal.summary || '',
                  category: category.id,
                  content: content,
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
                };
              })
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

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowMoreOptions(false);
    
    // If the category has items, automatically show the first rebuttal
    if (category.items && category.items.length > 0) {
      const firstItem = category.items[0];
      setSelectedSimpleModeItem({
        ...firstItem,
        content: {
          pt1: typeof firstItem.content === 'string' ? firstItem.content : firstItem.content.pt1 || '',
          pt2: typeof firstItem.content === 'string' ? '' : firstItem.content.pt2 || ''
        }
      });
      setShowModal(true);
      setIsExpanded(true);
      
      // Add timeout to ensure modal is rendered before scrolling
      setTimeout(() => {
        const rebuttalSection = document.querySelector('.modal-rebuttal-content');
        if (rebuttalSection) {
          rebuttalSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleItemClick = (item) => {
    setSelectedSimpleModeItem({
      ...item,
      content: {
        pt1: typeof item.content === 'string' ? item.content : item.content.pt1 || '',
        pt2: typeof item.content === 'string' ? '' : item.content.pt2 || ''
      }
    });
    setShowModal(true);
    setIsExpanded(true);
    
    // Add timeout to ensure modal is rendered before scrolling
    setTimeout(() => {
      const rebuttalSection = document.querySelector('.modal-rebuttal-content');
      if (rebuttalSection) {
        rebuttalSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const renderCategoryContent = () => {
    if (!selectedCategory) {
      return (
        <div className="no-category-selected">
          <h3>Select a Category</h3>
          <p>Choose a category from the sidebar to view its items</p>
        </div>
      );
    }

    return (
      <div className="category-content active">
        <div className="category-header">
          <h2>
            <span className="category-icon">
              {selectedCategory.icon}
            </span>
            {selectedCategory.name}
          </h2>
          <p className="category-description">{selectedCategory.description}</p>
        </div>
        <div className="category-items">
          {selectedCategory.items.map((item) => (
            <div
              key={item.id}
              className="category-item"
              onClick={() => handleItemClick(item)}
            >
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSimpleMode = () => {
    return (
      <div className="simple-mode-container">
        <div className="quick-navigation">
          <div className="quick-nav-header">
            <h2>Categories</h2>
          </div>
          <div className="quick-nav-grid">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`quick-nav-card ${selectedCategory?.id === category.id ? 'active' : ''}`}
                data-category={category.id}
                onClick={() => handleCategoryClick(category)}
              >
                <div className="quick-nav-card-content">
                  <div className="quick-nav-icon">
                    {category.icon}
                  </div>
                  <div className="quick-nav-info">
                    <h3>{category.name}</h3>
                    <p className="quick-nav-description">{category.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="simple-mode-grid">
          {renderCategoryContent()}
        </div>
      </div>
    );
  };

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

  // Add keyboard shortcut for admin login
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check for Ctrl/Cmd + Shift + L
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        navigate('/admin/login');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate]);

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
      ) : null}
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
          </div>
        </div>

        {/* Simple Mode Content */}
        {renderSimpleMode()}
      </div>
    </div>
  );
};

export default Home;