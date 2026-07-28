import React from 'react';
import './EmptyState.css';

const examples = [
  '3 days in Tokyo on a budget',
  'Week-long family trip to Italy',
  'Romantic weekend in Paris',
  'Adventure in the Swiss Alps'
];

const EmptyState = ({ onExampleClick }) => {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">✈️</div>
      <h2 className="empty-state__title">Plan Your Dream Trip</h2>
      <p className="empty-state__subtitle">
        Describe your ideal trip below and our AI will create a detailed day-by-day itinerary for you.
      </p>
      
      <div className="empty-state__examples">
        <p className="empty-state__examples-label">Try asking for:</p>
        <div className="empty-state__chips">
          {examples.map((example, index) => (
            <button 
              key={index}
              className="empty-state__chip"
              onClick={() => onExampleClick && onExampleClick(example)}
              aria-label={`Use example prompt: ${example}`}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
