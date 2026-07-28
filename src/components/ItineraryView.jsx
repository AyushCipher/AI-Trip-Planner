import React from 'react';
import { useDispatch } from 'react-redux';
import { removeStop } from '../store/itinerarySlice';
import DayCard from './DayCard';
import './ItineraryView.css';

export default function ItineraryView({ data }) {
  const dispatch = useDispatch();

  const handleRemoveStop = (dayId, stopId) => {
    dispatch(removeStop({ dayId, stopId }));
  };

  if (!data) {
    return <div className="itinerary-view">Loading itinerary...</div>;
  }

  return (
    <div className="itinerary-view">
      <header className="itinerary-header">
        <h1 className="itinerary-header__title">{data.tripTitle}</h1>
        <div className="itinerary-header__destination">
          <span role="img" aria-label="pin">📍</span> {data.destination}
        </div>
        <div className="itinerary-header__stats">
          <div className="stat-item">
            <span role="img" aria-label="duration">🗓️</span> {data.duration}
          </div>
          <div className="stat-item">
            <span role="img" aria-label="travelers">👥</span> {data.travelers}
          </div>
          <div className="stat-item">
            <span role="img" aria-label="budget">💰</span> {data.estimatedBudget}
          </div>
        </div>
      </header>

      <div className="itinerary-timeline">
        {data.days && data.days.map((day, index) => (
          <div 
            key={day.id} 
            className="itinerary-timeline__item"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="itinerary-timeline__line"></div>
            <DayCard day={day} onRemoveStop={handleRemoveStop} />
          </div>
        ))}
      </div>
    </div>
  );
}
