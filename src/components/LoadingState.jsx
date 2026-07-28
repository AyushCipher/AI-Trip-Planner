import React from 'react';
import './LoadingState.css';

const LoadingState = () => {
  return (
    <div className="loading-state" aria-live="polite" aria-busy="true">
      <div className="loading-state__skeleton-header"></div>
      
      <div className="loading-state__days">
        {[1, 2, 3].map((day) => (
          <div key={day} className="loading-state__day-card">
            <div className="loading-state__day-title"></div>
            <div className="loading-state__stops">
              {[1, 2, 3].map((stop) => (
                <div key={stop} className="loading-state__stop"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <p className="loading-state__text">Creating your itinerary...</p>
    </div>
  );
};

export default LoadingState;
