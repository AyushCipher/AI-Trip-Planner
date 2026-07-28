import React, { useState } from 'react';
import './StopCard.css';

const CATEGORY_COLORS = {
  accommodation: '#6366f1',
  food: '#f59e0b',
  activity: '#10b981',
  transport: '#3b82f6',
  shopping: '#ec4899',
  nightlife: '#8b5cf6',
};

const CATEGORY_EMOJIS = {
  accommodation: '🏨',
  food: '🍽️',
  activity: '🎯',
  transport: '🚗',
  shopping: '🛍️',
  nightlife: '🌙',
};

export default function StopCard({ stop, onRemove, dragHandleProps }) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleRemoveClick = () => {
    if (confirmRemove) {
      onRemove(stop.id);
    } else {
      setConfirmRemove(true);
      setTimeout(() => setConfirmRemove(false), 3000); // reset after 3s
    }
  };

  const categoryColor = CATEGORY_COLORS[stop.category] || 'var(--color-border)';
  const categoryEmoji = CATEGORY_EMOJIS[stop.category] || '📍';

  return (
    <div className="stop-card" style={{ '--card-border-color': categoryColor }}>
      <div
        className="stop-card__drag-handle"
        {...(dragHandleProps || {})}
        aria-label="Drag handle"
      >
        ⠿
      </div>

      <div className="stop-card__time">
        {stop.time}
      </div>

      <div className="stop-card__content">
        <h3 className="stop-card__name">{stop.name}</h3>
        <p className="stop-card__description">{stop.description}</p>
        {stop.tips && (
          <p className="stop-card__tips">
            <span role="img" aria-label="tip">💡</span> {stop.tips}
          </p>
        )}
      </div>

      <div className="stop-card__meta">
        <span
          className="stop-card__category"
          style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
        >
          {categoryEmoji} <span className="stop-card__category-text">{stop.category}</span>
        </span>
        {stop.duration && (
          <span className="stop-card__duration">⏱️ {stop.duration}</span>
        )}
        {stop.estimatedCost && (
          <span className="stop-card__cost">💰 {stop.estimatedCost}</span>
        )}
      </div>

      <button
        className={`stop-card__remove-btn ${confirmRemove ? 'stop-card__remove-btn--confirm' : ''}`}
        onClick={handleRemoveClick}
        aria-label="Remove stop"
      >
        {confirmRemove ? 'Remove?' : '✕'}
      </button>
    </div>
  );
}
