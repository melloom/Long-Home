export const dispositions = [
  {
    id: 1,
    name: 'Busy',
    category: 'follow-up',
    description: 'Too busy to meet now but maybe later',
    icon: '⏰',
    color: 'yellow',
    nextSteps: 'Schedule follow-up call in 1-2 weeks',
    tips: ['Ask for specific timeframe when they might be available', 'Note their preferred contact times']
  },
  {
    id: 2,
    name: 'Call Back',
    category: 'follow-up',
    description: 'Generic call me back',
    icon: '📞',
    color: 'blue',
    nextSteps: 'Schedule callback within 24-48 hours',
    tips: ['Get specific time preference', 'Confirm phone number']
  },
  {
    id: 3,
    name: 'Closing Home Soon',
    category: 'follow-up',
    description: 'Lead hasn\'t finalized purchase of home',
    icon: '🏡',
    color: 'orange',
    nextSteps: 'Follow up after closing date',
    tips: ['Get expected closing date', 'Set reminder for post-closing contact']
  },
  {
    id: 4,
    name: 'Speak to Spouse',
    category: 'follow-up',
    description: 'Needs to speak to spouse before scheduling',
    icon: '💑',
    color: 'pink',
    nextSteps: 'Follow up in 24-48 hours',
    tips: ['Encourage scheduling when both can attend', 'Offer evening/weekend times']
  },
  {
    id: 5,
    name: 'Not Set',
    category: 'follow-up',
    description: 'Will be called again',
    icon: '🔄',
    color: 'gray',
    nextSteps: 'Standard follow-up protocol',
    tips: ['Note reason for no appointment', 'Try different approach next call']
  },
  {
    id: 6,
    name: 'Gov/Free',
    category: 'not-qualified',
    description: 'Only interested in free products/government aid',
    icon: '🏛️',
    color: 'cyan',
    nextSteps: 'Mark as not qualified',
    tips: ['Explain our services are not government funded', 'Offer information about financing options']
  },
  {
    id: 7,
    name: 'No Interest/Time',
    category: 'not-qualified',
    description: 'Not interested or too busy',
    icon: '❌',
    color: 'red',
    nextSteps: 'Mark as not interested, possible future contact',
    tips: ['Try to understand their specific concerns', 'Leave door open for future needs']
  },
  {
    id: 8,
    name: 'One Leg',
    category: 'not-qualified',
    description: 'Refuses to involve spouse or decision-maker',
    icon: '👤',
    color: 'indigo',
    nextSteps: 'Attempt spouse inclusion or mark not qualified',
    tips: ['Explain importance of joint decisions', 'Offer to speak with both parties']
  },
  {
    id: 9,
    name: 'Price Over Phone',
    category: 'not-qualified',
    description: 'Wants a ballpark price only',
    icon: '💰',
    color: 'green',
    nextSteps: 'Explain need for in-home estimate',
    tips: ['Emphasize accuracy of in-person quote', 'Mention free consultation value']
  },
  {
    id: 10,
    name: 'Repair Only',
    category: 'not-qualified',
    description: 'Only wants repair or tub liner',
    icon: '🔧',
    color: 'brown',
    nextSteps: 'Explain full replacement benefits or refer to repair services',
    tips: ['Compare repair vs replacement costs', 'Highlight long-term value']
  },
  {
    id: 11,
    name: 'Unqualified',
    category: 'not-qualified',
    description: 'Not a viable lead',
    icon: '🚫',
    color: 'red',
    nextSteps: 'Mark as unqualified, no further contact',
    tips: ['Document reason for disqualification', 'Ensure proper categorization']
  },
  {
    id: 12,
    name: 'Already Completed',
    category: 'not-qualified',
    description: 'Project already done',
    icon: '✅',
    color: 'green',
    nextSteps: 'Remove from active leads',
    tips: ['Confirm completion details', 'Ask about other potential projects']
  },
  {
    id: 13,
    name: 'Commercial',
    category: 'not-qualified',
    description: 'Commercial property or church',
    icon: '🏢',
    color: 'blue',
    nextSteps: 'Refer to commercial division if available',
    tips: ['Confirm property type', 'Get decision maker contact info']
  },
  {
    id: 14,
    name: 'DNC',
    category: 'not-qualified',
    description: 'Do not contact',
    icon: '🔇',
    color: 'red',
    nextSteps: 'Add to do not call list immediately',
    tips: ['Respect request immediately', 'Update all systems accordingly']
  },
  {
    id: 15,
    name: 'Insurance',
    category: 'external',
    description: 'Open insurance claim',
    icon: '🛡️',
    color: 'blue',
    nextSteps: 'Follow up after claim resolution',
    tips: ['Get claim timeline', 'Offer to work with insurance if applicable']
  },
  {
    id: 16,
    name: 'Job Inquiry',
    category: 'not-qualified',
    description: 'Looking for work, not a lead',
    icon: '💼',
    color: 'purple',
    nextSteps: 'Refer to HR or mark as not qualified',
    tips: ['Direct to appropriate department', 'Be polite but clear about purpose']
  },
  {
    id: 17,
    name: 'Language Barrier',
    category: 'technical',
    description: 'Unable to communicate',
    icon: '🗣️',
    color: 'orange',
    nextSteps: 'Attempt translator or bilingual rep',
    tips: ['Try scheduling bilingual representative', 'Use translation services if available']
  },
  {
    id: 18,
    name: 'Did Not Submit',
    category: 'not-qualified',
    description: 'Claims they didn\'t request info',
    icon: '❓',
    color: 'yellow',
    nextSteps: 'Verify lead source and remove if confirmed',
    tips: ['Explain where info came from', 'Apologize and remove if legitimate']
  },
  {
    id: 19,
    name: 'Out of Area',
    category: 'not-qualified',
    description: 'Outside our market',
    icon: '📍',
    color: 'red',
    nextSteps: 'Confirm location and mark not serviceable',
    tips: ['Verify exact address', 'Apologize and explain service area']
  },
  {
    id: 20,
    name: 'Out of Scope',
    category: 'not-qualified',
    description: 'Mobile home or similar we can\'t service',
    icon: '🏕️',
    color: 'brown',
    nextSteps: 'Explain service limitations',
    tips: ['Clarify property type', 'Refer to specialists if possible']
  },
  {
    id: 21,
    name: 'Renter',
    category: 'not-qualified',
    description: 'Can\'t give landlord info',
    icon: '🏠',
    color: 'gray',
    nextSteps: 'Attempt to get landlord contact or mark not qualified',
    tips: ['Explain need for owner permission', 'Offer to contact landlord directly']
  },
  {
    id: 22,
    name: 'Wrong Number',
    category: 'technical',
    description: 'Lead confirmed number is incorrect',
    icon: '📞',
    color: 'red',
    nextSteps: 'Update contact info or mark as bad lead',
    tips: ['Try to get correct number', 'Verify lead source accuracy']
  }
]; 