export const quickActions = [
  {
    id: 'urgent-1',
    title: 'Price Concern',
    description: 'Quick response for customer price concerns',
    icon: '💰',
    category: 'price-phone',
    content: {
      pt1: 'I understand you have concerns about the price. To help you make an informed decision, would you like to hear about the value and benefits included?',
      pt2: 'We offer various options to meet different budgets. Would you like to discuss your specific needs and find a solution that works for you?'
    },
    steps: [
      'Acknowledge price concern',
      'Explain value proposition',
      'Present options',
      'Find suitable solution'
    ],
    tips: [
      'Focus on value',
      'Offer multiple options',
      'Be flexible with solutions'
    ],
    keywords: ['price', 'expensive', 'cost', 'budget', 'afford']
  },
  {
    id: 'urgent-2',
    title: 'Scheduling Conflict',
    description: 'Handle immediate scheduling conflicts',
    icon: '📅',
    category: 'time-concern',
    content: {
      pt1: 'I understand you need to reschedule. No problem at all! What time would work better for you?',
      pt2: 'To ensure we have everything ready for your new appointment time, would you like me to send a reminder with the key points we\'ll cover?'
    },
    steps: [
      'Acknowledge rescheduling need',
      'Find new convenient time',
      'Confirm new appointment',
      'Send reminder information'
    ],
    tips: [
      'Be flexible with rescheduling',
      'Confirm new time clearly',
      'Provide reminder information'
    ],
    keywords: ['schedule', 'time', 'conflict', 'reschedule', 'urgent']
  },
  {
    id: 'urgent-3',
    title: 'Service Quality',
    description: 'Address immediate service quality concerns',
    icon: '⭐',
    category: 'service-quality',
    content: {
      pt1: 'I understand you have concerns about our service quality. Could you please share more details about your experience?',
      pt2: 'Thank you for bringing this to our attention. We take service quality very seriously and would like to make this right for you. What would be the best way to address your concerns?'
    },
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
    keywords: ['quality', 'service', 'issue', 'problem', 'concern']
  },
  {
    id: 'urgent-4',
    title: 'Not Interested',
    description: 'Handle immediate disinterest',
    icon: '❌',
    category: 'not-interested',
    content: {
      pt1: 'I understand you\'re not interested at the moment. May I ask what specific concerns you have? This would help me provide better information.',
      pt2: 'Many customers find our solutions valuable once they understand the full benefits. Would you like to hear about how we\'ve helped others in similar situations?'
    },
    steps: [
      'Acknowledge disinterest',
      'Ask about specific concerns',
      'Present relevant benefits',
      'Share success stories'
    ],
    tips: [
      'Be respectful of their position',
      'Ask about specific concerns',
      'Share relevant benefits'
    ],
    keywords: ['not interested', 'no interest', 'dont want', 'not buying']
  },
  {
    id: 'urgent-5',
    title: 'Spouse Consultation',
    description: 'Handle spouse consultation requests',
    icon: '👥',
    category: 'spouse-consultation',
    content: {
      pt1: 'I understand you need to speak with your spouse first. That\'s completely normal and shows you\'re making a thoughtful decision. Would it be helpful if I provided some information that you could share with them?',
      pt2: 'Many of our customers find it helpful to have their spouse join the consultation. Would you like to schedule a time when you\'re both available? We can also send over some materials for you to review together.'
    },
    steps: [
      'Acknowledge the need for spouse consultation',
      'Offer to provide information for sharing',
      'Suggest scheduling a joint consultation',
      'Provide materials for review'
    ],
    tips: [
      'Be understanding and supportive',
      'Offer flexible scheduling options',
      'Provide clear information for sharing'
    ],
    keywords: ['spouse', 'husband', 'wife', 'talk to', 'discuss']
  }
]; 