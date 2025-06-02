export const dispositions = [
  {
    id: 1,
    name: 'Set Lead',
    category: 'scheduled',
    description: 'Lead has been set and scheduled for an appointment. This is a confirmed appointment where the customer has agreed to meet with a sales representative.',
    icon: '✅',
    color: 'green',
    nextSteps: 'Confirm appointment details and prepare for visit',
    tips: [
      'Verify appointment time and date',
      'Confirm customer contact information',
      'Prepare necessary materials',
      'Review customer history',
      'Check for any special requirements'
    ],
    examples: [
      'Customer agreed to meet on Tuesday at 2 PM',
      'Appointment confirmed for Saturday morning',
      'Customer scheduled for evening consultation'
    ],
    subcategories: [
      'New Appointment',
      'Rescheduled Appointment',
      'Follow-up Appointment'
    ]
  },
  {
    id: 2,
    name: 'Busy',
    category: 'scheduled',
    description: 'Customer is currently too busy to meet but has expressed interest in scheduling for a later time. This indicates potential interest but requires follow-up.',
    icon: '⏰',
    color: 'yellow',
    nextSteps: 'Schedule follow-up call in 1-2 weeks',
    tips: [
      'Ask for specific timeframe when they might be available',
      'Note their preferred contact times',
      'Document their current busy period',
      'Suggest alternative meeting times',
      'Offer flexible scheduling options'
    ],
    examples: [
      'Customer in middle of home renovation',
      'Customer traveling for next two weeks',
      'Customer has family visiting'
    ],
    subcategories: [
      'Temporarily Busy',
      'Seasonal Busy',
      'Work Schedule Conflict'
    ]
  },
  {
    id: 3,
    name: 'Call Back',
    category: 'scheduled',
    description: 'Customer has requested a callback at a specific time. This is a direct request for follow-up communication.',
    icon: '📞',
    color: 'blue',
    nextSteps: 'Schedule callback within 24-48 hours',
    tips: [
      'Get specific time preference',
      'Confirm phone number',
      'Note reason for callback',
      'Set reminder for callback time',
      'Prepare relevant information for callback'
    ],
    examples: [
      'Customer will be home after 6 PM',
      'Customer needs to check schedule first',
      'Customer requested weekend callback'
    ],
    subcategories: [
      'Time-Specific Callback',
      'Information Gathering Callback',
      'Decision Maker Callback'
    ]
  },
  {
    id: 4,
    name: 'Closing Home Soon',
    category: 'scheduled',
    description: 'Customer is in the process of closing on their new home and wants to schedule after the closing is complete. This indicates high potential as they are actively in the home buying process.',
    icon: '🏡',
    color: 'orange',
    nextSteps: 'Follow up after closing date',
    tips: [
      'Get expected closing date',
      'Set reminder for post-closing contact',
      'Document new home details',
      'Prepare post-closing follow-up plan',
      'Note any specific requirements for new home'
    ],
    examples: [
      'Closing scheduled for next month',
      'Waiting for final loan approval',
      'Home inspection pending'
    ],
    subcategories: [
      'Pending Closing',
      'Post-Closing Follow-up',
      'New Home Owner'
    ]
  },
  {
    id: 5,
    name: 'Speak to Spouse',
    category: 'scheduled',
    description: 'Customer needs to consult with their spouse or partner before making a decision. This is common for major home improvement decisions.',
    icon: '💑',
    color: 'pink',
    nextSteps: 'Follow up in 24-48 hours',
    tips: [
      'Encourage scheduling when both can attend',
      'Offer evening/weekend times',
      'Prepare information for both decision makers',
      'Document spouse\'s availability',
      'Note any specific concerns to address'
    ],
    examples: [
      'Spouse out of town until weekend',
      'Need to discuss budget together',
      'Waiting for partner\'s input on style'
    ],
    subcategories: [
      'Joint Decision Required',
      'Spouse Consultation',
      'Family Decision'
    ]
  },
  {
    id: 6,
    name: 'Not Set',
    category: 'scheduled',
    description: 'Initial contact made but no appointment set. This requires follow-up with a different approach or timing.',
    icon: '🔄',
    color: 'gray',
    nextSteps: 'Standard follow-up protocol',
    tips: [
      'Note reason for no appointment',
      'Try different approach next call',
      'Document best contact times',
      'Identify potential objections',
      'Plan alternative presentation'
    ],
    examples: [
      'Customer needs to think about it',
      'Timing not right',
      'Need more information'
    ],
    subcategories: [
      'Initial Contact',
      'Pending Decision',
      'Information Gathering'
    ]
  },
  {
    id: 7,
    name: 'Cancelled',
    category: 'cancelled',
    description: 'Appointment was cancelled',
    icon: '🚫',
    color: 'red',
    nextSteps: 'Document cancellation reason and reschedule if possible',
    tips: ['Record cancellation reason', 'Offer alternative dates', 'Update scheduling system']
  },
  {
    id: 8,
    name: 'Rescheduled',
    category: 'rescheduled',
    description: 'Appointment has been rescheduled',
    icon: '🔄',
    color: 'orange',
    nextSteps: 'Confirm new appointment details',
    tips: ['Verify new date and time', 'Update all systems', 'Send confirmation to customer']
  },
  {
    id: 9,
    name: 'Gov/Free',
    category: 'not-qualified',
    description: 'Only interested in free products/government aid',
    icon: '🏛️',
    color: 'cyan',
    nextSteps: 'Mark as not qualified',
    tips: ['Explain our services are not government funded', 'Offer information about financing options']
  },
  {
    id: 10,
    name: 'No Interest/Time',
    category: 'not-qualified',
    description: 'Not interested or too busy',
    icon: '❌',
    color: 'red',
    nextSteps: 'Mark as not interested, possible future contact',
    tips: ['Try to understand their specific concerns', 'Leave door open for future needs']
  },
  {
    id: 11,
    name: 'One Leg',
    category: 'not-qualified',
    description: 'Refuses to involve spouse or decision-maker',
    icon: '👤',
    color: 'indigo',
    nextSteps: 'Attempt spouse inclusion or mark not qualified',
    tips: ['Explain importance of joint decisions', 'Offer to speak with both parties']
  },
  {
    id: 12,
    name: 'Price Over Phone',
    category: 'not-qualified',
    description: 'Wants a ballpark price only',
    icon: '💰',
    color: 'green',
    nextSteps: 'Explain need for in-home estimate',
    tips: ['Emphasize accuracy of in-person quote', 'Mention free consultation value']
  },
  {
    id: 13,
    name: 'Repair Only',
    category: 'not-qualified',
    description: 'Customer is only interested in repair services or tub liner installation, not a full replacement. This may indicate a need for education about full replacement benefits.',
    icon: '🔧',
    color: 'brown',
    nextSteps: 'Explain full replacement benefits or refer to repair services',
    tips: [
      'Compare repair vs replacement costs',
      'Highlight long-term value',
      'Address common misconceptions',
      'Provide repair service information',
      'Document repair requirements'
    ],
    examples: [
      'Only wants to fix current issues',
      'Budget constraints',
      'Temporary solution needed'
    ],
    subcategories: [
      'Repair Service',
      'Tub Liner',
      'Partial Solution'
    ]
  },
  {
    id: 14,
    name: 'Unqualified',
    category: 'not-qualified',
    description: 'Lead does not meet basic qualification criteria for our services. This could be due to various factors such as location, property type, or budget constraints.',
    icon: '🚫',
    color: 'red',
    nextSteps: 'Mark as unqualified, no further contact',
    tips: [
      'Document reason for disqualification',
      'Ensure proper categorization',
      'Note any potential future qualification',
      'Update CRM records',
      'Remove from active leads'
    ],
    examples: [
      'Outside service area',
      'Property type not suitable',
      'Budget below minimum threshold'
    ],
    subcategories: [
      'Location Unqualified',
      'Property Unqualified',
      'Budget Unqualified'
    ]
  },
  {
    id: 15,
    name: 'Already Completed',
    category: 'not-qualified',
    description: 'Customer has already completed the project with another provider or has no need for our services.',
    icon: '✅',
    color: 'green',
    nextSteps: 'Remove from active leads',
    tips: [
      'Confirm completion details',
      'Ask about other potential projects',
      'Document competitor information',
      'Note any future needs',
      'Update customer status'
    ],
    examples: [
      'Project completed last month',
      'Using different solution',
      'No longer interested'
    ],
    subcategories: [
      'Project Completed',
      'Alternative Solution',
      'No Longer Interested'
    ]
  },
  {
    id: 16,
    name: 'Commercial',
    category: 'not-qualified',
    description: 'Lead is for a commercial property or church, which may require different services or pricing structures.',
    icon: '🏢',
    color: 'blue',
    nextSteps: 'Refer to commercial division if available',
    tips: [
      'Confirm property type',
      'Get decision maker contact info',
      'Document commercial requirements',
      'Note any special considerations',
      'Prepare commercial service information'
    ],
    examples: [
      'Church property',
      'Office building',
      'Retail location'
    ],
    subcategories: [
      'Religious Property',
      'Business Property',
      'Institutional Property'
    ]
  },
  {
    id: 17,
    name: 'DNC',
    category: 'not-qualified',
    description: 'Customer has requested to be placed on the Do Not Call list. This must be respected immediately and documented properly.',
    icon: '🔇',
    color: 'red',
    nextSteps: 'Add to do not call list immediately',
    tips: [
      'Respect request immediately',
      'Update all systems accordingly',
      'Document DNC request',
      'Remove from all marketing lists',
      'Note reason if provided'
    ],
    examples: [
      'Explicit DNC request',
      'Legal requirement',
      'Customer preference'
    ],
    subcategories: [
      'Explicit DNC',
      'Legal DNC',
      'Temporary DNC'
    ]
  },
  {
    id: 18,
    name: 'Insurance',
    category: 'external',
    description: 'Customer has an open insurance claim that needs to be resolved before proceeding with our services.',
    icon: '🛡️',
    color: 'blue',
    nextSteps: 'Follow up after claim resolution',
    tips: [
      'Get claim timeline',
      'Offer to work with insurance if applicable',
      'Document claim details',
      'Note insurance company information',
      'Prepare insurance-related materials'
    ],
    examples: [
      'Water damage claim',
      'Property damage claim',
      'Insurance inspection pending'
    ],
    subcategories: [
      'Active Claim',
      'Pending Approval',
      'Claim Resolution'
    ]
  },
  {
    id: 19,
    name: 'Job Inquiry',
    category: 'not-qualified',
    description: 'Looking for work, not a lead',
    icon: '💼',
    color: 'purple',
    nextSteps: 'Refer to HR or mark as not qualified',
    tips: ['Direct to appropriate department', 'Be polite but clear about purpose']
  },
  {
    id: 20,
    name: 'Language Barrier',
    category: 'technical',
    description: 'Unable to communicate',
    icon: '🗣️',
    color: 'orange',
    nextSteps: 'Attempt translator or bilingual rep',
    tips: ['Try scheduling bilingual representative', 'Use translation services if available']
  },
  {
    id: 21,
    name: 'Did Not Submit',
    category: 'not-qualified',
    description: 'Claims they didn\'t request info',
    icon: '❓',
    color: 'yellow',
    nextSteps: 'Verify lead source and remove if confirmed',
    tips: ['Explain where info came from', 'Apologize and remove if legitimate']
  },
  {
    id: 22,
    name: 'Out of Area',
    category: 'not-qualified',
    description: 'Outside our market',
    icon: '📍',
    color: 'red',
    nextSteps: 'Confirm location and mark not serviceable',
    tips: ['Verify exact address', 'Apologize and explain service area']
  },
  {
    id: 23,
    name: 'Out of Scope',
    category: 'not-qualified',
    description: 'Mobile home or similar we can\'t service',
    icon: '🏕️',
    color: 'brown',
    nextSteps: 'Explain service limitations',
    tips: ['Clarify property type', 'Refer to specialists if possible']
  },
  {
    id: 24,
    name: 'Renter',
    category: 'not-qualified',
    description: 'Can\'t give landlord info',
    icon: '🏠',
    color: 'gray',
    nextSteps: 'Attempt to get landlord contact or mark not qualified',
    tips: ['Explain need for owner permission', 'Offer to contact landlord directly']
  },
  {
    id: 25,
    name: 'Wrong Number',
    category: 'technical',
    description: 'Lead confirmed number is incorrect',
    icon: '📞',
    color: 'red',
    nextSteps: 'Update contact info or mark as bad lead',
    tips: ['Try to get correct number', 'Verify lead source accuracy']
  }
]; 