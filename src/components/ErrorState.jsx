import React from 'react';
import './ErrorState.css';

const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="error-state" role="alert">
      <div className="error-state__icon" aria-hidden="true">⚠️</div>
      <h3 className="error-state__title">Something went wrong</h3>
      <p className="error-state__message">
        {message || "We encountered an unexpected error while planning your trip."}
      </p>
      {onRetry && (
        <button 
          className="error-state__retry-btn" 
          onClick={onRetry}
          aria-label="Try again"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
