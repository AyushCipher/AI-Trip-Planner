import React, { useState } from 'react';
import StopCard from './StopCard';
import './DayCard.css';

export default function DayCard({ day, onRemoveStop }) {
  const [expanded, setExpanded] = useState(true);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="day-card">
      <div 
        className="day-card__header" 
        onClick={toggleExpand}
        role="button"
        aria-expanded={expanded}
      >
        <div className="day-card__header-left">
          <div className="day-card__number">{day.dayNumber}</div>
          <h2 className="day-card__title">{day.title}</h2>
        </div>
        <div className="day-card__header-right">
          <span className="day-card__stop-count">
            {day.stops?.length || 0} stops
          </span>
          <span className={`day-card__chevron ${expanded ? 'day-card__chevron--expanded' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      <div className={`day-card__content-wrapper ${expanded ? 'day-card__content-wrapper--expanded' : ''}`}>
        <div className="day-card__content">
          <div className="stops-list" data-day-id={day.id}>
            {!day.stops || day.stops.length === 0 ? (
              <p className="day-card__empty-msg">No stops planned for this day.</p>
            ) : (
              day.stops.map((stop) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  onRemove={(stopId) => onRemoveStop(day.id, stopId)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
