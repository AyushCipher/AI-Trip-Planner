import React, { useState, useEffect, useRef } from 'react';
import './TripInput.css';

const MAX_CHARS = 1000;

const TripInput = ({ onSubmit, isLoading, initialValue = '' }) => {
  const [text, setText] = useState(initialValue);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (initialValue !== undefined) {
      setText(initialValue);
    }
  }, [initialValue]);

  const handleChange = (e) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARS) {
      setText(newText);
    }
  };

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      onSubmit(text);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSubmitDisabled = !text.trim() || isLoading;

  return (
    <div className="trip-input">
      <div className="trip-input__container">
        <textarea
          ref={textareaRef}
          className="trip-input__textarea"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Describe your dream trip... e.g., A 5-day adventure in Japan for 2 people with a moderate budget, interested in food, temples, and nightlife"
          rows={4}
          maxLength={MAX_CHARS}
          aria-label="Trip description"
        />
        <div className="trip-input__footer">
          <span 
            className={`trip-input__char-count ${text.length >= MAX_CHARS ? 'trip-input__char-count--max' : ''}`}
            aria-live="polite"
          >
            {text.length} / {MAX_CHARS}
          </span>
          <button
            className="trip-input__submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="trip-input__spinner" aria-hidden="true"></span>
            ) : (
              <span aria-hidden="true">✨</span>
            )}
            <span className="trip-input__submit-text">Generate Itinerary</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripInput;
