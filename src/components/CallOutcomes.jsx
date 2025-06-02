import React, { useState } from 'react';
import '../styles/CallOutcomes.css';

const CallOutcomes = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Outcomes' },
    { id: 'follow-up', name: 'Follow-Up Required' },
    { id: 'unqualified', name: 'Unqualified' }
  ];

  const outcomes = [
    // Follow-up outcomes
    {
      id: 1,
      title: 'Follow-Up Required',
      category: 'follow-up',
      summary: 'Leads that need additional contact attempts',
      description: 'These call outcomes indicate the lead should be contacted again with specific strategies for each situation.',
      status: 'neutral',
      nextSteps: [
        'Schedule follow-up call based on specific disposition',
        'Update CRM with detailed notes about conversation',
        'Set appropriate callback date and time',
        'Review any special instructions or preferences noted'
      ],
      subcategories: [
        {
          type: 'Busy',
          description: 'Too busy to meet with us or entertain the project now but maybe later',
          strategy: 'Schedule callback for a more convenient time, acknowledge their busy schedule'
        },
        {
          type: 'Call Back',
          description: 'Generic call me back request',
          strategy: 'Confirm preferred callback time and method of contact'
        },
        {
          type: 'Closing Home Soon',
          description: 'When lead has not finalized purchase of home',
          strategy: 'Follow up after home closing, maintain relationship during transition'
        },
        {
          type: 'Speak to Spouse',
          description: 'Unable to schedule without speaking to spouse',
          strategy: 'Schedule time when both decision-makers can be present'
        },
        {
          type: 'Not Set',
          description: 'Will be called again',
          strategy: 'Follow standard callback protocol with persistence'
        },
        {
          type: 'Gov/Free',
          description: 'Only interested in free product or government grants',
          strategy: 'Educate about available programs and financing options'
        },
        {
          type: 'No Interest/Time',
          description: 'Not interested or not enough time to entertain project',
          strategy: 'Address specific concerns and offer flexible scheduling'
        },
        {
          type: 'One Leg',
          description: 'Refuses to involve spouse or other owners',
          strategy: 'Emphasize importance of including all decision-makers'
        },
        {
          type: 'Price over Phone',
          description: 'Only wants a ballpark price',
          strategy: 'Explain need for in-home assessment for accurate pricing'
        },
        {
          type: 'Repair Only',
          description: 'Only looking for repair/tub liner',
          strategy: 'Present repair vs. replacement value proposition'
        }
      ]
    },
    // Unqualified outcomes
    {
      id: 2,
      title: 'Unqualified',
      category: 'unqualified',
      summary: 'Leads that will not be called again',
      description: 'These call outcomes indicate the lead does not qualify for services or should not be contacted further.',
      status: 'neutral',
      nextSteps: [
        'Mark lead as unqualified in CRM',
        'Document specific reason for disqualification',
        'Remove from active calling lists if requested',
        'Follow compliance protocols for DNC requests'
      ],
      subcategories: [
        {
          type: 'Already Completed',
          description: 'The project is done already – still try to pitch alternate project',
          strategy: 'Mark as unqualified but note potential for future different services'
        },
        {
          type: 'Commercial',
          description: 'A commercial property or church',
          strategy: 'Verify lead source and remove from residential campaigns'
        },
        {
          type: 'DNC',
          description: 'They request that we no longer contact them',
          strategy: 'Immediately add to Do Not Call list and comply with request'
        },
        {
          type: 'Insurance',
          description: 'Open insurance claim',
          strategy: 'Note for potential future contact after claim resolution'
        },
        {
          type: 'Job Inquiry',
          description: 'Not a lead, looking for work',
          strategy: 'Direct to HR department if applicable, remove from sales pipeline'
        },
        {
          type: 'Language Barrier',
          description: 'Unable to communicate',
          strategy: 'Attempt with translator if available, otherwise mark unqualified'
        },
        {
          type: 'Did Not Submit',
          description: 'Claims they did not submit their information – still try rebuttal!',
          strategy: 'Use rebuttal techniques, but respect if they remain adamant'
        },
        {
          type: 'Out of Area',
          description: 'Unable to add market segment',
          strategy: 'Confirm service area boundaries and remove if outside territory'
        },
        {
          type: 'Out of Scope',
          description: 'Unable to do work – no matter what – walk in tub in a mobile home/flat roof on mobile home',
          strategy: 'Explain service limitations and mark permanently unqualified'
        },
        {
          type: 'Renter',
          description: 'Rents, unable or unwilling to give landlord info',
          strategy: 'Explain homeowner requirement and remove from homeowner campaigns'
        },
        {
          type: 'Wrong Number',
          description: 'Someone answers and confirms we have the wrong number',
          strategy: 'Update contact information if new number provided, otherwise remove'
        }
      ]
    }
  ];

  const filteredOutcomes = selectedCategory === 'all' 
    ? outcomes 
    : outcomes.filter(o => o.category === selectedCategory);

  return (
    <div className="outcomes-container">
      <div className="outcomes-content">
        <div className="outcomes-header">
          <h1 className="outcomes-title">Call Outcome Categories</h1>
          <button
            onClick={() => onNavigate('home')}
            className="outcomes-home-button"
          >
            Home
          </button>
        </div>

        <div className="outcomes-layout">
          {/* Sidebar */}
          <div className="outcomes-sidebar">
            <h2 className="outcomes-sidebar-title">Categories</h2>
            <div className="outcomes-categories">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`outcomes-category-button ${selectedCategory === category.id ? 'active' : ''}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="outcomes-main">
            {filteredOutcomes.map(outcome => (
              <div key={outcome.id} className={`outcomes-card ${outcome.status}`}>
                <div className="outcomes-content-inner">
                  <div className="outcomes-header-card">
                    <h3 className="outcomes-title-card">{outcome.title}</h3>
                    <span className={`outcomes-status ${outcome.status}`}>
                      {outcome.status === 'neutral' ? 'Action Required' : outcome.status}
                    </span>
                  </div>
                  <p className="outcomes-summary">{outcome.summary}</p>
                  <p className="outcomes-description">{outcome.description}</p>
                  
                  <div className="outcomes-next-steps">
                    <h4>Next Steps:</h4>
                    <ul>
                      {outcome.nextSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="outcomes-subcategories">
                    <h4>Specific Outcomes & Strategies:</h4>
                    {outcome.subcategories.map((sub, index) => (
                      <div key={index} className="outcome-subcategory">
                        <strong>{sub.type}:</strong> {sub.description}
                        <br />
                        <em>Strategy: {sub.strategy}</em>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallOutcomes;